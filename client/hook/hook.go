package main

import (
	"bytes"
	"crypto/ed25519"
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/user"

	"gopkg.in/src-d/go-git.v4"
)

const (
	configFile = ".prose"
)

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if len(value) == 0 {
		return fallback
	}
	return value
}

func sign(data []byte) (signature string, err error) {
	var usr *user.User
	usr, err = user.Current()
	if err != nil {
		return
	}
	var privateKeyPath = usr.HomeDir + "/.prose/id_ed25519"
	var privateKeyContent []byte
	privateKeyContent, err = ioutil.ReadFile(privateKeyPath)
	if err != nil {
		return
	}
	var key interface{}
	key, err = x509.ParsePKCS8PrivateKey(privateKeyContent)
	switch key := key.(type) {
	case ed25519.PrivateKey:
		signature = hex.EncodeToString(ed25519.Sign(key, data))
	}
	return
}

func main() {
	log.Printf("[ProSe] Started commit hook")
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

	jsonFile, err := os.Open(".git/" + configFile)
	if err != nil {
		fmt.Println(err)
	}
	defer jsonFile.Close()

	byteValue, _ := ioutil.ReadAll(jsonFile)

	var result map[string]interface{}
	json.Unmarshal([]byte(byteValue), &result)

	var trackedFiles = result["trackedFiles"].([]interface{})
	var fileHashes = map[string]string{}
	var byteArray = []byte("prose")
	var contact = result["contact"].(string)
	byteArray = append(byteArray, []byte(contact)...)
	var hashData = ""
	for _, filepath := range trackedFiles {
		filepathStr := filepath.(string)
		b, err := ioutil.ReadFile(filepathStr)
		if err != nil {
			log.Printf("[ProSe] FAILED: could not open file %s:\n%v\n", filepathStr, err)
		}
		sum := sha256.Sum256(b)
		hash := hex.EncodeToString(sum[:])
		fileHashes[filepathStr] = hash
		hashData += hash
	}
	sum := sha256.Sum256([]byte(hashData))
	var hashOfFileHashes = hex.EncodeToString(sum[:])
	byteArray = append(byteArray, []byte(hashOfFileHashes)...)
	signature, err := sign(byteArray)
	if err != nil {
		log.Printf("[ProSe] FAILED: could not sign:\n%v\n", err)
		return
	}
	var server = result["relayHost"].(string)
	values := map[string]interface{}{
		"PublicKey":  result["publicKey"],
		"Signature":  signature,
		"ProjectID":  result["projectID"],
		"CommitHash": ref.Hash().String(),
		"FileHashes": fileHashes,
		"MetaData": map[string]interface{}{
			"contact": result["contact"].(string),
		},
	}

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
