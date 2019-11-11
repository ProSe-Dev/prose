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
	stateNewRoundStarted statemachine.StateCode = statemachine.NextAvailableStateCode("new round started")
	statePrePrepared     statemachine.StateCode = statemachine.NextAvailableStateCode("pre-prepared")
	statePrepared        statemachine.StateCode = statemachine.NextAvailableStateCode("prepared")
	stateCommitted       statemachine.StateCode = statemachine.NextAvailableStateCode("committed")
)

// PBFTConsensus is consensus using the Practical Byzantine Fault Tolerance algorithm
type PBFTConsensus struct {
	Client       *skademlia.Client
	ViewNumber   int64
	Blockchain   *mining.Blockchain
	StateMachine *statemachine.StateMachine
	// TODO: tally on block ID, IP, hash and view number
	ResultTally            map[uint64]struct{}
	ResultMutex            sync.Mutex
	FaultToleranceConstant int
}

// MessageKey is a struct used to generate MD5 hashes for uniqueness keying
type MessageKey struct {
	BlockID    int64
	BlockHash  string
	NodeID     string
	ViewNumber int64
}

// AddMessageToTally adds a unique combination to the result tally set
func (p *PBFTConsensus) AddMessageToTally(key MessageKey) {
	p.ResultMutex.Lock()
	defer p.ResultMutex.Unlock()
	hash, err := hashstructure.Hash(key, nil)
	if err != nil {
		panic(err) // should not error here
	}
	p.ResultTally[hash] = struct{}{}
}

// ResetMessageTally clears all entries in the result tally for the next round
func (p *PBFTConsensus) ResetMessageTally() {
	p.ResultMutex.Lock()
	defer p.ResultMutex.Unlock()
	p.ResultTally = map[uint64]struct{}{}
}

// HandleAddBlock handles adding a new blockchain block
func (p *PBFTConsensus) HandleAddBlock(data mining.BlockData) bool {
	log.Printf("[PBFT] Adding new block")
	mining.UpdateLatestTransactionData(data)
	// start the new round in the background
	go p.NewRound()
	return true
}

// NewRound starts a new PBFT round
func (p *PBFTConsensus) NewRound() {
	log.Printf("[PBFT] New round")
	p.StateMachine.SetState(stateNewRoundStarted)
	p.ResetMessageTally()

	network := gossip.GetNetwork(p.Client)
	leaderID := network[p.ViewNumber%int64(len(network))]
	p.FaultToleranceConstant = (len(network) - 1) / 3
	log.Printf("Network: %s\nLeader: %s\nF: %d", network, leaderID, p.FaultToleranceConstant)

	if leaderID != p.Client.ID().Address() {
		return
	}

	transaction := mining.GetLatestTransactionData()
	b := p.Blockchain.ProcessNewBlock(transaction)
	if !p.Blockchain.IsBlockValid(b) {
		return
	}
	log.Printf("Broadcasting new block with f = %v", p.FaultToleranceConstant)
	gossip.Broadcast(p.Client, func(conn *grpc.ClientConn) {
		m := &proto.PrePrepareRequest{
			Block: &proto.Block{
				PrevBlockHash: b.PrevBlockHash,
				Data: &proto.BlockData{
					Author:     b.Data.Author,
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
			log.Printf("[ERROR] unable to send pre-prepare: %v", err)
		}
		log.Printf("[%s] pre-prepare %v\n", conn.Target(), resp)
	})
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
			log.Printf("[ERROR] unable to send pre-prepare: %v", err)
		}
		log.Printf("[%s] prepare %v\n", conn.Target(), resp)
	})
	p.StateMachine.SetState(statePrePrepared)
}

// PrePrepare stages the generated block
func (p *PBFTConsensus) PrePrepare(ctx context.Context, in *proto.PrePrepareRequest) (a *proto.Ack, err error) {
	log.Printf("[PBFT] Pre-prepare")
	go func() {
		p.StateMachine.EnforceWait(stateNewRoundStarted)
		block := mining.Block{
			Data: mining.BlockData{
				Author:     in.Block.Data.Author,
				CommitHash: in.Block.Data.CommitHash,
				Timestamp:  in.Block.Data.Timestamp,
				FileHashes: in.Block.Data.FileHashes,
			},
			PrevBlockHash: in.Block.PrevBlockHash,
			Hash:          in.Block.Hash}
		if !p.Blockchain.IsBlockValid(&block) {
			a = &proto.Ack{
				Received: false,
			}
			return
		}
		p.Blockchain.StageBlock(&block)
		log.Printf("[PBFT] Staged block with data: %s\n", in.Block.Data)
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
				log.Printf("[ERROR] unable to send prepare: %v", err)
			}
			log.Printf("[%s] prepare %v\n", conn.Target(), resp)
		})
		p.StateMachine.SetState(statePrePrepared)
	}()
	a = &proto.Ack{
		Received: true,
	}
	return
}

// Prepare requires 2*f+1 responses
func (p *PBFTConsensus) Prepare(ctx context.Context, in *proto.PrepareRequest) (a *proto.Ack, err error) {
	log.Printf("[PBFT] prepare message from %s\n", in.NodeID)
	go func() {
		p.StateMachine.EnforceWait(statePrePrepared)
		p.AddMessageToTally(MessageKey{
			BlockID:    in.BlockNumber,
			BlockHash:  in.BlockHash,
			NodeID:     gossip.NormalizeLocalhost(in.NodeID),
			ViewNumber: in.ViewNumber})
		log.Printf("[PBFT] message from %s, need %d more prepare messages\n", in.NodeID, 2*p.FaultToleranceConstant+1-len(p.ResultTally))
		if len(p.ResultTally) < 2*p.FaultToleranceConstant+1 {
			return
		}
		p.ResetMessageTally()
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
				log.Printf("[ERROR] unable to send commit: %v", err)
			}
			log.Printf("[%s] commit %v\n", conn.Target(), resp)
		})
		p.StateMachine.SetState(statePrepared)
	}()
	a = &proto.Ack{
		Received: true,
	}
	return
}

// Commit requires 2*f+1 responses
func (p *PBFTConsensus) Commit(ctx context.Context, in *proto.CommitRequest) (a *proto.Ack, err error) {
	log.Printf("[PBFT] commit message from %s\n", in.NodeID)
	go func() {
		p.StateMachine.EnforceWait(statePrepared)
		p.AddMessageToTally(MessageKey{
			BlockID:    in.BlockNumber,
			BlockHash:  in.BlockHash,
			NodeID:     gossip.NormalizeLocalhost(in.NodeID),
			ViewNumber: in.ViewNumber})
		log.Printf("[PBFT] message from %s, need %d more commit messages\n", in.NodeID, 2*p.FaultToleranceConstant+1-len(p.ResultTally))
		if len(p.ResultTally) < 2*p.FaultToleranceConstant+1 {
			return
		}
		p.ResetMessageTally()
		p.StateMachine.SetState(stateCommitted)
		p.Blockchain.Commit()
	}()
	a = &proto.Ack{
		Received: true,
	}
	return
}
