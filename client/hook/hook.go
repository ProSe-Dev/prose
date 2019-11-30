package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"gopkg.in/src-d/go-git.v4"
)

const (
	configFile = ".prose"
)

var (
	server = getenv("RELAY_URL", "http://localhost:8080")
)

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if len(value) == 0 {
		return fallback
	}
	return value
}

func main() {
	r, err := git.PlainOpen(".")
	if err != nil {
		log.Printf("[ProSe] FAILED: could not open repository:\n%v\n", err)
		return
	}

	ref, err := r.Head()
	if err != nil {
		log.Printf("[ProSe] FAILED: could not determine revision:\n%v\n", err)
		return
	}

	jsonFile, err := os.Open(configFile)
	if err != nil {
		fmt.Println(err)
	}
	defer jsonFile.Close()

	byteValue, _ := ioutil.ReadAll(jsonFile)

	var result map[string]interface{}
	json.Unmarshal([]byte(byteValue), &result)

	values := map[string]interface{}{
		"PublicKey":  result["publicKey"],
		"Signature":  result["signature"],
		"ProjectID":  result["projectID"],
		"CommitHash": ref.Hash().String(),
		"FileHashes": result["fileHashes"]}

	fmt.Printf("[ProSe] Submitting block: %v\n", values)

	jsonValue, _ := json.Marshal(values)
	resp, err := http.Post(server+"/transaction", "application/json", bytes.NewBuffer(jsonValue))
	if err != nil {
		log.Printf("[ProSe] FAILED: could not contact server:\n%v\n", err)
		return
	}

	if resp.StatusCode == 201 {
		fmt.Printf("[ProSe] Successfully submitted block\n")
	} else {
		fmt.Printf("[ProSe] Bad response from server:\n%v\n", resp)
	}
}
