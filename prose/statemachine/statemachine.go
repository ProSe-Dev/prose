package statemachine

import (
	"fmt"
	"sync"

	"log"

	"github.com/ProSe-Dev/prose/prose/signal"
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
	stateCodeBrokerMap    = map[StateCode]*signal.Broker{}
	stateCounter          StateCode
	stateCodeMutex        sync.Mutex
	logMutex              sync.Mutex
)

// GetStateDebugName returns the debug name for a state
func GetStateDebugName(state StateCode) string {
	return stateCodeDebugNameMap[state]
}

// GetStateFromDebugName returns the state code for a debug name
func GetStateFromDebugName(debugName string) (stateCode StateCode, err error) {
	tempMap := map[string]StateCode{}
	for k, v := range stateCodeDebugNameMap {
		tempMap[v] = k
	}
	stateCode, ok := tempMap[debugName]
	if !ok {
		err = fmt.Errorf("%s is not a valid debugName", debugName)
		return
	}
	return
}

// SetState updates the current state of a node
func (s *StateMachine) SetState(newState StateCode) {
	stateCodeBrokerMap[newState].Publish(true)
	s.Printf("[STATEMACHINE] set state to %s", GetStateDebugName(newState))
	s.State = newState
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
		s.Printf("[STATEMACHINE] waiting on state %s, current is %s", GetStateDebugName(state), GetStateDebugName(s.State))
		stateCodeBrokerMap[state].WaitOnAnyTimeout(1)
		s.Printf("[STATEMACHINE] state %s was blocked but is now enforced", GetStateDebugName(state))
		return
	}
	s.Printf("[STATEMACHINE] state %s was already enforced", GetStateDebugName(state))
	return
}

// NextAvailableStateCode returns the next available state code
func NextAvailableStateCode(debug string) StateCode {
	stateCodeMutex.Lock()
	defer stateCodeMutex.Unlock()
	stateCounter = stateCounter + 1
	stateCodeDebugNameMap[stateCounter] = debug
	stateCodeBrokerMap[stateCounter] = signal.NewBroker()
	go stateCodeBrokerMap[stateCounter].Start()
	return stateCounter
}

// NewStateMachine creates a new state machine
func NewStateMachine(initState StateCode) (s *StateMachine) {
	s = &StateMachine{State: initState}
	return
}

// Printf prints a message with the current state pre-pended
func (s *StateMachine) Printf(fmts string, args ...interface{}) {
	logMutex.Lock()
	defer logMutex.Unlock()
	log.Printf("[STATE=%s] "+fmts, append([]interface{}{GetStateDebugName(s.State)}, args...)...)
}
