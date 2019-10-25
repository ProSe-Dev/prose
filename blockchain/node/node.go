package node

import (
	"github.com/ProSe-Dev/prose/blockchain/consensus"
	"github.com/perlin-network/noise"
	"github.com/perlin-network/noise/cipher/aead"
	"github.com/perlin-network/noise/handshake/ecdh"
	"github.com/perlin-network/noise/protocol"
	"github.com/perlin-network/noise/skademlia"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

const (
	// DefaultHost is the default host to listen on
	DefaultHost = "0.0.0.0"

	// DefaultConsensus is the default consensus protocol
	DefaultConsensus = consensus.PBFT
)

// ProSeNode is a generic blockchain node
type ProSeNode struct {
	IsMiner   bool
	Consensus consensus.Type
	Node      *noise.Node
}

// NewNode creates a new Node
func NewNode(port uint16, initNode string, isMiner bool) (pnode *ProSeNode, err error) {
	var (
		node *noise.Node
		peer *noise.Peer
	)
	params := noise.DefaultParams()
	params.Keys = skademlia.RandomKeys()
	params.Host = DefaultHost
	params.Port = port
	if node, err = noise.NewNode(params); err != nil {
		return
	}
	defer node.Kill()
	p := protocol.New()
	p.Register(ecdh.New())
	p.Register(aead.New())
	p.Register(skademlia.New())
	p.Register(NewProSeVersionBlock(DefaultConsensus))
	p.Enforce(node)
	pnode = &ProSeNode{IsMiner: isMiner, Consensus: DefaultConsensus, Node: node}
	zerolog.SetGlobalLevel(zerolog.WarnLevel)
	if initNode != "" {
		if peer, err = node.Dial(initNode); err != nil {
			return
		}
		skademlia.WaitUntilAuthenticated(peer)
		peers := skademlia.FindNode(node, protocol.NodeID(node).(skademlia.ID), skademlia.BucketSize(), 8)
		log.Warn().Msgf("Bootstrapped with peers: %+v", peers)
	}
	node.Listen()
	return
}
