package consensus

import (
	"github.com/ProSe-Dev/prose/prose/gossip"
	"github.com/ProSe-Dev/prose/prose/mining"
	"github.com/ProSe-Dev/prose/prose/statemachine"
	"github.com/mitchellh/hashstructure"
	"github.com/perlin-network/noise"
	"github.com/perlin-network/noise/log"
	"github.com/perlin-network/noise/payload"
)

const (
	nodeLeaderIDKey       = "@PBFT_LEADER_ID"
	nodeViewIDKey         = "@PBFT_VIEW_ID"
	nodePrepareTupleKey   = "@PBFT_PREPARE_TUPLE"
	nodeFaultToleranceKey = "@PBFT_FAULT_TOLERANCE"
)

// PBFT represents the practical byzantine fault tolerance algorithm
type PBFT struct{}

// NewPBFT returns a new instance of PBFT
func NewPBFT() *PBFT {
	return new(PBFT)
}

var (
	stateNewRoundStarted = statemachine.NextAvailableStateCode("NewRoundStarted")
	statePrePrepared     = statemachine.NextAvailableStateCode("PrePrepared")
	statePrepared        = statemachine.NextAvailableStateCode("Prepared")
	stateCommitted       = statemachine.NextAvailableStateCode("Committed")
)

func (pbft *PBFT) registerMessages(node *noise.Node) {
	statemachine.RegisterMessage(node, (*PrePrepareMessage)(nil), PrePrepareMessageHandler,
		statemachine.StateTransition{
			SrcState: stateNewRoundStarted,
			DstState: statePrePrepared,
		})
	statemachine.RegisterMessage(node, (*prepareMessage)(nil), prepareMessageHandler,
		statemachine.StateTransition{
			SrcState: statePrePrepared,
			DstState: statePrepared,
		})
	statemachine.RegisterMessage(node, (*commitMessage)(nil), commitMessageHandler,
		statemachine.StateTransition{
			SrcState: statePrepared,
			DstState: stateCommitted,
		})
}

func (pbft *PBFT) begin(node *noise.Node) {
	newRound(node)
}

func newRound(node *noise.Node) (err error) {
	var viewNumber uint64 = 0
	network := gossip.GetNetwork(node)
	if node.Has(nodeViewIDKey) {
		viewNumber = node.Get(nodeViewIDKey).(uint64) + 1
	}
	leaderID := network[viewNumber%uint64(len(network))]
	f := (len(network) - 1) / 3
	node.Set(nodeLeaderIDKey, leaderID)
	node.Set(nodeViewIDKey, viewNumber)
	node.Set(nodeFaultToleranceKey, f)
	log.Info().Msgf("Started new round for node=%s with leader=%s view=%d f=%d\n", gossip.GetNodeID(node), leaderID, viewNumber, f)
	statemachine.SetState(node, stateNewRoundStarted)

	// are we the leader?
	if leaderID != gossip.GetNodeID(node) {
		return
	}

	transaction := node.Get(mining.NodeTransactionDataKey).(mining.Transaction)
	block := mining.ProcessNewBlock(transaction.CommitHash, transaction.Signature)
	log.Info().Msgf("Broadcasting new block with hash %s", block.ComputeHash())
	gossip.BroadcastAsync(node, PrePrepareMessage{
		BlockHash: block.ComputeHash(),
		//Block:       *block,
		BlockNumber: mining.GetBlockchain().Length,
		ViewNumber:  viewNumber,
		LeaderID:    leaderID,
	})
	statemachine.SetState(node, statePrePrepared)
	return
}

type PrePrepareMessage struct {
	//Block       mining.Block
	BlockHash   string
	BlockNumber uint64
	ViewNumber  uint64
	LeaderID    string
}

func (m PrePrepareMessage) Read(reader payload.Reader) (nm noise.Message, err error) {
	/*if err = m.Block.Read(reader); err != nil {
		return
	}*/

	if m.BlockHash, err = reader.ReadString(); err != nil {
		return
	}

	if m.BlockNumber, err = reader.ReadUint64(); err != nil {
		return
	}

	if m.ViewNumber, err = reader.ReadUint64(); err != nil {
		return
	}

	if m.LeaderID, err = reader.ReadString(); err != nil {
		return
	}
	nm = m
	//log.Info().Msg("Successfully read preprepare message")
	//debug.PrintStack()
	return
}

func (m PrePrepareMessage) Write() []byte {
	//return m.Block.Write(payload.NewWriter(nil)).

	return payload.NewWriter(nil).WriteString(m.BlockHash).
		WriteUint64(m.BlockNumber).
		WriteUint64(m.ViewNumber).
		WriteString(m.LeaderID).Bytes()
}

type prepareTuple struct {
	BlockHash   string
	BlockNumber uint64
	ViewNumber  uint64
}

