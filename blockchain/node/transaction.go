package node

import (
	"github.com/perlin-network/noise"
	"github.com/perlin-network/noise/payload"
	"github.com/perlin-network/noise/skademlia"
)

// TransactionMessage is a transaction payload to create a new blockchain block
type TransactionMessage struct {
	CommitHash string
}

func (m TransactionMessage) Read(reader payload.Reader) (noise.Message, error) {
	var err error

	m.CommitHash, err = reader.ReadString()
	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (m TransactionMessage) Write() []byte {
	return payload.NewWriter(nil).WriteString(m.CommitHash).Bytes()
}

func init() {
	noise.RegisterMessage(noise.NextAvailableOpcode(), (*TransactionMessage)(nil))
}

// MakeTransaction broadcasts a new transaction to the rest of the nodes
func (pnode *ProSeNode) MakeTransaction(commitHash string) (err error) {
	skademlia.BroadcastAsync(pnode.Node, TransactionMessage{CommitHash: commitHash})
	return nil
}
