package mining

import (
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"log"
	"time"

	"github.com/golang-collections/go-datastructures/queue"
	"github.com/mitchellh/hashstructure"
)

const (
	timeFormat   = "2006-01-02 15:04:05"
	clockSkewMin = 5
)

var (
	latestDataQueue = queue.New(0)
)

// BlockData is the data for a block
type BlockData struct {
	Timestamp  string
	Author     string
	CommitHash string
	FileHashes map[string]string
}

// Block keeps block headers
type Block struct {
	Data          BlockData
	PrevBlockHash string
	Hash          string
}

// Blockchain keeps a sequence of Blocks
type Blockchain struct {
	Blocks      []*Block
	StagedBlock *Block
}

func (b *Block) setHash() {
	b.Hash = b.ComputeHash()
}

// ComputeHash calculates the block hash
func (b *Block) ComputeHash() string {
	dHash, _ := hashstructure.Hash(b.Data, nil)
	bytes := make([]byte, 8)
	binary.LittleEndian.PutUint64(bytes, dHash)
	hash := sha256.Sum256(append([]byte(b.PrevBlockHash), bytes...))
	return hex.EncodeToString(hash[:])
}

// NewBlock creates and returns Block
func NewBlock(data BlockData, prevBlockHash string) *Block {
	block := &Block{Data: data, PrevBlockHash: prevBlockHash}
	block.setHash()
	return block
}

// NewGenesisBlock creates and returns genesis Block
func NewGenesisBlock() *Block {
	return NewBlock(BlockData{
		Timestamp:  "",
		Author:     "ProSe",
		CommitHash: "421fdea6ec87b5531d196bb7498c96fb84f2880a",
		FileHashes: map[string]string{},
	}, "")
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
func (bc *Blockchain) ProcessNewBlock(data BlockData) *Block {
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
func GetLatestTransactionData() (data BlockData, err error) {
	var val []interface{}
	if val, err = latestDataQueue.Get(1); err != nil {
		return
	}
	data = val[0].(BlockData)
	return
}

// EnqueueTransactionData enqueues the latest transaction data
func EnqueueTransactionData(data BlockData) {
	log.Printf("Enqueue %v", data)
	latestDataQueue.Put(data)
}

// NewTransactionDataExists returns true if there is enqueued transaction data
func NewTransactionDataExists() bool {
	return latestDataQueue.Len() > 0
}

// TimeToString returns the string representation of a time
func TimeToString(t time.Time) string {
	return t.Format(timeFormat)
}

// StringToTime returns the time representation of a string
func StringToTime(s string) (t time.Time, err error) {
	t, err = time.Parse(timeFormat, s)
	return
}

// IsBlockValid determines if the newBlock is a valid successor to oldBlock
func (bc *Blockchain) IsBlockValid(block *Block) bool {
	prevHash := bc.Blocks[len(bc.Blocks)-1].Hash
	if block.PrevBlockHash != prevHash {
		log.Printf("Block failed validation for prev hash: expected %s but got %s\n", prevHash, block.PrevBlockHash)
		return false
	}
	hash := block.ComputeHash()
	if block.Hash != hash {
		log.Printf("Block failed validation for hash: expected %s but got %s\n", hash, block.Hash)
		return false
	}
	t, err := StringToTime(block.Data.Timestamp)
	if err != nil {
		log.Printf("Failed to parse time %s\n", block.Data.Timestamp)
		return false
	}
	now := time.Now().UTC()
	if now.Sub(t).Minutes() > clockSkewMin {
		log.Printf("Block failed validation for clock skew: %s does not fall within %d minutes of %s\n",
			block.Data.Timestamp,
			clockSkewMin, TimeToString(now))
		return false
	}
	return true
}
