package mining

import (
	"bytes"
	"encoding/gob"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/perlin-network/noise/payload"
)

// Transaction represents the information needed to build a block
type Transaction struct {
	CommitHash string
	Signature  string
}

// Block is a single block in the blockchain
type Block struct {
	CommitHash     string
	Signature      string
	Timestamp      time.Time
	HashOfPrevious string
}

const (
	timeLayout       = "2006-01-02T15:04:05.000Z"
	clockSkewMinutes = 5

	// NodeTransactionDataKey is the data key for transaction data
	NodeTransactionDataKey = "@MINING_TRANSACTION_DATA"
)

func (b Block) Read(reader payload.Reader) (err error) {
	var (
		rawTimestamp string
	)
	if b.CommitHash, err = reader.ReadString(); err != nil {
		return
	}
	if b.Signature, err = reader.ReadString(); err != nil {
		return
	}
	if rawTimestamp, err = reader.ReadString(); err != nil {
		return
	}
	if b.Timestamp, err = time.Parse(timeLayout, rawTimestamp); err != nil {
		return
	}
	if b.HashOfPrevious, err = reader.ReadString(); err != nil {
		return
	}
	return
}

func (b Block) Write(writer payload.Writer) payload.Writer {
	return writer.
		WriteString(b.CommitHash).
		WriteString(b.Signature).
		WriteString(b.Timestamp.Format(timeLayout)).
		WriteString(b.HashOfPrevious)
}

// Blockchain is a chain of blocks
type Blockchain struct {
	Length uint64
	Blocks []Block
}

var (
	currentBlockchain *Blockchain
	tempBlock         *Block
)

func init() {
	currentBlockchain = &Blockchain{
		Length: 2,
		Blocks: []Block{
			Block{
				CommitHash:     "abcdefg",
				Signature:      "a1b2c3d4",
				Timestamp:      time.Now(),
				HashOfPrevious: "",
			},
			Block{
				CommitHash:     "hijklmno",
				Signature:      "h1i2j3k4",
				Timestamp:      time.Now(),
				HashOfPrevious: "e5f6g7h8",
			},
		},
	}
}

// ComputeHash returns the SHA-256 hash of the block
func (b *Block) ComputeHash() string {
	// TODO: compute SHA-256
	return "e5f6g7h8"
}

// GetPreviousHash returns the hash of the last block in the blockchain
func GetPreviousHash() string {
	return GetLastBlock().ComputeHash()
}

// GetLastBlock returns the last block in the blockchain
func GetLastBlock() *Block {
	return &currentBlockchain.Blocks[len(currentBlockchain.Blocks)-1]
}

// StageBlock stages a block
func StageBlock(b *Block) *Block {
	tempBlock = b
	return tempBlock
}

// CommitBlock adds a block to the blockchain
func CommitBlock() {
	currentBlockchain.Blocks = append(GetBlockchain().Blocks, *tempBlock)
	tempBlock = nil
}

// ProcessNewBlock creates a new block and stages it
func ProcessNewBlock(commitHash string, signature string) *Block {
	block := Block{
		CommitHash:     commitHash,
		Signature:      signature,
		Timestamp:      time.Now(),
		HashOfPrevious: GetPreviousHash(),
	}
	return StageBlock(&block)
}

// ValidateBlock validates a block
func ValidateBlock(b *Block) (err error) {
	if time.Now().Sub(b.Timestamp) > clockSkewMinutes {
		return errors.New("Failed clock skew test")
	}
	if GetLastBlock().ComputeHash() != b.HashOfPrevious {
		return fmt.Errorf("expected hash %s but got %s", GetLastBlock().ComputeHash(), b.HashOfPrevious)
	}
	return
}

// GetBlockchain returns the blockchain
func GetBlockchain() *Blockchain {
	return currentBlockchain
}

// ToBytes converts the blockchain to bytes
func (blockchain *Blockchain) ToBytes() {
	var network bytes.Buffer
	enc := gob.NewEncoder(&network)
	err := enc.Encode(blockchain)
	if err != nil {
		log.Fatal("encode error:", err)
	}
}

// Decode updates the blockchain properties using a buffer
func (blockchain *Blockchain) Decode(bb bytes.Buffer) {
	dec := gob.NewDecoder(&bb)
	err := dec.Decode(blockchain)
	if err != nil {
		log.Fatal("encode error:", err)
	}
}
