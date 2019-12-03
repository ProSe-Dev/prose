package server

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/ProSe-Dev/prose/prose/gossip"
	"github.com/ProSe-Dev/prose/prose/mining"
	"github.com/ProSe-Dev/prose/prose/node"
	"github.com/ProSe-Dev/prose/prose/proto"
	"github.com/gorilla/mux"
	"github.com/mitchellh/hashstructure"
	"github.com/rs/cors"
	"google.golang.org/grpc"
)

var (
	relayNode        *node.Node
	projectMap       = map[uint64][]*mining.Block{}
	fileToProjectMap = map[string]map[uint64]struct{}{}
)

type projectKey struct {
	PublicKey string
	ProjectID string
}

// Message body expected to be received from client
type Message struct {
	PublicKey  string
	Signature  string
	ProjectID  string
	CommitHash string
	FileHashes map[string]string
	MetaData   map[string]string
}

func run(port uint64) error {
	portStr := strconv.FormatUint(port, 10)
	mux := makeMuxRouter()
	log.Printf("Listening on %s", portStr)
	c := cors.New(cors.Options{
		AllowCredentials: true,
		Debug:            false,
	})
	handler := c.Handler(mux)
	s := &http.Server{
		Addr:           ":" + portStr,
		Handler:        handler,
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}
	if err := s.ListenAndServe(); err != nil {
		return err
	}
	return nil
}

func makeMuxRouter() http.Handler {
	muxRouter := mux.NewRouter()
	muxRouter.HandleFunc("/", handleGetBlockchain).Methods("GET")
	muxRouter.HandleFunc("/search", handleSearchBlockchain).Methods("GET")
	muxRouter.HandleFunc("/transaction", handleWriteBlock).Methods("POST")
	return muxRouter
}

func handleGetBlockchain(w http.ResponseWriter, r *http.Request) {
	bytes, err := json.MarshalIndent(relayNode.Blockchain, "", "  ")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	io.WriteString(w, string(bytes))
}

func handleSearchBlockchain(w http.ResponseWriter, r *http.Request) {
	fileHashes, ok := r.URL.Query()["filehash"]

	if !ok || len(fileHashes[0]) < 1 {
		respondWithJSON(w, r, http.StatusBadRequest, r.Body)
		return
	}

	fileHash := fileHashes[0]
	projKeySet, ok := fileToProjectMap[fileHash]
	projList := [][]*mining.Block{}
	if !ok {
		bytes, err := json.MarshalIndent(projList, "", "  ")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		io.WriteString(w, string(bytes))
		return
	}

	for projKey := range projKeySet {
		projList = append(projList, projectMap[projKey])
	}

	bytes, err := json.MarshalIndent(projList, "", "  ")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	io.WriteString(w, string(bytes))
	return
}

func handleWriteBlock(w http.ResponseWriter, r *http.Request) {
	var m Message

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&m); err != nil {
		respondWithJSON(w, r, http.StatusBadRequest, r.Body)
		return
	}
	defer r.Body.Close()
	timestamp := mining.TimeToString(time.Now().UTC())
	gossip.Broadcast(relayNode.Client, func(conn *grpc.ClientConn) {
		m := &proto.AddBlockRequest{Data: &proto.BlockData{
			PublicKey:  m.PublicKey,
			Signature:  m.Signature,
			ProjectID:  m.ProjectID,
			CommitHash: m.CommitHash,
			FileHashes: m.FileHashes,
			Timestamp:  timestamp,
			MetaData:   m.MetaData,
		}}
		client := proto.NewBlockchainClient(conn)
		resp, err := client.AddBlock(context.Background(), m)
		if err != nil {
			log.Printf("[ERROR] unable to add block: %v", err)
			return
		}
		log.Printf("[%s] block submitted: %v\n", conn.Target(), resp.ACK)
	})
	// the relay node needs to participate too!
	mining.EnqueueTransactionData(&mining.BlockData{
		PublicKey:  m.PublicKey,
		Signature:  m.Signature,
		ProjectID:  m.ProjectID,
		CommitHash: m.CommitHash,
		FileHashes: m.FileHashes,
		Timestamp:  timestamp,
		MetaData:   m.MetaData,
	})
	// if we're in the middle of consensus already, just do nothing
	if relayNode.StateMachine.State == node.StateIdle {
		relayNode.Consensus.Start()
	}
	respondWithJSON(w, r, http.StatusCreated, r.Body)
}

func respondWithJSON(w http.ResponseWriter, r *http.Request, code int, payload interface{}) {
	response, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("HTTP 500: Internal Server Error"))
		return
	}
	w.WriteHeader(code)
	w.Write(response)
}

// Start begins the relay server using the specified relay node
func Start(n *node.Node, port uint64) {
	relayNode = n
	go updateMaps()
	log.Fatal(run(port)) // web server logic
}

func updateMaps() {
	index := len(relayNode.Blockchain.Blocks)
	for _, block := range relayNode.Blockchain.Blocks {
		updateMapWithBlock(block)
	}

	for {
		select {
		case <-mining.BlockProcessedChan:
			for index < len(relayNode.Blockchain.Blocks) {
				updateMapWithBlock(relayNode.Blockchain.Blocks[index])
				index++
			}
		}
	}
}

func updateMapWithBlock(block *mining.Block) {
	key := projectKey{
		PublicKey: block.Data.PublicKey,
		ProjectID: block.Data.ProjectID,
	}
	hash, _ := hashstructure.Hash(key, nil)
	projectVersions, ok := projectMap[hash]
	if ok {
		projectMap[hash] = append(projectVersions, block)
	} else {
		projectMap[hash] = []*mining.Block{block}
	}

	for _, fileHash := range block.Data.FileHashes {
		projectKeySet, ok := fileToProjectMap[fileHash]
		if ok {
			projectKeySet[hash] = struct{}{}
		} else {
			fileToProjectMap[fileHash] = map[uint64]struct{}{hash: {}}
		}
	}
}
