package consensus

// Credit: https://www.hyperledger.org/blog/2019/02/13/introduction-to-sawtooth-pbft

import (
	"context"
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
	ViewNumberMutex        sync.Mutex
	LeaderID               string
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

// IncrementViewNumber increments the view number
func (p *PBFTConsensus) IncrementViewNumber() {
	p.ViewNumberMutex.Lock()
	defer p.ViewNumberMutex.Unlock()
	p.ViewNumber++
}

// AddMessageToTally adds a unique combination to the result tally set
func (p *PBFTConsensus) AddMessageToTally(nodeID string, key MessageKey, tally *Tally) map[string]struct{} {
	tally.Lock()
	defer tally.Unlock()
	hash, err := hashstructure.Hash(key, nil)
	if err != nil {
		panic(err) // should not error here
	}
	_, ok := tally.Map[hash]
	if !ok {
		tally.Map[hash] = map[string]struct{}{}
	}
	tally.Map[hash][nodeID] = struct{}{}
	return tally.Map[hash]
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
	p.IdleState = p.StateMachine.State
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
	p.StateMachine.EnforceWait(p.IdleState)
	p.StateMachine.Printf("[PBFT] Started new round")
	p.ResetMessageTally(p.CommitResultTally)
	p.ResetMessageTally(p.PrepareResultTally)

	network := gossip.GetNetwork(p.Client)
	p.LeaderID = network[p.ViewNumber%int64(len(network))]
	p.FaultToleranceConstant = (len(network) - 1) / 3
	p.StateMachine.Printf("\nView: %d\nNetwork: %s\nLeader: %s\nf: %d", p.ViewNumber, network, p.LeaderID, p.FaultToleranceConstant)

	transaction, err := mining.PeekLatestTransactionData()
	if err != nil {
		panic(err)
	}

	// cache the initial idle state to avoid dependency cycles
	p.StateMachine.SetState(statePrePreparing)

	if p.LeaderID != p.Client.ID().Address() {
		p.StateMachine.Printf("Not the leader for this round: %s vs %s", p.Client.ID().Address(), p.LeaderID)
		return
	}

	p.StateMachine.Printf("Acting as leader for this round")
	b := p.Blockchain.ProcessNewBlock(*transaction)
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
					PublicKey:  b.Data.PublicKey,
					Signature:  b.Data.Signature,
					ProjectID:  b.Data.ProjectID,
					CommitHash: b.Data.CommitHash,
					Timestamp:  b.Data.Timestamp,
					FileHashes: b.Data.FileHashes,
					MetaData:   b.Data.MetaData,
				},
				Hash: b.Hash,
			},
			BlockNumber: int64(len(p.Blockchain.Blocks)),
			ViewNumber:  p.ViewNumber,
			LeaderID:    p.LeaderID,
		}
		client := proto.NewPBFTClient(conn)
		resp, err := client.PrePrepare(context.Background(), m)
		if err != nil {
			p.StateMachine.Printf("[OUT N=%s V=%d] ERROR: unable to send pre-prepare:\nerror: %v", conn.Target(), p.ViewNumber, err)
		}
		p.StateMachine.Printf("[OUT N=%s V=%d] SUCCESS: sent pre-prepare:\n response: %v\n", conn.Target(), p.ViewNumber, resp)
	})

	// the leader node itself doesn't need to receive a pre-prepare message,
	// so it instead sends out the prepare message now
	gossip.Broadcast(p.Client, func(conn *grpc.ClientConn) {
		m := &proto.PrepareRequest{
			BlockHash:   b.Hash,
			BlockNumber: int64(len(p.Blockchain.Blocks)),
			ViewNumber:  p.ViewNumber,
			NodeID:      gossip.GetNodeID(p.Client),
		}
		client := proto.NewPBFTClient(conn)
		resp, err := client.Prepare(context.Background(), m)
		if err != nil {
			p.StateMachine.Printf("[OUT N=%s V=%d] ERROR: unable to send prepare:\nerror: %v", conn.Target(), p.ViewNumber, err)
		}
		p.StateMachine.Printf("[OUT N=%s V=%d] SUCCESS: sent prepare:\n response: %v\n", conn.Target(), p.ViewNumber, resp)
	})
	p.StateMachine.SetState(statePreparing)
}

