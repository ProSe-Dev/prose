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

// Start handles adding a new blockchain block
func (t *TrivialConsensus) Start() {
	log.Printf("[TRIVIAL] Starting")
	data, err := mining.GetLatestTransactionData()
	if err != nil {
		panic(err)
	}
	t.Blockchain.ProcessNewBlock(data)
	t.Blockchain.Commit()
}
