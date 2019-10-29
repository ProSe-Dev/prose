package mining

import (
	"crypto/sha256"
	"encoding/hex"
	"time"
)

// Block structure for a single transaction
type Block struct {
	Index     int
	Timestamp string
	PrevHash  string
	Hash      string

	Author     string
	CommitHash string
	FileHashes map[string]string
}

// Blockchain containing all Blocks
var Blockchain []Block

// calculateHash determines the hash value of a single Block
func calculateHash(block Block) string {
	record := string(block.Index) + block.Timestamp + block.PrevHash + block.Author + block.CommitHash
	for _, hash := range block.FileHashes {
		record += hash
	}

	h := sha256.New()
	h.Write([]byte(record))
	hashed := h.Sum(nil)
	return hex.EncodeToString(hashed)
}

// GenerateBlock creates a new Block with the given parameters
func GenerateBlock(oldBlock Block, author string, commitHash string, fileHashes map[string]string) (Block, error) {
	var newBlock Block
	newBlock.Index = oldBlock.Index + 1
	newBlock.Timestamp = time.Now().String()
	newBlock.PrevHash = oldBlock.Hash

	newBlock.Author = author
	newBlock.CommitHash = commitHash
	newBlock.FileHashes = fileHashes

	newBlock.Hash = calculateHash(newBlock)
	return newBlock, nil
}

// IsBlockValid determines if the newBlock is a valid successor to oldBlock
func IsBlockValid(newBlock, oldBlock Block) bool {
	if oldBlock.Index+1 != newBlock.Index {
		return false
	}
	if oldBlock.Hash != newBlock.PrevHash {
		return false
	}
	if calculateHash(newBlock) != newBlock.Hash {
		return false
	}
	return true
}

// ReplaceChain will replace the current Blockchain if the newBlocks are more 'up-to-date'
func ReplaceChain(newBlocks []Block) {
	// TODO: this is for Proof of Work, which just takes the longest chain
	if len(newBlocks) > len(Blockchain) {
		Blockchain = newBlocks
	}
}