// PrePrepare stages the generated block
func (p *PBFTConsensus) PrePrepare(ctx context.Context, in *proto.PrePrepareRequest) (a *proto.Ack, err error) {
	p.StateMachine.Printf("[IN N=%s V=%d] Received pre-prepare message", in.LeaderID, in.ViewNumber)
	if in.ViewNumber < p.ViewNumber {
		a = &proto.Ack{
			Received: false,
		}
		p.StateMachine.Printf("[PBFT] ignoring bad view number: %d < %d - possibly an old message", in.ViewNumber, p.ViewNumber)
		return
	}

	go func() {
		p.StateMachine.EnforceWait(statePrePreparing)
		for in.ViewNumber > p.ViewNumber {
			p.StateMachine.EnforceWait(statePrePreparing)
		}
		if in.LeaderID != p.LeaderID {
			a = &proto.Ack{
				Received: false,
			}
			p.StateMachine.Printf("[PBFT] ignoring bad leader ID: received %s != actual %s", in.LeaderID, p.LeaderID)
			return
		}
		block := mining.Block{
			Data: mining.BlockData{
				PublicKey:  in.Block.Data.PublicKey,
				Signature:  in.Block.Data.Signature,
				ProjectID:  in.Block.Data.ProjectID,
				CommitHash: in.Block.Data.CommitHash,
				Timestamp:  in.Block.Data.Timestamp,
				FileHashes: in.Block.Data.FileHashes,
				MetaData:   in.Block.Data.MetaData,
			},
			PrevBlockHash: in.Block.PrevBlockHash,
			Hash:          in.Block.Hash}
		if !mining.IsBlockDataQueued(&block.Data) {
			p.StateMachine.Printf("unknown block: %v\nskipping leader %s", block.Data, in.LeaderID)
			p.IncrementViewNumber()
			p.StateMachine.SetState(p.IdleState)
			go p.NewRound()
			a = &proto.Ack{
				Received: false,
			}
			return
		}
		if err := p.Blockchain.IsBlockValid(&block); err != nil {
			p.StateMachine.Printf(err.Error()+"\nblock: %v\nskipping leader %s", block, in.LeaderID)
			p.IncrementViewNumber()
			p.StateMachine.SetState(p.IdleState)
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
				p.StateMachine.Printf("[OUT N=%s V=%d] ERROR: unable to send prepare:\nerror: %v", conn.Target(), p.ViewNumber, err)
			}
			p.StateMachine.Printf("[OUT N=%s V=%d] SUCCESS: sent prepare:\n response: %v\n", conn.Target(), p.ViewNumber, resp)
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
	p.StateMachine.Printf("[IN N=%s V=%d] Received prepare message", in.NodeID, in.ViewNumber)
	if in.ViewNumber < p.ViewNumber {
		a = &proto.Ack{
			Received: false,
		}
		p.StateMachine.Printf("[PBFT] ignoring bad view number: %d < %d - possibly an old message", in.ViewNumber, p.ViewNumber)
		return
	}

	go func() {
		p.StateMachine.EnforceWait(statePreparing)
		for in.ViewNumber > p.ViewNumber {
			p.StateMachine.EnforceWait(statePreparing)
		}
		key := MessageKey{
			BlockID:    in.BlockNumber,
			BlockHash:  in.BlockHash,
			ViewNumber: in.ViewNumber}
		nodeIDMap := p.AddMessageToTally(
			gossip.NormalizeLocalhost(in.NodeID),
			key,
			p.PrepareResultTally)
		remaining := 2*p.FaultToleranceConstant + 1 - len(nodeIDMap)
		if remaining < 0 {
			p.StateMachine.Printf("[PBFT] got a prepare message from %s, but we're already done preparing", in.NodeID)
			return
		}
		if remaining > 0 {
			p.StateMachine.Printf("[PBFT] got a prepare message with key %v from %s, need %d more", key, in.NodeID, remaining)
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
				p.StateMachine.Printf("[OUT N=%s V=%d] ERROR: unable to send commit:\nerror: %v", conn.Target(), p.ViewNumber, err)
			}
			p.StateMachine.Printf("[OUT N=%s V=%d] SUCCESS: sent commit:\n response: %v\n", conn.Target(), p.ViewNumber, resp)
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
	p.StateMachine.Printf("[IN N=%s V=%d] Received commit message", in.NodeID, in.ViewNumber)
	if in.ViewNumber < p.ViewNumber {
		a = &proto.Ack{
			Received: false,
		}
		p.StateMachine.Printf("[PBFT] ignoring bad view number: %d < %d - possibly an old message", in.ViewNumber, p.ViewNumber)
		return
	}

	go func() {
		p.StateMachine.EnforceWait(stateCommitting)
		for in.ViewNumber > p.ViewNumber {
			p.StateMachine.EnforceWait(stateCommitting)
		}
		key := MessageKey{
			BlockID:    in.BlockNumber,
			BlockHash:  in.BlockHash,
			ViewNumber: in.ViewNumber}
		nodeIDMap := p.AddMessageToTally(
			gossip.NormalizeLocalhost(in.NodeID),
			key,
			p.CommitResultTally)
		remaining := 2*p.FaultToleranceConstant + 1 - len(nodeIDMap)
		if remaining < 0 {
			p.StateMachine.Printf("[PBFT] got a commit message from %s, but we're already done preparing", in.NodeID)
			return
		}
		if remaining > 0 {
			p.StateMachine.Printf("[PBFT] got a commit message with key %v from %s, need %d more", key, in.NodeID, remaining)
			return
		}
		p.StateMachine.Printf("[PBFT] got last commit message from %s!", in.NodeID)
		p.StateMachine.Printf("[PBFT] committed block: %v", p.Blockchain.StagedBlock)
		mining.RemoveTransactionData(&p.Blockchain.StagedBlock.Data)
		p.Blockchain.Commit()
		if err != nil {
			panic(err)
		}
		p.StateMachine.Printf("[PBFT] completed consensus for view %d!", p.ViewNumber)
		p.IncrementViewNumber()
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
