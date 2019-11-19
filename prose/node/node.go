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
	Blockchain    *mining.Blockchain
	Client        *skademlia.Client
	Server        *grpc.Server
	Serve         func() error
	Consensus     consensus.Consensus
	ConsensusMode consensus.Mode
	StateMachine  *statemachine.StateMachine
}

// AddBlock adds a new block to blockchain
func (n *Node) AddBlock(ctx context.Context, in *proto.AddBlockRequest) (resp *proto.AddBlockResponse, err error) {
	data := mining.BlockData{
		PublicKey:  in.Data.PublicKey,
		AuthorID:   in.Data.AuthorID,
		ProjectID:  in.Data.ProjectID,
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

// GetBlockchain returns the full blockchain
func (n *Node) GetBlockchain(ctx context.Context, in *proto.GetBlockchainRequest) (*proto.GetBlockchainResponse, error) {
	resp := new(proto.GetBlockchainResponse)
	for _, b := range n.Blockchain.Blocks {
		resp.Blocks = append(resp.Blocks, &proto.Block{
			PrevBlockHash: b.PrevBlockHash,
			Data: &proto.BlockData{
				PublicKey:  b.Data.PublicKey,
				AuthorID:   b.Data.AuthorID,
				ProjectID:  b.Data.ProjectID,
				Timestamp:  b.Data.Timestamp,
				CommitHash: b.Data.CommitHash,
				FileHashes: b.Data.FileHashes,
			},
			Hash: b.Hash,
		})
	}
	return resp, nil
}

// GetState returns the node state
func (n *Node) GetState(ctx context.Context, in *proto.GetStateRequest) (*proto.GetStateResponse, error) {
	resp := new(proto.GetStateResponse)
	resp.StateDebugName = statemachine.GetStateDebugName(n.StateMachine.State)
	return resp, nil
}

// GetNetwork returns the node network
func (n *Node) GetNetwork(ctx context.Context, in *proto.GetNetworkRequest) (*proto.GetNetworkResponse, error) {
	resp := new(proto.GetNetworkResponse)
	resp.NodeIDs = gossip.GetNetwork(n.Client)
	return resp, nil
}

// FastForward returns the blockchain diff for the requesting node as wel as the consensus information
func (n *Node) FastForward(ctx context.Context, in *proto.FastForwardRequest) (*proto.FastForwardResponse, error) {
	var (
		blockOurs      *mining.Block
		blockTheirs    *proto.Block
		divergentIndex int64 = -1
	)
	resp := new(proto.FastForwardResponse)
	for idx := range n.Blockchain.Blocks {
		blockOurs = n.Blockchain.Blocks[idx]
		if idx >= len(in.Blocks) {
			if divergentIndex == -1 {
				divergentIndex = int64(idx)
			}
			resp.Blocks = append(resp.Blocks, &proto.Block{
				PrevBlockHash: blockOurs.PrevBlockHash,
				Data: &proto.BlockData{
					PublicKey:  blockOurs.Data.PublicKey,
					AuthorID:   blockOurs.Data.AuthorID,
					ProjectID:  blockOurs.Data.ProjectID,
					Timestamp:  blockOurs.Data.Timestamp,
					CommitHash: blockOurs.Data.CommitHash,
					FileHashes: blockOurs.Data.FileHashes,
				},
				Hash: blockOurs.Hash,
			})
			continue
		}
		blockTheirs = in.Blocks[idx]
		if blockTheirs.Hash == blockOurs.Hash && blockTheirs.PrevBlockHash == blockOurs.PrevBlockHash {
			continue
		}
		if divergentIndex == -1 {
			divergentIndex = int64(idx)
		}
		resp.Blocks = append(resp.Blocks, &proto.Block{
			PrevBlockHash: blockOurs.PrevBlockHash,
			Data: &proto.BlockData{
				PublicKey:  blockOurs.Data.PublicKey,
				AuthorID:   blockOurs.Data.AuthorID,
				ProjectID:  blockOurs.Data.ProjectID,
				Timestamp:  blockOurs.Data.Timestamp,
				CommitHash: blockOurs.Data.CommitHash,
				FileHashes: blockOurs.Data.FileHashes,
			},
			Hash: blockOurs.Hash,
		})
	}
	resp.DivergentIndex = divergentIndex
	resp.CInfo = n.Consensus.GetInfo()
	return resp, nil
}

// FastForwardToInitNode bootstraps the blockchain and consensus state
func (n *Node) FastForwardToInitNode(conn *grpc.ClientConn) error {
	m := new(proto.FastForwardRequest)
	for _, b := range n.Blockchain.Blocks {
		m.Blocks = append(m.Blocks, &proto.Block{
			PrevBlockHash: b.PrevBlockHash,
			Data: &proto.BlockData{
				PublicKey:  b.Data.PublicKey,
				AuthorID:   b.Data.AuthorID,
				ProjectID:  b.Data.ProjectID,
				Timestamp:  b.Data.Timestamp,
				CommitHash: b.Data.CommitHash,
				FileHashes: b.Data.FileHashes,
			},
			Hash: b.Hash,
		})
	}
	m.ConsensusMode = string(n.ConsensusMode)
	client := proto.NewSyncClient(conn)
	resp, err := client.FastForward(context.Background(), m)
	if err != nil {
		return err
	}
	log.Printf("[%s] received sync response: %v\n", conn.Target(), resp)
	if resp.CInfo.ConsensusMode == string(n.ConsensusMode) {
		n.Consensus.UpdateInfo(resp.CInfo)
	}
	if resp.DivergentIndex == -1 {
		return nil
	}
	log.Printf("old blockchain had length %d, divergent at %d", len(n.Blockchain.Blocks), resp.DivergentIndex)
	n.Blockchain.Blocks = n.Blockchain.Blocks[:resp.DivergentIndex]
	for _, b := range resp.Blocks {
		n.Blockchain.Blocks = append(n.Blockchain.Blocks, &mining.Block{
			PrevBlockHash: b.PrevBlockHash,
			Data: mining.BlockData{
				PublicKey:  b.Data.PublicKey,
				AuthorID:   b.Data.AuthorID,
				ProjectID:  b.Data.ProjectID,
				Timestamp:  b.Data.Timestamp,
				CommitHash: b.Data.CommitHash,
				FileHashes: b.Data.FileHashes,
			},
			Hash: b.Hash,
		})
	}
	log.Printf("new blockchain has length %d", len(n.Blockchain.Blocks))
	return nil
}

// NewNode creates a new Node that is ready to listen
func NewNode(port uint16, initNode string, remoteIP string, consensusMode consensus.Mode) (node *Node, err error) {
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
	addr := net.JoinHostPort(remoteIP, strconv.Itoa(listener.Addr().(*net.TCPAddr).Port))
	node.Client = skademlia.NewClient(addr, keys, skademlia.WithC1(1), skademlia.WithC2(1))
	node.Client.SetCredentials(noise.NewCredentials(addr, handshake.NewECDH(), cipher.NewAEAD(), node.Client.Protocol()))

	node.Server = node.Client.Listen()
	proto.RegisterBlockchainServer(node.Server, node)
	proto.RegisterSyncServer(node.Server, node)
	node.ConsensusMode = consensusMode
	node.Consensus = consensus.RegisterConsensusServer(node.Blockchain, node.StateMachine, node.Server, node.Client, consensusMode)

	if initNode != "" {
		var conn *grpc.ClientConn
		if conn, err = node.Client.Dial(initNode); err != nil {
			return
		}
		log.Printf("Dialed %s", initNode)
		node.Client.Bootstrap()
		if err = node.FastForwardToInitNode(conn); err != nil {
			log.Printf("[ERROR] unable to fastforward: %v", err)
		}
		network := gossip.GetNetwork(node.Client)
		log.Printf("Finished bootstrapping. Network: %s", network)
	}

	node.Serve = func() error {
		node.StateMachine.SetState(StateIdle)
		return node.Server.Serve(listener)
	}
	return
}
