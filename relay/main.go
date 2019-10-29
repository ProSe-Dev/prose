package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/ProSe-Dev/prose/blockchain/mining"
	"github.com/davecgh/go-spew/spew"
	"github.com/gorilla/mux"
)

// Message body expected to be received from client
type Message struct {
	Author     string
	CommitHash string
	FileHashes map[string]string
}

func run() error {
	mux := makeMuxRouter()
	httpAddr := "8080"
	log.Println("Listening on ", httpAddr)
	s := &http.Server{
		Addr:           ":" + httpAddr,
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
	bytes, err := json.MarshalIndent(mining.Blockchain, "", "  ")
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

	// spew.Dump(m)
	oldBlock := mining.Blockchain[len(mining.Blockchain)-1]
	newBlock, err := mining.GenerateBlock(oldBlock, m.Author, m.CommitHash, m.FileHashes)
	if err != nil {
		respondWithJSON(w, r, http.StatusInternalServerError, m)
		return
	}
	if mining.IsBlockValid(newBlock, oldBlock) {
		newBlockchain := append(mining.Blockchain, newBlock)
		mining.ReplaceChain(newBlockchain)
		spew.Dump(mining.Blockchain) //pretty prints structs into console
	}

	respondWithJSON(w, r, http.StatusCreated, newBlock)
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

func main() {
	go func() { // blockchain logic
		t := time.Now()
		genesisBlock := mining.Block{Index: 0, Timestamp: t.String(), Hash: "", PrevHash: ""}
		spew.Dump(genesisBlock)
		mining.Blockchain = append(mining.Blockchain, genesisBlock)
	}()

	log.Fatal(run()) // web server logic
}
