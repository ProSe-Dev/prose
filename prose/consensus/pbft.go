package consensus

// Credit: https://www.hyperledger.org/blog/2019/02/13/introduction-to-sawtooth-pbft

import (
	"context"
	"log"
	"sync"

	"github.com/ProSe-Dev/prose/prose/gossip"
	"github.com/ProSe-Dev/prose/prose/mining"
	"github.com/ProSe-Dev/prose/prose/proto"
	"github.com/ProSe-Dev/prose/prose/statemachine"
	"github.com/mitchellh/hashstructure"
	"github.com/perlin-network/noise/skademlia"
	"google.golang.org/grpc"
)

var (
	statePrePreparing statemachine.StateCode = statemachine.NextAvailableStateCode("pre-preparing")
	statePreparing    statemachine.StateCode = statemachine.NextAvailableStateCode("preparing")
	stateCommitting   statemachine.StateCode = statemachine.NextAvailableStateCode("committing")
)

// Tally is a round counter for unique messages
type Tally struct {
	sync.Mutex
	Map map[uint64]map[string]struct{}
}

// PBFTConsensus is consensus using the Practical Byzantine Fault Tolerance algorithm
type PBFTConsensus struct {
	Client                 *skademlia.Client
	ViewNumber             int64
	Blockchain             *mining.Blockchain
	StateMachine           *statemachine.StateMachine
	IdleState              statemachine.StateCode
	PrepareResultTally     *Tally
	CommitResultTally      *Tally
	FaultToleranceConstant int
}

// MessageKey is a struct used to generate MD5 hashes for uniqueness keying
type MessageKey struct {
	BlockID    int64
	BlockHash  string
	ViewNumber int64
}

// AddMessageToTally adds a unique combination to the result tally set
func (p *PBFTConsensus) AddMessageToTally(nodeID string, key MessageKey, tally *Tally) {
	tally.Lock()
	defer tally.Unlock()
	p.StateMachine.Printf(
		"[PBFT] Tallying nodeID=%s (BlockID=%d, BlockHash=%s, ViewNumber=%d)",
		nodeID,
		key.BlockID,
		key.BlockHash,
		key.ViewNumber)
	hash, err := hashstructure.Hash(key, nil)
	if err != nil {
		panic(err) // should not error here
	}
	_, ok := tally.Map[hash]
	if !ok {
		tally.Map[hash] = map[string]struct{}{}
	}
	tally.Map[hash][nodeID] = struct{}{}
}

// ResetMessageTally clears all entries in the result tally for the next round
func (p *PBFTConsensus) ResetMessageTally(tally *Tally) {
	tally.Lock()
	defer tally.Unlock()
	p.StateMachine.Printf("[PBFT] Reset tally")
	tally.Map = map[uint64]map[string]struct{}{}
}

// Start handles adding a new blockchain block
func (p *PBFTConsensus) Start() {
	// start the new round in the background
	go p.NewRound()
}

// GetInfo returns the consensus info
func (p *PBFTConsensus) GetInfo() *proto.ConsensusInfo {
	return &proto.ConsensusInfo{
		ConsensusMode: string(PBFTMode),
		Iteration:     p.ViewNumber,
	}
}

// UpdateInfo updates consensus info
func (p *PBFTConsensus) UpdateInfo(info *proto.ConsensusInfo) {
	p.ViewNumber = info.Iteration
}

