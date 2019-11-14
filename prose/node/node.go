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
	// StateNascent is the state for node initialization
	StateNascent statemachine.StateCode = statemachine.NextAvailableStateCode("nascent")

	// StateIdle is the state for an idle node waiting for requests
	StateIdle statemachine.StateCode = statemachine.NextAvailableStateCode("idle")
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
	data := mining.BlockData{
		Author:     in.Data.Author,
		Timestamp:  in.Data.Timestamp,
		CommitHash: in.Data.CommitHash,
		FileHashes: in.Data.FileHashes,
	}
	mining.EnqueueTransactionData(data)
	// if we're in the middle of consensus already, skip
	if n.StateMachine.State == StateIdle {
		n.Consensus.Start()
	}
	resp = &proto.AddBlockResponse{
		ACK: true,
	}
	return
}

// GetBlockchain : returns blockchain
func (n *Node) GetBlockchain(ctx context.Context, in *proto.GetBlockchainRequest) (*proto.GetBlockchainResponse, error) {
	resp := new(proto.GetBlockchainResponse)
	for _, b := range n.Blockchain.Blocks {
		resp.Blocks = append(resp.Blocks, &proto.Block{
			PrevBlockHash: b.PrevBlockHash,
			Data: &proto.BlockData{
				Author:     b.Data.Author,
				Timestamp:  b.Data.Timestamp,
				CommitHash: b.Data.CommitHash,
				FileHashes: b.Data.FileHashes,
			},
			Hash: b.Hash,
		})
	}
	return resp, nil
}

// NewNode creates a new Node that is ready to listen
func NewNode(port uint16, initNode string, isMiner bool, consensusMode consensus.Mode) (node *Node, err error) {
	node = &Node{
		Blockchain:   mining.NewBlockchain(),
		StateMachine: statemachine.NewStateMachine(StateNascent),
	}
	listener, err := net.Listen("tcp", ":"+fmt.Sprint(port))
	if err != nil {
		return
	}
	keys, err := skademlia.NewKeys(1, 2)
	if err != nil {
		return
	}
	// TODO: we may need to figure out our local IP address (ie. not localhost) if we want to allow for
	// inter-server communication (the issue is that s/kademlia uses this addr as ID for remote verification)
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
		node.StateMachine.SetState(StateIdle)
		return node.Server.Serve(listener)
	}
	return
}
