package statemachine

import (
	"fmt"
	"reflect"
	"sync"

	"github.com/perlin-network/noise"
	"github.com/perlin-network/noise/log"
)

// StateCode is a state code
type StateCode uint

// StateTransition describes the source and destination states of a transition
type StateTransition struct {
	SrcState StateCode
	DstState StateCode
}

const (
	// NodeCurrentStateKey is the key name for the current node state
	NodeCurrentStateKey = "@CURRENT_STATE"

	// StateCodeNil is the null statecode
	StateCodeNil StateCode = 0
)

var (
	opCodeHandlersMap        = map[noise.Opcode]func(*noise.Peer, noise.Message) error{}
	opCodeStateTransitionMap = map[noise.Opcode]map[StateCode]StateCode{}
	stateCodeOpCodesMap      = map[StateCode]map[noise.Opcode]struct{}{}
	stateCodeDebugNameMap    = map[StateCode]string{}
	stateCodeChanMap         = map[StateCode]chan PeerOpcodeMessage{}
	opCodeDebugNameMap       = map[noise.Opcode]string{}

	stateCounter     StateCode
	stateCodeMutex   sync.Mutex
	stateSetMutex    sync.Mutex
	stateChangedChan = make(chan int)
)

// GetState returns the current state of a node
func GetState(node *noise.Node) StateCode {
	return node.Get(NodeCurrentStateKey).(StateCode)
}

// GetStateDebugName returns the debug name for a state
func GetStateDebugName(state StateCode) string {
	return stateCodeDebugNameMap[state]
}

// SetState updates the current state of a node
func SetState(node *noise.Node, newState StateCode) {
	//stateSetMutex.Lock()
	//defer stateSetMutex.Unlock()
	log.Info().Msgf("State set to %s", GetStateDebugName(newState))
	node.Set(NodeCurrentStateKey, newState)
	//select {
	//case stateChangedChan <- 1:
	// message sent
	//default:
	// message dropped
	//}
}

// NextAvailableStateCode returns the next available state code
func NextAvailableStateCode(debug string) StateCode {
	stateCodeMutex.Lock()
	defer stateCodeMutex.Unlock()
	stateCounter = stateCounter + 1
	stateCodeDebugNameMap[stateCounter] = debug
	return stateCounter
}

// GetOpcodeDebugName returns the debug name for an opcode
func GetOpcodeDebugName(opcode noise.Opcode) string {
	return opCodeDebugNameMap[opcode]
}

// RegisterMessage registers a message and corresponding handler
func RegisterMessage(node *noise.Node, msg interface{}, f func(*noise.Node, *noise.Peer, noise.Message) error, validTransitions ...StateTransition) {
	opcode := noise.RegisterMessage(noise.NextAvailableOpcode(), msg)
	m := reflect.TypeOf(msg)
	opCodeDebugNameMap[opcode] = m.String()
	fmt.Printf("Registering OPCODE: %s\n", GetOpcodeDebugName(opcode))

	for _, validTransition := range validTransitions {
		if _, ok := opCodeStateTransitionMap[opcode]; !ok {
			opCodeStateTransitionMap[opcode] = map[StateCode]StateCode{}
		}
		opCodeStateTransitionMap[opcode][validTransition.SrcState] = validTransition.DstState
		if _, ok := stateCodeOpCodesMap[validTransition.SrcState]; !ok {
			stateCodeOpCodesMap[validTransition.SrcState] = map[noise.Opcode]struct{}{}
		}
		stateCodeOpCodesMap[validTransition.SrcState][opcode] = struct{}{}
	}
	opCodeHandlersMap[opcode] = func(peer *noise.Peer, message noise.Message) (err error) {
		var (
			state    StateCode
			newState StateCode
			ok       bool
		)
		state = GetState(node)
		if newState, ok = opCodeStateTransitionMap[opcode][state]; !ok {
			err = fmt.Errorf("opcode: %v is not a valid operation from state %d", opcode, state)
		}
		if newState != StateCodeNil {
			//SetState(node, newState)
		}
		return f(node, peer, message)
	}
}

// GetOpcodesForState returns the opcodes associated to a state
func GetOpcodesForState(state StateCode) (keys []noise.Opcode) {
	for k := range stateCodeOpCodesMap[state] {
		keys = append(keys, k)
	}
	return keys
}

// GetStates returns a slice of all states
func GetStates() (keys []StateCode) {
	var i StateCode
	for i = 1; i <= stateCounter; i++ {
		keys = append(keys, i)
	}
	return keys
}

// PeerOpcodeMessage is a tuple of Peer, Opcode and Message
type PeerOpcodeMessage struct {
	Peer    *noise.Peer
	Opcode  noise.Opcode
	Message noise.Message
}

// NewHandler returns a state machine handler
func NewHandler(node *noise.Node, peer *noise.Peer) (err error) {
	/*
		for _, state := range GetStates() {
			stateCodeChanMap[state] = make(chan PeerOpcodeMessage)
			opcodes := GetOpcodesForState(state)
			for _, opcode := range opcodes {
				go func(peer *noise.Peer, opcode noise.Opcode, state StateCode, c <-chan noise.Message) {
					select {
					case msg := <-c:
						stateCodeChanMap[state] <- PeerOpcodeMessage{Peer: peer, Opcode: opcode, Message: msg}
					}
					fmt.Printf("Got OPCODE #1: %s\n", GetOpcodeDebugName(opcode))
				}(peer, opcode, state, peer.Receive(opcode))
			}
		}
		for {
			state := GetState(node)
			log.Info().Msgf("Handling messages for state %s", GetStateDebugName(state))
			opcodes := GetOpcodesForState(state)
			for _, opcode := range opcodes {
				log.Info().Msgf("** Handling messages for opcode %s", GetOpcodeDebugName(opcode))
			}
			select {
			case opcodeMessage := <-stateCodeChanMap[state]:
				opcode := opcodeMessage.Opcode
				message := opcodeMessage.Message
				fmt.Printf("Got OPCODE #2: %s\n", GetOpcodeDebugName(opcode))
				opCodeHandlersMap[opcode](peer, message)
			case <-stateChangedChan:
				fmt.Printf("Quitting")
				continue
			}
		}*/
	aggrChan := make(chan PeerOpcodeMessage)
	for _, state := range GetStates() {
		opcodes := GetOpcodesForState(state)
		for _, opcode := range opcodes {
			fmt.Printf("STATE: %s OPCODE: %s\n", GetStateDebugName(state), GetOpcodeDebugName(opcode))
			go func(peer *noise.Peer, opcode noise.Opcode, state StateCode, c <-chan noise.Message) {
				for {
					fmt.Printf("LISTENING FOR: %s\n", GetOpcodeDebugName(opcode))
					aggrChan <- PeerOpcodeMessage{Peer: peer, Opcode: opcode, Message: <-c}
					fmt.Printf("Got OPCODE #1: %s\n", GetOpcodeDebugName(opcode))
				}
			}(peer, opcode, state, peer.Receive(opcode))
		}
	}
	for {
		select {
		case opcodeMessage := <-aggrChan:
			opcode := opcodeMessage.Opcode
			message := opcodeMessage.Message
			fmt.Printf("Got OPCODE #2: %s\n", GetOpcodeDebugName(opcode))
			if err = opCodeHandlersMap[opcode](peer, message); err != nil {
				log.Error().Err(err)
			}
		}
	}
	return
}
