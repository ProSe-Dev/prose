package node

import (
	"strconv"

	"github.com/ProSe-Dev/prose/prose/consensus"
	"github.com/ProSe-Dev/prose/prose/gossip"
	"github.com/ProSe-Dev/prose/prose/statemachine"
	"github.com/perlin-network/noise"
	"github.com/perlin-network/noise/cipher/aead"
	"github.com/perlin-network/noise/handshake/ecdh"
	"github.com/perlin-network/noise/log"
	"github.com/perlin-network/noise/protocol"
	"github.com/perlin-network/noise/skademlia"
)

const (
	defaultHost = "0.0.0.0"
)

var (
	stateRelayStandby = statemachine.NextAvailableStateCode("RelayStandby")
	stateMinerStandby = statemachine.NextAvailableStateCode("MinerStandby")

	// DefaultConsensus is the default consensus protocol
	DefaultConsensus = consensus.NewPBFT()
)

func registerMessages(node *noise.Node) {
	statemachine.RegisterMessage(node, (*newTransactionMessage)(nil), newTransactionMessageHandler,
		statemachine.StateTransition{
			SrcState: stateMinerStandby, // dst set by consensus.Begin
		})
}

func setup(node *noise.Node, isMiner bool) {

	opcodeTransaction := noise.RegisterMessage(noise.NextAvailableOpcode(), (*newTransactionMessage)(nil))
	opcodePreprepare := noise.RegisterMessage(noise.NextAvailableOpcode(), (*consensus.PrePrepareMessage)(nil))

	consensus.SetMode(node, DefaultConsensus)
	//registerMessages(node)
	//consensus.RegisterMessages(node)
	// make sure we set the proper state and thus set of message listeners / handlers
	if isMiner {
		statemachine.SetState(node, stateMinerStandby)
	} else {
		statemachine.SetState(node, stateRelayStandby)
	}
	node.OnPeerInit(func(node *noise.Node, peer *noise.Peer) error {
		peer.OnConnError(func(node *noise.Node, peer *noise.Peer, err error) error {
			log.Warn().Msgf("Got an error: %v", err)
			return nil
		})
		peer.OnDisconnect(func(node *noise.Node, peer *noise.Peer) error {
			log.Info().Msgf("Peer %v has disconnected.", peer.RemoteIP().String()+":"+strconv.Itoa(int(peer.RemotePort())))
			return nil
		})
		//go statemachine.NewHandler(node, peer)

		go func() {
			for {
				select {
				case msg := <-peer.Receive(opcodePreprepare):
					consensus.PrePrepareMessageHandler(node, peer, msg)
				case msg := <-peer.Receive(opcodeTransaction):
					newTransactionMessageHandler(node, peer, msg)
				}
			}
		}()

		return nil
	})
}

func bootstrapNode(node *noise.Node, initNode string) error {
	if initNode != "" {
		peer, err := node.Dial(initNode)
		if err != nil {
			return err
		}
		skademlia.WaitUntilAuthenticated(peer)
		gossip.BootstrapNetwork(node)
		log.Info().Msgf("Bootstrapped using %s", gossip.GetNodeID(peer.Node()))
	}
	return nil
}

// NewNode creates a new Node that is ready to listen
func NewNode(port uint16, initNode string, isMiner bool) (node *noise.Node, err error) {
	params := noise.DefaultParams()
	params.Keys = skademlia.RandomKeys()
	params.Host = defaultHost
	params.Port = port
	if node, err = noise.NewNode(params); err != nil {
		return
	}
	p := protocol.New()
	p.Register(ecdh.New())
	p.Register(aead.New())
	p.Register(skademlia.New())
	p.Register(NewProSeVersionBlock(DefaultConsensus))
	p.Enforce(node)
	if err = bootstrapNode(node, initNode); err != nil {
		return nil, err
	}
	setup(node, isMiner)
	return
}
