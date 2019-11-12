package consensus

import (
	"github.com/ProSe-Dev/prose/prose/mining"
	"github.com/ProSe-Dev/prose/prose/proto"
	"github.com/ProSe-Dev/prose/prose/statemachine"
	"github.com/perlin-network/noise/skademlia"
	"google.golang.org/grpc"
)

// Mode is a consensus mode
type Mode string

const (
	// TrivialMode is the trivial consensus mode
	TrivialMode Mode = "trivial"

	// PBFTMode is the PBFT consensus mode
	PBFTMode Mode = "pbft"

	// DefaultConsensus is the default consensus mode
	DefaultConsensus Mode = PBFTMode
)

// Consensus is a consensus implementation
type Consensus interface {
	Start()
}

// RegisterConsensusServer registers the server using the desired consensus mode
func RegisterConsensusServer(
	blockchain *mining.Blockchain,
	statemachine *statemachine.StateMachine,
	server *grpc.Server,
	client *skademlia.Client,
	mode Mode,
) Consensus {
	switch mode {
	case PBFTMode:
		pbft := PBFTConsensus{
			Client:       client,
			Blockchain:   blockchain,
			StateMachine: statemachine,
		}
		proto.RegisterPBFTServer(server, &pbft)
		return &pbft
	case TrivialMode:
		t := TrivialConsensus{
			Client:     client,
			Blockchain: blockchain,
		}
		return &t
	}
	return nil
}

// GetConsensusModes returns all active consensus modes
func GetConsensusModes() []Mode {
	return []Mode{
		PBFTMode,
	}
}
