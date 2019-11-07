package consensus

import (
	"context"
	"log"

	"github.com/ProSe-Dev/prose/prose/gossip"
	"github.com/ProSe-Dev/prose/prose/mining"
	"github.com/ProSe-Dev/prose/prose/proto"
	"github.com/ProSe-Dev/prose/prose/statemachine"
	"github.com/perlin-network/noise/skademlia"
	"google.golang.org/grpc"
)

var (
	stateNewRound    statemachine.StateCode = statemachine.NextAvailableStateCode("new round")
	statePrePrepared statemachine.StateCode = statemachine.NextAvailableStateCode("pre-prepared")
	statePrepared    statemachine.StateCode = statemachine.NextAvailableStateCode("prepared")
	stateCommitted   statemachine.StateCode = statemachine.NextAvailableStateCode("committed")
)

// PBFTConsensus is consensus using the Practical Byzantine Fault Tolerance algorithm
type PBFTConsensus struct {
	Client       *skademlia.Client
	ViewNumber   int64
	Blockchain   *mining.Blockchain
	StateMachine *statemachine.StateMachine
	// TODO: tally on block ID, IP, hash and view number
	ResultTally            map[string]struct{}
	FaultToleranceConstant int
}

// HandleAddBlock handles adding a new blockchain block
func (p *PBFTConsensus) HandleAddBlock(data string) bool {
	log.Printf("[PBFT] Adding new block")
	mining.UpdateLatestTransactionData(data)
	// start the new round in the background
	go p.NewRound()
	return true
}

// NewRound starts a new PBFT round
func (p *PBFTConsensus) NewRound() {
	log.Printf("[PBFT] New round")
	p.StateMachine.SetState(stateNewRound)
	p.ResultTally = map[string]struct{}{}

	network := gossip.GetNetwork(p.Client)
	leaderID := network[p.ViewNumber%int64(len(network))]
	p.FaultToleranceConstant = (len(network) - 1) / 3
	log.Printf("Network: %s\nLeader: %s\nF: %d", network, leaderID, p.FaultToleranceConstant)

	if leaderID != p.Client.ID().Address() {
		return
	}

	transaction := mining.GetLatestTransactionData()
	b := p.Blockchain.ProcessNewBlock(transaction)
	log.Printf("Broadcasting new block with f = %v", p.FaultToleranceConstant)
	gossip.Broadcast(p.Client, func(conn *grpc.ClientConn) {
		m := &proto.PrePrepareRequest{
			Block: &proto.Block{
				PrevBlockHash: b.PrevBlockHash,
				Data:          b.Data,
				Hash:          b.Hash,
			},
			BlockNumber: int64(len(p.Blockchain.Blocks)),
			ViewNumber:  p.ViewNumber,
			LeaderID:    leaderID,
		}
		client := proto.NewPBFTClient(conn)
		resp, err := client.PrePrepare(context.Background(), m)
		if err != nil {
			log.Printf("[ERROR] unable to send pre-prepare: %v", err)
		}
		log.Printf("[%s] pre-prepare received: %v\n", conn.Target(), resp)
	})
	p.StateMachine.SetState(statePrePrepared)
}

// PrePrepare stages the generated block
func (p *PBFTConsensus) PrePrepare(ctx context.Context, in *proto.PrePrepareRequest) (a *proto.Ack, err error) {
	log.Printf("[PBFT] Pre-prepare")
	if err = p.StateMachine.Enforce(stateNewRound); err != nil {
		return
	}
	p.Blockchain.StageBlock(&mining.Block{Data: in.Block.Hash, PrevBlockHash: in.Block.PrevBlockHash, Hash: in.Block.Hash})
	gossip.Broadcast(p.Client, func(conn *grpc.ClientConn) {
		m := &proto.PrepareRequest{
			BlockHash:   in.Block.Hash,
			BlockNumber: int64(len(p.Blockchain.Blocks)),
			ViewNumber:  p.ViewNumber,
			NodeID:      gossip.GetNodeID(p.Client),
		}
		client := proto.NewPBFTClient(conn)
		resp, err := client.Prepare(context.Background(), m)
		if err != nil {
			log.Printf("[ERROR] unable to send pre-prepare: %v", err)
		}
		log.Printf("[%s] prepare received: %v\n", conn.Target(), resp)
	})
	p.StateMachine.SetState(statePrePrepared)
	a = &proto.Ack{
		Received: true,
	}
	return
}

// Prepare requires 2*f+1 responses
func (p *PBFTConsensus) Prepare(ctx context.Context, in *proto.PrepareRequest) (a *proto.Ack, err error) {
	log.Printf("[PBFT] Prepare")
	if err = p.StateMachine.Enforce(statePrePrepared); err != nil {
		return
	}
	p.ResultTally[gossip.NormalizeLocalhost(in.NodeID)] = struct{}{}
	a = &proto.Ack{
		Received: true,
	}
	gossip.Broadcast(p.Client, func(conn *grpc.ClientConn) {
		m := &proto.CommitRequest{
			BlockHash:   in.BlockHash,
			BlockNumber: int64(len(p.Blockchain.Blocks)),
			ViewNumber:  p.ViewNumber,
			NodeID:      gossip.GetNodeID(p.Client),
		}
		client := proto.NewPBFTClient(conn)
		resp, err := client.Commit(context.Background(), m)
		if err != nil {
			log.Printf("[ERROR] unable to send pre-prepare: %v", err)
		}
		log.Printf("[%s] commit received: %v\n", conn.Target(), resp)
	})
	if len(p.ResultTally) < 2*p.FaultToleranceConstant+1 {
		return
	}
	p.ResultTally = map[string]struct{}{}
	p.StateMachine.SetState(statePrepared)
	return
}

// Commit requires 2*f+1 responses
func (p *PBFTConsensus) Commit(ctx context.Context, in *proto.CommitRequest) (a *proto.Ack, err error) {
	log.Printf("[PBFT] Commit")
	if err = p.StateMachine.Enforce(statePrePrepared); err != nil {
		return
	}
	p.ResultTally[gossip.NormalizeLocalhost(in.NodeID)] = struct{}{}
	a = &proto.Ack{
		Received: true,
	}
	if len(p.ResultTally) < 2*p.FaultToleranceConstant+1 {
		return
	}
	p.ResultTally = map[string]struct{}{}
	p.StateMachine.SetState(stateCommitted)
	p.Blockchain.Commit()
	return
}
