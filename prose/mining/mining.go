package mining

import (
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/mitchellh/hashstructure"
)

const (
	timeFormat   = "2006-01-02T15:04:05.000Z0700"
	clockSkewMin = 5
)

var (
	latestDataQueue   = []uint64{}
	queuedDataMap     = map[uint64]*BlockData{}
	queuedDataMapLock sync.Mutex

	// BlockProcessedChan is a channel for indicating blocks have been processed
	BlockProcessedChan = make(chan int)
)

// BlockData is the data for a block
type BlockData struct {
	Timestamp  string
	PublicKey  string
	Signature  string
	ProjectID  string
	CommitHash string
	FileHashes map[string]string
	MetaData   map[string]string
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
		PublicKey:  "",
		Signature:  "ProSe",
		ProjectID:  "",
		CommitHash: "421fdea6ec87b5531d196bb7498c96fb84f2880a",
		FileHashes: map[string]string{},
		MetaData:   map[string]string{},
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
	select {
	case BlockProcessedChan <- 1:
	default:
	}
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

// IsBlockDataQueued returns true if block data is queued
func IsBlockDataQueued(data *BlockData) bool {
	queuedDataMapLock.Lock()
	defer queuedDataMapLock.Unlock()
	dHash, _ := hashstructure.Hash(data, nil)
	_, ok := queuedDataMap[dHash]
	return ok
}

// RemoveTransactionData removes the specified transaction data
// TODO: may want to be more efficient here
func RemoveTransactionData(data *BlockData) (err error) {
	queuedDataMapLock.Lock()
	defer queuedDataMapLock.Unlock()
	dHash, _ := hashstructure.Hash(data, nil)
	if len(latestDataQueue) == 0 {
		err = errors.New("queue is already empty")
		return
	}
	tmp := latestDataQueue[:0]
	for _, h := range latestDataQueue {
		if h != dHash {
			tmp = append(tmp, h)
		}
	}
	latestDataQueue = tmp
	if _, ok := queuedDataMap[dHash]; !ok {
		err = errors.New("data not found in map")
		return
	}
	delete(queuedDataMap, dHash)
	return
}

// PeekLatestTransactionData returns the latest transaction data
func PeekLatestTransactionData() (data *BlockData, err error) {
	if len(latestDataQueue) == 0 {
		err = errors.New("tried peeking from empty queue")
		return
	}
	dHash := latestDataQueue[0]
	data = queuedDataMap[dHash]
	return
}

// EnqueueTransactionData enqueues the latest transaction data
func EnqueueTransactionData(data *BlockData) {
	queuedDataMapLock.Lock()
	defer queuedDataMapLock.Unlock()
	dHash, _ := hashstructure.Hash(data, nil)
	queuedDataMap[dHash] = data
	latestDataQueue = append(latestDataQueue, dHash)
}

// NewTransactionDataExists returns true if there is enqueued transaction data
func NewTransactionDataExists() bool {
	return len(latestDataQueue) > 0
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
func (bc *Blockchain) IsBlockValid(block *Block) error {
	prevHash := bc.Blocks[len(bc.Blocks)-1].Hash
	if block.PrevBlockHash != prevHash {
		return fmt.Errorf("block failed validation for prev hash: expected %s but got %s", prevHash, block.PrevBlockHash)
	}
	hash := block.ComputeHash()
	if block.Hash != hash {
		return fmt.Errorf("Block failed validation for hash: expected %s but got %s", hash, block.Hash)
	}
	t, err := StringToTime(block.Data.Timestamp)
	if err != nil {
		return fmt.Errorf("failed to parse time %s", block.Data.Timestamp)
	}
	now := time.Now().UTC()
	if now.Sub(t).Minutes() > clockSkewMin {
		return fmt.Errorf("block failed validation for clock skew: %s does not fall within %d minutes of %s",
			block.Data.Timestamp,
			clockSkewMin, TimeToString(now))
	}
	return nil
}