// NewRound starts a new PBFT round
func (p *PBFTConsensus) NewRound() {
	p.StateMachine.Printf("[PBFT] Started new round")
	// cache the initial idle state to avoid dependency cycles
	p.IdleState = p.StateMachine.State
	p.StateMachine.SetState(statePrePreparing)
	p.ResetMessageTally(p.CommitResultTally)
	p.ResetMessageTally(p.PrepareResultTally)

	network := gossip.GetNetwork(p.Client)
	leaderID := network[p.ViewNumber%int64(len(network))]
	p.FaultToleranceConstant = (len(network) - 1) / 3
	p.StateMachine.Printf("View: %d\nNetwork: %s\nLeader: %s\nf: %d", p.ViewNumber, network, leaderID, p.FaultToleranceConstant)

	transaction, err := mining.PeekLatestTransactionData()
	if err != nil {
		panic(err)
	}

	if leaderID != p.Client.ID().Address() {
		p.StateMachine.Printf("Not the leader for this round: %s vs %s", p.Client.ID().Address(), leaderID)
		return
	}

	p.StateMachine.Printf("Acting as leader for this round")
	b := p.Blockchain.ProcessNewBlock(transaction)
	if err := p.Blockchain.IsBlockValid(b); err != nil {
		p.StateMachine.Printf(err.Error()+"\nblock: %v", b)
		return
	}

	p.StateMachine.Printf("Broadcasting new block: %v", b)
	gossip.Broadcast(p.Client, func(conn *grpc.ClientConn) {
		m := &proto.PrePrepareRequest{
			Block: &proto.Block{
				PrevBlockHash: b.PrevBlockHash,
				Data: &proto.BlockData{
					Author:     b.Data.Author,
					Identity:   b.Data.Identity,
					ProjectID:  b.Data.ProjectID,
					CommitHash: b.Data.CommitHash,
					Timestamp:  b.Data.Timestamp,
					FileHashes: b.Data.FileHashes,
				},
				Hash: b.Hash,
			},
			BlockNumber: int64(len(p.Blockchain.Blocks)),
			ViewNumber:  p.ViewNumber,
			LeaderID:    leaderID,
		}
		client := proto.NewPBFTClient(conn)
		resp, err := client.PrePrepare(context.Background(), m)
		if err != nil {
			p.StateMachine.Printf("[OUT] ERROR: unable to send pre-prepare to %s:\nerror: %v", conn.Target(), err)
		}
		p.StateMachine.Printf("[OUT] SUCCESS: sent pre-prepare to %s:\nresponse: %v\n", conn.Target(), resp)
	})

	// the leader node itself doesn't need to receive a pre-prepare message,
	// so it instead sends out the prepare message now
	gossip.Broadcast(p.Client, func(conn *grpc.ClientConn) {
		m := &proto.PrepareRequest{
			BlockHash:   b.PrevBlockHash,
			BlockNumber: int64(len(p.Blockchain.Blocks)),
			ViewNumber:  p.ViewNumber,
			NodeID:      gossip.GetNodeID(p.Client),
		}
		client := proto.NewPBFTClient(conn)
		resp, err := client.Prepare(context.Background(), m)
		if err != nil {
			p.StateMachine.Printf("[OUT] ERROR: unable to send pre-prepare to %s:\nerror: %v", conn.Target(), err)
		}
		p.StateMachine.Printf("[OUT] SUCCESS: sent pre-prepare to %s:\n response: %v\n", conn.Target(), resp)
	})
	p.StateMachine.SetState(statePreparing)
}

// PrePrepare stages the generated block
func (p *PBFTConsensus) PrePrepare(ctx context.Context, in *proto.PrePrepareRequest) (a *proto.Ack, err error) {
	p.StateMachine.Printf("[IN] Received pre-prepare message from %s", in.LeaderID)
	if in.ViewNumber != p.ViewNumber {
		a = &proto.Ack{
			Received: false,
		}
		log.Printf("[PBFT] ignoring bad view number: %d vs %d - possibly an old message", in.ViewNumber, p.ViewNumber)
		return
	}

	go func() {
		p.StateMachine.EnforceWait(statePrePreparing)
		block := mining.Block{
			Data: mining.BlockData{
				Author:     in.Block.Data.Author,
				Identity:   in.Block.Data.Identity,
				ProjectID:  in.Block.Data.ProjectID,
				CommitHash: in.Block.Data.CommitHash,
				Timestamp:  in.Block.Data.Timestamp,
				FileHashes: in.Block.Data.FileHashes,
			},
			PrevBlockHash: in.Block.PrevBlockHash,
			Hash:          in.Block.Hash}
		if err := p.Blockchain.IsBlockValid(&block); err != nil {
			p.StateMachine.Printf(err.Error()+"\nblock: %v\nskipping leader %s", block, in.LeaderID)
			p.ViewNumber++
			go p.NewRound()
			a = &proto.Ack{
				Received: false,
			}
			return
		}
		p.Blockchain.StageBlock(&block)
		p.StateMachine.Printf("[PBFT] Staged block:\n%v", in.Block)
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
				p.StateMachine.Printf("[OUT] ERROR: unable to send prepare to %s:\nerror: %v", conn.Target(), err)
			}
			p.StateMachine.Printf("[OUT] SUCCESS: sent prepare to %s:\n response: %v\n", conn.Target(), resp)
		})
		p.StateMachine.SetState(statePreparing)
	}()
	a = &proto.Ack{
		Received: true,
	}
	return
}

