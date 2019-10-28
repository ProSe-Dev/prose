package consensus

import (
	"github.com/ProSe-Dev/prose/prose/statemachine"
	"github.com/perlin-network/noise"
	"github.com/perlin-network/noise/log"
)

// Mode is the consensus mode
type Mode interface {
	registerMessages(*noise.Node)
	begin(*noise.Node)
}

const (
	nodeConsensusModeKey = "@CONSENSUS_MODE"
)

var (
	// StateConsensusComplete describes completed consensus
	StateConsensusComplete = statemachine.NextAvailableStateCode("ConsensusComplete")
)

// GetMode returns the consensus mode of a node
func GetMode(node *noise.Node) Mode {
	return node.Get(nodeConsensusModeKey).(Mode)
}

// SetMode sets the consensus mode of a node
func SetMode(node *noise.Node, consensus Mode) {
	node.Set(nodeConsensusModeKey, consensus)
}

// RegisterMessages registers the messages for a node
func RegisterMessages(node *noise.Node) {
	consensus := GetMode(node)
	consensus.registerMessages(node)
}

// Begin starts consensus
func Begin(node *noise.Node) {
	log.Info().Msg("Starting consensus")
	consensus := GetMode(node)
	consensus.begin(node)
}
