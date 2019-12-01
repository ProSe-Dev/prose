package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"crypto/sha256"

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

func sign(data []byte) {
	return hex.EncodeToString(sha256.Sum256(data)[:])
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

	var trackedFiles = result["trackedFiles"]
	var fileHashes = map[string]string{}
	var byteArray []byte("prose")
	var contact = result["contact"]
	byteArray = append(byteArray, []byte(contact)...)
	var hashData = ""
	for _, file := range trackedFiles {
		b, err := ioutil.ReadFile(file);
		if err != nil {
			log.Printf("[ProSe] FAILED: could not open file %s:\n%v\n", file, err);
		}
		hash := sha256.Sum256(b)
		fileHashes[file] = hash
		hashData += hash
	}
	var hashOfFileHashes = hex.EncodeToString(sha256.Sum256([]byte(hashData))[:])
	byteArray = append(byteArray, []byte(hashOfFileHashes)...)
	var signature = sign(byteArray)
	values := map[string]interface{}{
		"PublicKey":  result["publicKey"],
		"Signature":  signature,
		"ProjectID":  result["projectID"],
		"CommitHash": ref.Hash().String(),
		"FileHashes": fileHashes}

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