// Prepare requires 2*f+1 responses
func (p *PBFTConsensus) Prepare(ctx context.Context, in *proto.PrepareRequest) (a *proto.Ack, err error) {
	p.StateMachine.Printf("[IN] Received prepare message from %s", in.NodeID)
	if in.ViewNumber != p.ViewNumber {
		a = &proto.Ack{
			Received: false,
		}
		log.Printf("[PBFT] ignoring bad view number: %d vs %d - possibly an old message", in.ViewNumber, p.ViewNumber)
		return
	}

	go func() {
		p.StateMachine.EnforceWait(statePreparing)
		p.AddMessageToTally(
			gossip.NormalizeLocalhost(in.NodeID),
			MessageKey{
				BlockID:    in.BlockNumber,
				BlockHash:  in.BlockHash,
				ViewNumber: in.ViewNumber}, p.PrepareResultTally)
		remaining := 2*p.FaultToleranceConstant + 1 - len(p.PrepareResultTally.Map)
		if remaining < 0 {
			p.StateMachine.Printf("[PBFT] got a prepare message from %s, but we're already done preparing", in.NodeID)
			return
		}
		if remaining > 0 {
			p.StateMachine.Printf("[PBFT] got a prepare message from %s, need %d more", in.NodeID, remaining)
			return
		}
		p.StateMachine.Printf("[PBFT] got last prepare message from %s!", in.NodeID)
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
				p.StateMachine.Printf("[OUT] ERROR: unable to send commit to %s:\nerror: %v", conn.Target(), err)
			}
			p.StateMachine.Printf("[OUT] SUCCESS: sent commit to %s:\n response: %v\n", conn.Target(), resp)
		})
		p.StateMachine.SetState(stateCommitting)
	}()
	a = &proto.Ack{
		Received: true,
	}
	return
}

// Commit requires 2*f+1 responses
func (p *PBFTConsensus) Commit(ctx context.Context, in *proto.CommitRequest) (a *proto.Ack, err error) {
	p.StateMachine.Printf("[IN] Received commit message from %s", in.NodeID)
	if in.ViewNumber != p.ViewNumber {
		a = &proto.Ack{
			Received: false,
		}
		log.Printf("[PBFT] ignoring bad view number: %d vs %d - possibly an old message", in.ViewNumber, p.ViewNumber)
		return
	}

	go func() {
		p.StateMachine.EnforceWait(stateCommitting)
		p.AddMessageToTally(
			gossip.NormalizeLocalhost(in.NodeID),
			MessageKey{
				BlockID:    in.BlockNumber,
				BlockHash:  in.BlockHash,
				ViewNumber: in.ViewNumber}, p.CommitResultTally)
		remaining := 2*p.FaultToleranceConstant + 1 - len(p.CommitResultTally.Map)
		if remaining < 0 {
			p.StateMachine.Printf("[PBFT] got a commit message from %s, but we're already done preparing", in.NodeID)
			return
		}
		if remaining > 0 {
			p.StateMachine.Printf("[PBFT] got a commit message from %s, need %d more", in.NodeID, remaining)
			return
		}
		p.StateMachine.Printf("[PBFT] got last commit message from %s!", in.NodeID)
		p.StateMachine.Printf("[PBFT] committed block: %v", p.Blockchain.StagedBlock)
		p.Blockchain.Commit()
		_, err := mining.PopLatestTransactionData()
		if err != nil {
			panic(err)
		}
		p.ViewNumber++
		// make sure we restore the old idle state here
		p.StateMachine.SetState(p.IdleState)
		if mining.NewTransactionDataExists() {
			p.StateMachine.Printf("[PBFT] found more data, starting new round")
			p.NewRound()
		} else {
			p.StateMachine.Printf("[PBFT] no more data, ending consensus")
		}
	}()
	a = &proto.Ack{
		Received: true,
	}
	return
}
