package gossip

// TODO: We may eventually want to manually extend the broadcasting capabilities of noise here

import (
	"fmt"
	"sort"

	"github.com/perlin-network/noise"
	"github.com/perlin-network/noise/log"
	"github.com/perlin-network/noise/protocol"
	"github.com/perlin-network/noise/skademlia"
)

// BroadcastAsync TODO: actually broadcast to everyone in network
func BroadcastAsync(node *noise.Node, message noise.Message) {
	errs := skademlia.Broadcast(node, message)
	fmt.Println(errs)
}

// GetNodeID returns the address of a node
func GetNodeID(node *noise.Node) string {
	return node.ExternalAddress()
}

// BootstrapNetwork bootstraps a node's network
func BootstrapNetwork(node *noise.Node) {
	skademlia.FindNode(node, protocol.NodeID(node).(skademlia.ID), skademlia.BucketSize(), 8)
}

// GetNetwork returns a sorted list of network IDs
func GetNetwork(node *noise.Node) (networkIDs []string) {
	networkIDs = getNetworkIDs(node)
	sort.Strings(networkIDs)
	log.Info().Msgf("Got network: %s", networkIDs)
	return
}

func getPeers(node *noise.Node) []*noise.Peer {
	var (
		peers []*noise.Peer
	)
	for _, peerID := range skademlia.FindNode(node, protocol.NodeID(node).(skademlia.ID), skademlia.BucketSize(), 8) {
		peer := protocol.Peer(node, peerID)
		if peer == nil {
			continue
		}
		peers = append(peers, peer)
	}
	return peers
}

func getNetworkIDs(node *noise.Node) []string {
	var (
		networkIDs = []string{GetNodeID(node)}
	)
	networkIDs = append(networkIDs, skademlia.Table(node).GetPeers()...)
	return networkIDs
}