func PrePrepareMessageHandler(node *noise.Node, peer *noise.Peer, message noise.Message) (err error) {
	log.Info().Msg("Handling preprepare")
	m := message.(PrePrepareMessage)

	// make sure we have the right view number
	if node.Get(nodeViewIDKey).(uint64) != m.ViewNumber {
		return
	}

	// make sure this is the leader we expect
	if node.Get(nodeLeaderIDKey).(string) != m.LeaderID || gossip.GetNodeID(peer.Node()) != m.LeaderID {
		return
	}

	// TODO: if the client isn't up to date with us, maybe we should just ignore it?
	if m.BlockNumber != mining.GetBlockchain().Length {
		return
	}

	// if we fail to validate the block then ignore it
	/*if err = mining.ValidateBlock(&m.Block); err != nil {
		return nil
	}*/

	// everything looks okay, so stage the block
	//mining.StageBlock(&m.Block)

	gossip.BroadcastAsync(node, prepareMessage{
		BlockHash:   m.BlockHash,
		BlockNumber: m.BlockNumber,
		ViewNumber:  m.ViewNumber,
		NodeID:      gossip.GetNodeID(node),
	})

	prepareTupleMap := map[uint64]struct{}{}
	hash, err := hashstructure.Hash(prepareTuple{BlockHash: m.BlockHash, BlockNumber: m.BlockNumber, ViewNumber: m.ViewNumber}, nil)
	if _, ok := prepareTupleMap[hash]; !ok {
		prepareTupleMap[hash] = struct{}{}
	}
	node.Set(nodePrepareTupleKey, prepareTupleMap)
	statemachine.SetState(node, statePrePrepared)
	return
}

type prepareMessage struct {
	BlockHash   string
	BlockNumber uint64
	ViewNumber  uint64
	NodeID      string
}

func (m prepareMessage) Read(reader payload.Reader) (nm noise.Message, err error) {
	if m.BlockHash, err = reader.ReadString(); err != nil {
		return
	}

	if m.BlockNumber, err = reader.ReadUint64(); err != nil {
		return
	}

	if m.ViewNumber, err = reader.ReadUint64(); err != nil {
		return
	}

	if m.NodeID, err = reader.ReadString(); err != nil {
		return
	}
	nm = m
	return
}

func (m prepareMessage) Write() []byte {
	return payload.NewWriter(nil).
		WriteString(m.BlockHash).
		WriteUint64(m.BlockNumber).
		WriteUint64(m.ViewNumber).
		WriteString(m.NodeID).Bytes()
}

func prepareMessageHandler(node *noise.Node, peer *noise.Peer, message noise.Message) (err error) {
	m := message.(prepareMessage)
	prepareTupleMap := node.Get(nodePrepareTupleKey).(map[uint64]struct{})
	hash, err := hashstructure.Hash(prepareTuple{BlockHash: m.BlockHash, BlockNumber: m.BlockNumber, ViewNumber: m.ViewNumber}, nil)
	if _, ok := prepareTupleMap[hash]; !ok {
		prepareTupleMap[hash] = struct{}{}
	}
	node.Set(nodePrepareTupleKey, prepareTupleMap)
	f := node.Get(nodeFaultToleranceKey).(uint64)
	if uint64(len(prepareTupleMap)) > 2*f+1 {
		statemachine.SetState(node, statePrepared)
	}
	return
}

type commitMessage struct {
	BlockHash   string
	BlockNumber uint64
	ViewNumber  uint64
	NodeID      string
}

func (m commitMessage) Read(reader payload.Reader) (nm noise.Message, err error) {
	if m.BlockHash, err = reader.ReadString(); err != nil {
		return
	}
	if m.BlockNumber, err = reader.ReadUint64(); err != nil {
		return
	}

	if m.ViewNumber, err = reader.ReadUint64(); err != nil {
		return
	}
	nm = m
	return
}

func (m commitMessage) Write() []byte {
	return payload.NewWriter(nil).
		WriteString(m.BlockHash).
		WriteUint64(m.BlockNumber).
		WriteUint64(m.ViewNumber).
		WriteString(m.NodeID).Bytes()
}

func commitMessageHandler(node *noise.Node, peer *noise.Peer, message noise.Message) (err error) {
	m := message.(commitMessage)
	prepareTupleMap := node.Get(nodePrepareTupleKey).(map[uint64]struct{})
	hash, err := hashstructure.Hash(prepareTuple{BlockHash: m.BlockHash, BlockNumber: m.BlockNumber, ViewNumber: m.ViewNumber}, nil)
	if _, ok := prepareTupleMap[hash]; !ok {
		prepareTupleMap[hash] = struct{}{}
	}
	node.Set(nodePrepareTupleKey, prepareTupleMap)
	f := node.Get(nodeFaultToleranceKey).(uint64)
	if uint64(len(prepareTupleMap)) > 2*f+1 {
		mining.CommitBlock()
		node.Delete(nodeLeaderIDKey)
		node.Delete(nodeFaultToleranceKey)
		node.Delete(nodePrepareTupleKey)
		node.Delete(mining.NodeTransactionDataKey)
		statemachine.SetState(node, StateConsensusComplete)
	}
	return
}
