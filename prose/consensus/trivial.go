package consensus

import (
	"log"

	"github.com/ProSe-Dev/prose/prose/mining"
	"github.com/perlin-network/noise/skademlia"
)

// TrivialConsensus is a trivial consensus mode
type TrivialConsensus struct {
	Client     *skademlia.Client
	Blockchain *mining.Blockchain
}

// HandleAddBlock handles adding a new blockchain block
func (t *TrivialConsensus) HandleAddBlock(data mining.BlockData) bool {
	log.Printf("[TRIVIAL] Adding new block")
	t.Blockchain.ProcessNewBlock(data)
	t.Blockchain.Commit()
	return true
}
