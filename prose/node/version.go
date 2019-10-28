package node

import (
	"bytes"
	"encoding/gob"
	"time"

	"github.com/ProSe-Dev/prose/prose/consensus"
	"github.com/perlin-network/noise"
	"github.com/perlin-network/noise/log"
	"github.com/perlin-network/noise/payload"
	"github.com/perlin-network/noise/protocol"
	"github.com/pkg/errors"
)

var (
	_ protocol.Block = (*VersionBlock)(nil)
)

const (
	// VERSION is the current version number
	VERSION = "0.1"

	defaultHandshakeMessage = ".noise_handshake"
	defaultTimeoutSeconds   = 10
)

// VersionBlock is a version policy
type VersionBlock struct {
	opcodeHandshake  noise.Opcode
	timeoutDuration  time.Duration
	handshakeMessage string
	consensusMode    consensus.Mode
}

// NewProSeVersionBlock returns a new version policy
func NewProSeVersionBlock(consensusMode consensus.Mode) *VersionBlock {
	return &VersionBlock{
		timeoutDuration:  defaultTimeoutSeconds * time.Second,
		handshakeMessage: defaultHandshakeMessage,
		consensusMode:    consensusMode,
	}
}

// VersionHandshake is a version handshake
type VersionHandshake struct {
	consensusMode []byte
	proSeVersion  []byte
}

func (VersionHandshake) Read(reader payload.Reader) (noise.Message, error) {
	consensusMode, err := reader.ReadBytes()
	if err != nil {
		return nil, errors.Wrap(err, "failed to read consensus type A")
	}

	proSeVersion, err := reader.ReadBytes()
	if err != nil {
		return nil, errors.Wrap(err, "failed to read ProSe version A")
	}

	return VersionHandshake{
		consensusMode: consensusMode,
		proSeVersion:  proSeVersion}, nil
}

func (m VersionHandshake) Write() []byte {
	return payload.NewWriter(nil).
		WriteBytes(m.consensusMode).
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
		consensusMode []byte
		proSeVersion  []byte
	)
	if consensusMode, err = GetBytes(b.consensusMode); err != nil {
		return
	}

	if proSeVersion, err = GetBytes(VERSION); err != nil {
		return
	}

	req := VersionHandshake{consensusMode: consensusMode, proSeVersion: proSeVersion}
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

	if !bytes.Equal(res.consensusMode, consensusMode) {
		err = errors.Wrap(protocol.DisconnectPeer, "failed to consensus check")
		return
	}

	log.Info().Msg("Successfully validated versioning and consensus information with peer.")

	return nil
}

// OnEnd for version block
func (b *VersionBlock) OnEnd(p *protocol.Protocol, peer *noise.Peer) error {
	return nil
}
