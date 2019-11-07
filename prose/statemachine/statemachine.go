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
	stateCounter          StateCode
	stateCodeMutex        sync.Mutex
	stateSetMutex         sync.Mutex
	stateChangedChan      = make(chan int)
)

// GetStateDebugName returns the debug name for a state
func GetStateDebugName(state StateCode) string {
	return stateCodeDebugNameMap[state]
}

// SetState updates the current state of a node
func (s *StateMachine) SetState(newState StateCode) {
	log.Printf("[STATEMACHINE] set state to %s", GetStateDebugName(newState))
	s.State = newState
}

// Enforce raises an exception if the current state is not the input state
func (s *StateMachine) Enforce(state StateCode) (err error) {
	if s.State != state {
		return fmt.Errorf("invalid state: expected %s but got %s", GetStateDebugName(state), GetStateDebugName(s.State))
	}
	return
}

// NextAvailableStateCode returns the next available state code
func NextAvailableStateCode(debug string) StateCode {
	stateCodeMutex.Lock()
	defer stateCodeMutex.Unlock()
	stateCounter = stateCounter + 1
	stateCodeDebugNameMap[stateCounter] = debug
	return stateCounter
}

// NewStateMachine creates a new state machine
func NewStateMachine(initState StateCode) (s *StateMachine) {
	s = &StateMachine{State: initState}
	return
}
