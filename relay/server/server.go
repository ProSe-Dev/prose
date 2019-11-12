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
	"google.golang.org/grpc"
)

var (
	relayNode *node.Node
)

// Message body expected to be received from client
type Message struct {
	Author     string
	CommitHash string
	FileHashes map[string]string
}

func run(port uint64) error {
	portStr := strconv.FormatUint(port, 10)
	mux := makeMuxRouter()
	log.Printf("Listening on %s", portStr)
	s := &http.Server{
		Addr:           ":" + portStr,
		Handler:        mux,
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
	muxRouter.HandleFunc("/", handleWriteBlock).Methods("POST")
	// curl localhost:8080 -X POST -d @sample_payload.json
	// curl localhost:8080 -X POST -d @C:\Users\Alison\go\src\github.com\ProSe-Dev\prose\relay\sample_payload.json
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
			Author:     m.Author,
			CommitHash: m.CommitHash,
			FileHashes: m.FileHashes,
			Timestamp:  timestamp,
		}}
		client := proto.NewBlockchainClient(conn)
		resp, err := client.AddBlock(context.Background(), m)
		if err != nil {
			log.Printf("[ERROR] unable to add block: %v", err)
		}
		log.Printf("[%s] block submitted: %v\n", conn.Target(), resp.ACK)
	})
	// the relay node needs to participate too!
	mining.EnqueueTransactionData(mining.BlockData{
		Author:     m.Author,
		CommitHash: m.CommitHash,
		FileHashes: m.FileHashes,
		Timestamp:  timestamp,
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
	log.Fatal(run(port)) // web server logic
}
