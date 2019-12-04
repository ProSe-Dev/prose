package signal

import (
	"errors"
	"fmt"
	"time"
)

// Broker enables message broadcasting and awaiting events
// Credits: https://stackoverflow.com/a/49877632
type Broker struct {
	stopChan    chan struct{}
	publishChan chan interface{}
	subChan     chan chan interface{}
	unsubChan   chan chan interface{}
}

// NewBroker returns a new state broker
func NewBroker() *Broker {
	return &Broker{
		stopChan:    make(chan struct{}),
		publishChan: make(chan interface{}, 1),
		subChan:     make(chan chan interface{}, 1),
		unsubChan:   make(chan chan interface{}, 1),
	}
}

// Start begins the broker loop
func (b *Broker) Start() {
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
func (b *Broker) Stop() {
	close(b.stopChan)
}

// Subscribe returns a channel for messages
func (b *Broker) Subscribe() chan interface{} {
	msgChan := make(chan interface{}, 5)
	b.subChan <- msgChan
	return msgChan
}

// Unsubscribe removes the current channel from the subscribed channel
func (b *Broker) Unsubscribe(msgChan chan interface{}) {
	b.unsubChan <- msgChan
}

// Publish broadcasts a message to all subscribers
func (b *Broker) Publish(msg interface{}) {
	select {
	case b.publishChan <- msg:
	default:
	}
}

// WaitOnSignal waits until the specified signal is broadcasted
func (b *Broker) WaitOnSignal(signal interface{}) (err error) {
	msgChan := b.Subscribe()
	for data := range msgChan {
		if data == signal {
			break
		}
	}
	b.Unsubscribe(msgChan)
	return
}

// WaitOnSignalTimeout waits until the specified signal is broadcasted with timeout
func (b *Broker) WaitOnSignalTimeout(signal interface{}, timeout int64) (err error) {
	msgChan := b.Subscribe()
	done := false
	for !done {
		select {
		case data := <-msgChan:
			done = data == signal
		case <-time.After(time.Duration(timeout) * time.Second):
			return fmt.Errorf("timed out while waiting for signal %s", signal)
		}
	}
	b.Unsubscribe(msgChan)
	return
}

// WaitOnAny waits until any signal is broadcasted
func (b *Broker) WaitOnAny() (data interface{}, err error) {
	msgChan := b.Subscribe()
	data = <-msgChan
	b.Unsubscribe(msgChan)
	return
}

// WaitOnAnyTimeout waits until any signal is broadcasted with timeout
func (b *Broker) WaitOnAnyTimeout(timeout int64) (data interface{}, err error) {
	msgChan := b.Subscribe()
	select {
	case data = <-msgChan:
	case <-time.After(time.Duration(timeout) * time.Second):
		err = errors.New("timed out while waiting for signal")
		return
	}
	b.Unsubscribe(msgChan)
	return
}
