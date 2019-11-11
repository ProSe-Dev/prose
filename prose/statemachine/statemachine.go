package statemachine

import (
	"fmt"
	"sync"

	"log"
)

// StateCode is a state code
type StateCode uint

// StateMachine is a statemachine
type StateMachine struct {
	State StateCode
}

const (
	// StateCodeNil is the null statecode
	StateCodeNil StateCode = 0
)

var (
	stateCodeDebugNameMap = map[StateCode]string{}
	stateCodeBrokerMap    = map[StateCode]*StateBroker{}
	stateCounter          StateCode
	stateCodeMutex        sync.Mutex
)

// GetStateDebugName returns the debug name for a state
func GetStateDebugName(state StateCode) string {
	return stateCodeDebugNameMap[state]
}

// SetState updates the current state of a node
func (s *StateMachine) SetState(newState StateCode) {
	log.Printf("[STATEMACHINE] set state to %s", GetStateDebugName(newState))
	s.State = newState
	stateCodeBrokerMap[newState].Publish(true)
}

// Enforce raises an exception if the current state is not the input state
func (s *StateMachine) Enforce(state StateCode) (err error) {
	if s.State != state {
		return fmt.Errorf("invalid state: expected %s but got %s", GetStateDebugName(state), GetStateDebugName(s.State))
	}
	return
}

// EnforceWait blocks until the desired state is achieved
func (s *StateMachine) EnforceWait(state StateCode) {
	if s.State != state {
		log.Printf("[STATEMACHINE] waiting on state %s", GetStateDebugName(state))
		msgChan := stateCodeBrokerMap[state].Subscribe()
		<-msgChan
		stateCodeBrokerMap[state].Unsubscribe(msgChan)
		log.Printf("[STATEMACHINE] state %s was blocked but is now enforced", GetStateDebugName(state))
	}
	log.Printf("[STATEMACHINE] state %s was enforced", GetStateDebugName(state))
	return
}

// NextAvailableStateCode returns the next available state code
func NextAvailableStateCode(debug string) StateCode {
	stateCodeMutex.Lock()
	defer stateCodeMutex.Unlock()
	stateCounter = stateCounter + 1
	stateCodeDebugNameMap[stateCounter] = debug
	stateCodeBrokerMap[stateCounter] = NewStateBroker()
	go stateCodeBrokerMap[stateCounter].Start()
	return stateCounter
}

// NewStateMachine creates a new state machine
func NewStateMachine(initState StateCode) (s *StateMachine) {
	s = &StateMachine{State: initState}
	return
}

// StateBroker manages channel broadcasts per state
// Credits: https://stackoverflow.com/a/49877632
type StateBroker struct {
	stopChan    chan struct{}
	publishChan chan interface{}
	subChan     chan chan interface{}
	unsubChan   chan chan interface{}
}

// NewStateBroker returns a new state broker
func NewStateBroker() *StateBroker {
	return &StateBroker{
		stopChan:    make(chan struct{}),
		publishChan: make(chan interface{}, 1),
		subChan:     make(chan chan interface{}, 1),
		unsubChan:   make(chan chan interface{}, 1),
	}
}

// Start begins the broker loop
func (b *StateBroker) Start() {
	subs := map[chan interface{}]struct{}{}
	for {
		select {
		case <-b.stopChan:
			return
		case msgCh := <-b.subChan:
			subs[msgCh] = struct{}{}
		case msgCh := <-b.unsubChan:
			delete(subs, msgCh)
		case msg := <-b.publishChan:
			for msgCh := range subs {
				select {
				case msgCh <- msg:
				default:
				}
			}
		}
	}
}

// Stop closes the broker channel
func (b *StateBroker) Stop() {
	close(b.stopChan)
}

// Subscribe returns a channel for messages
func (b *StateBroker) Subscribe() chan interface{} {
	msgChan := make(chan interface{}, 5)
	b.subChan <- msgChan
	return msgChan
}

// Unsubscribe removes the current channel from the subscribed channel
func (b *StateBroker) Unsubscribe(msgChan chan interface{}) {
	b.unsubChan <- msgChan
}

// Publish broadcasts a message to all subscribers
func (b *StateBroker) Publish(msg interface{}) {
	b.publishChan <- msg
}
