package node

import (
	"github.com/ProSe-Dev/prose/prose/consensus"
	"github.com/ProSe-Dev/prose/prose/gossip"
	"github.com/ProSe-Dev/prose/prose/mining"
	"github.com/perlin-network/noise"
	"github.com/perlin-network/noise/log"
	"github.com/perlin-network/noise/payload"
)

type newTransactionMessage struct {
	CommitHash string
	Signature  string
}

func (m newTransactionMessage) Read(reader payload.Reader) (nm noise.Message, err error) {
	if m.CommitHash, err = reader.ReadString(); err != nil {
		return
	}
	if m.Signature, err = reader.ReadString(); err != nil {
		return
	}
	nm = m
	return
}

func (m newTransactionMessage) Write() []byte {
	return payload.NewWriter(nil).WriteString(m.CommitHash).WriteString(m.Signature).Bytes()
}

func newTransactionMessageHandler(node *noise.Node, peer *noise.Peer, message noise.Message) (err error) {
	log.Info().Msg("Handling new transaction")
	m := message.(newTransactionMessage)
	node.Set(mining.NodeTransactionDataKey, mining.Transaction{CommitHash: m.CommitHash, Signature: m.Signature})
	consensus.Begin(node)
	return
}

// MakeTransaction broadcasts a new transaction to the rest of the nodes
func MakeTransaction(node *noise.Node, commitHash string, signature string) (err error) {
	log.Info().Msgf("Broadcasting transaction %s", commitHash)
	m := newTransactionMessage{CommitHash: commitHash, Signature: signature}
	gossip.BroadcastAsync(node, m)
	newTransactionMessageHandler(node, nil, m)
	return nil
}
