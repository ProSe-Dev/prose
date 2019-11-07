package mining

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
)

var (
	latestData string
)

// Block keeps block headers
type Block struct {
	Data          string
	PrevBlockHash string
	Hash          string
}

// Blockchain keeps a sequence of Blocks
type Blockchain struct {
	Blocks      []*Block
	StagedBlock *Block
}

// setHash calculates and sets block hash
func (b *Block) setHash() {
	hash := sha256.Sum256([]byte(b.PrevBlockHash + b.Data))
	b.Hash = hex.EncodeToString(hash[:])
}

// NewBlock creates and returns Block
func NewBlock(data string, prevBlockHash string) *Block {
	block := &Block{data, prevBlockHash, ""}
	block.setHash()

	return block
}

// NewGenesisBlock creates and returns genesis Block
func NewGenesisBlock() *Block {
	return NewBlock("Genesis Block", "")
}

// StageBlock stages a block
func (bc *Blockchain) StageBlock(b *Block) {
	bc.StagedBlock = b
}

// Commit commits a staged block to the blockchain
func (bc *Blockchain) Commit() (err error) {
	if bc.StagedBlock == nil {
		return errors.New("no staged block")
	}
	bc.Blocks = append(bc.Blocks, bc.StagedBlock)
	bc.StagedBlock = nil
	return
}

// ProcessNewBlock saves provided data as a block in the blockchain
func (bc *Blockchain) ProcessNewBlock(data string) *Block {
	prevBlock := bc.Blocks[len(bc.Blocks)-1]
	newBlock := NewBlock(data, prevBlock.Hash)
	bc.StageBlock(newBlock)
	return newBlock
}

// NewBlockchain creates a new Blockchain with genesis Block
func NewBlockchain() *Blockchain {
	return &Blockchain{Blocks: []*Block{NewGenesisBlock()}}
}

// GetLatestTransactionData returns the latest transaction data
func GetLatestTransactionData() string {
	return latestData
}

// UpdateLatestTransactionData updates the latest transaction data
func UpdateLatestTransactionData(data string) {
	latestData = data
}
