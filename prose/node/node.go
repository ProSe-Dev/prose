package node

import (
	"context"
	"fmt"
	"log"
	"net"
	"strconv"

	"github.com/ProSe-Dev/prose/prose/consensus"
	"github.com/ProSe-Dev/prose/prose/gossip"
	"github.com/ProSe-Dev/prose/prose/mining"
	"github.com/ProSe-Dev/prose/prose/proto"
	"github.com/ProSe-Dev/prose/prose/statemachine"
	"github.com/perlin-network/noise"
	"github.com/perlin-network/noise/cipher"
	"github.com/perlin-network/noise/handshake"
	"github.com/perlin-network/noise/skademlia"
	"google.golang.org/grpc"
)

var (
	stateNascent statemachine.StateCode = statemachine.NextAvailableStateCode("nascent")
	stateIdle    statemachine.StateCode = statemachine.NextAvailableStateCode("idle")
)

// Node implements proto.BlockchainServer interface
type Node struct {
	Blockchain   *mining.Blockchain
	Client       *skademlia.Client
	Server       *grpc.Server
	Serve        func() error
	Consensus    consensus.Consensus
	StateMachine *statemachine.StateMachine
}

// AddBlock : adds new block to blockchain
func (n *Node) AddBlock(ctx context.Context, in *proto.AddBlockRequest) (resp *proto.AddBlockResponse, err error) {
	if err = n.StateMachine.Enforce(stateIdle); err != nil {
		return
	}
	// TODO: use a queue and also handle more data than just a string
	mining.UpdateLatestTransactionData(in.Data)
	result := n.Consensus.HandleAddBlock(in.Data)
	resp = &proto.AddBlockResponse{
		ACK: result,
	}
	return
}

// GetBlockchain : returns blockchain
func (n *Node) GetBlockchain(ctx context.Context, in *proto.GetBlockchainRequest) (*proto.GetBlockchainResponse, error) {
	resp := new(proto.GetBlockchainResponse)
	for _, b := range n.Blockchain.Blocks {
		resp.Blocks = append(resp.Blocks, &proto.Block{
			PrevBlockHash: b.PrevBlockHash,
			Data:          b.Data,
			Hash:          b.Hash,
		})
	}
	return resp, nil
}

// NewNode creates a new Node that is ready to listen
func NewNode(port uint16, initNode string, isMiner bool, consensusMode consensus.Mode) (node *Node, err error) {
	node = &Node{
		Blockchain:   mining.NewBlockchain(),
		StateMachine: statemachine.NewStateMachine(stateNascent),
	}
	listener, err := net.Listen("tcp", ":"+fmt.Sprint(port))
	if err != nil {
		return
	}
	keys, err := skademlia.NewKeys(1, 2)
	if err != nil {
		return
	}
	addr := net.JoinHostPort("127.0.0.1", strconv.Itoa(listener.Addr().(*net.TCPAddr).Port))
	node.Client = skademlia.NewClient(addr, keys, skademlia.WithC1(1), skademlia.WithC2(1))
	node.Client.SetCredentials(noise.NewCredentials(addr, handshake.NewECDH(), cipher.NewAEAD(), node.Client.Protocol()))

	if initNode != "" {
		if _, err = node.Client.Dial(initNode); err != nil {
			return
		}
		log.Printf("Dialed %s", initNode)
		node.Client.Bootstrap()
		log.Printf("Bootstrapped with network: %s", gossip.GetNetwork(node.Client))
	}
	node.Server = node.Client.Listen()
	proto.RegisterBlockchainServer(node.Server, node)
	node.Consensus = consensus.RegisterConsensusServer(node.Blockchain, node.StateMachine, node.Server, node.Client, consensusMode)
	node.Serve = func() error {
		node.StateMachine.SetState(stateIdle)
		return node.Server.Serve(listener)
	}
	return
}
