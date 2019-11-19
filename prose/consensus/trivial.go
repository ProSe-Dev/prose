package consensus

import (
	"log"

	"github.com/ProSe-Dev/prose/prose/mining"
	"github.com/ProSe-Dev/prose/prose/proto"
	"github.com/perlin-network/noise/skademlia"
)

// TrivialConsensus is a trivial consensus mode
type TrivialConsensus struct {
	Client     *skademlia.Client
	Blockchain *mining.Blockchain
}

// Start handles adding a new blockchain block
func (t *TrivialConsensus) Start() {
	log.Printf("[TRIVIAL] Starting")
	data, err := mining.PeekLatestTransactionData()
	if err != nil {
		panic(err)
	}
	t.Blockchain.ProcessNewBlock(*data)
	t.Blockchain.Commit()
	mining.RemoveTransactionData(data)
}

// GetInfo returns the consensus info
func (t *TrivialConsensus) GetInfo() *proto.ConsensusInfo {
	return &proto.ConsensusInfo{
		ConsensusMode: string(TrivialMode),
		Iteration:     0,
	}
}

// UpdateInfo updates consensus info
func (t *TrivialConsensus) UpdateInfo(info *proto.ConsensusInfo) {
}
