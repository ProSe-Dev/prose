package node

import (
	"bytes"
	"encoding/gob"
	"time"

	"github.com/ProSe-Dev/prose/blockchain/consensus"
	"github.com/perlin-network/noise"
	"github.com/perlin-network/noise/payload"
	"github.com/perlin-network/noise/protocol"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

var (
	_ protocol.Block = (*VersionBlock)(nil)
)

const (
	// VERSION is the current version number
	VERSION = "0.4"

	defaultHandshakeMessage = ".noise_handshake"
	defaultTimeoutSeconds   = 10
)

// VersionBlock is a version policy
type VersionBlock struct {
	opcodeHandshake  noise.Opcode
	timeoutDuration  time.Duration
	handshakeMessage string
	consensusType    consensus.Type
}

// NewProSeVersionBlock returns a new version policy
func NewProSeVersionBlock(consensusType consensus.Type) *VersionBlock {
	return &VersionBlock{
		timeoutDuration:  defaultTimeoutSeconds * time.Second,
		handshakeMessage: defaultHandshakeMessage,
		consensusType:    consensusType,
	}
}

// VersionHandshake is a version handshake
type VersionHandshake struct {
	consensusType []byte
	proSeVersion  []byte
}

func (VersionHandshake) Read(reader payload.Reader) (noise.Message, error) {
	consensusType, err := reader.ReadBytes()
	if err != nil {
		return nil, errors.Wrap(err, "failed to read consensus type A")
	}

	proSeVersion, err := reader.ReadBytes()
	if err != nil {
		return nil, errors.Wrap(err, "failed to read ProSe version A")
	}

	return VersionHandshake{
		consensusType: consensusType,
		proSeVersion:  proSeVersion}, nil
}

func (m VersionHandshake) Write() []byte {
	return payload.NewWriter(nil).
		WriteBytes(m.consensusType).
		WriteBytes(m.proSeVersion).
		Bytes()
}

// TimeoutAfter sets the timeout duration
func (b *VersionBlock) TimeoutAfter(timeoutDuration time.Duration) *VersionBlock {
	b.timeoutDuration = timeoutDuration
	return b
}

// WithHandshakeMessage sets the handshake message
func (b *VersionBlock) WithHandshakeMessage(handshakeMessage string) *VersionBlock {
	b.handshakeMessage = handshakeMessage
	return b
}

// GetBytes returns an arbitrary interface as a byte array
func GetBytes(key interface{}) ([]byte, error) {
	var buf bytes.Buffer
	enc := gob.NewEncoder(&buf)
	err := enc.Encode(key)
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// OnRegister for version block
func (b *VersionBlock) OnRegister(p *protocol.Protocol, node *noise.Node) {
	b.opcodeHandshake = noise.RegisterMessage(noise.NextAvailableOpcode(), (*VersionHandshake)(nil))
}

// OnBegin for version block
func (b *VersionBlock) OnBegin(p *protocol.Protocol, peer *noise.Peer) (err error) {
	var (
		consensusType []byte
		proSeVersion  []byte
	)
	if consensusType, err = GetBytes(b.consensusType); err != nil {
		return
	}

	if proSeVersion, err = GetBytes(VERSION); err != nil {
		return
	}

	req := VersionHandshake{consensusType: consensusType, proSeVersion: proSeVersion}
	if err = peer.SendMessage(req); err != nil {
		return errors.Wrap(errors.Wrap(protocol.DisconnectPeer, err.Error()), "failed to send version info to peer")
	}

	// Wait for handshake response.
	var res VersionHandshake
	var ok bool

	select {
	case <-time.After(b.timeoutDuration):
		return errors.Wrap(protocol.DisconnectPeer, "timed out receiving handshake request")
	case msg := <-peer.Receive(b.opcodeHandshake):
		res, ok = msg.(VersionHandshake)
		if !ok {
			return errors.Wrap(protocol.DisconnectPeer, "did not get a handshake response back")
		}
	}

	if !bytes.Equal(res.proSeVersion, proSeVersion) {
		err = errors.Wrap(protocol.DisconnectPeer, "failed to version check")
		return
	}

	if !bytes.Equal(res.consensusType, consensusType) {
		err = errors.Wrap(protocol.DisconnectPeer, "failed to consensus check")
		return
	}

	log.Warn().Msg("Successfully validated versioning and consensus information with peer.")

	return nil
}

// OnEnd for version block
func (b *VersionBlock) OnEnd(p *protocol.Protocol, peer *noise.Peer) error {
	return nil
}
