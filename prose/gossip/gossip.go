package gossip

import (
	"fmt"
	"sort"
	"strings"

	"github.com/perlin-network/noise/skademlia"
	"google.golang.org/grpc"
)

// NormalizeLocalhost ensures that we only have 127.0.0.1 so we can remove duplicates
func NormalizeLocalhost(id string) string {
	return strings.Replace(id, "localhost", "127.0.0.1", -1)
}

func getUniqueConnectionsMap(client *skademlia.Client) (m map[string]*grpc.ClientConn) {
	m = map[string]*grpc.ClientConn{}
	for _, c := range client.AllPeers() {
		id := NormalizeLocalhost(c.Target())
		m[id] = c
	}
	return
}

// GetNodeID returns the ID of the current node
func GetNodeID(client *skademlia.Client) string {
	return client.ID().Address()
}

// GetNetwork returns the complete network
func GetNetwork(client *skademlia.Client) (ids []string) {
	// include self
	ids = []string{GetNodeID(client)}
	m := getUniqueConnectionsMap(client)
	for k := range m {
		ids = append(ids, k)
	}
	sort.Strings(ids)
	return
}

// Broadcast broadcasts a generic message using a provided handler
func Broadcast(client *skademlia.Client, sendMessage func(*grpc.ClientConn)) {
	m := getUniqueConnectionsMap(client)
	for _, conn := range m {
		sendMessage(conn)
	}
}

// SendMessage sends a message to a specified target if it exists in the network
func SendMessage(target string, client *skademlia.Client, sendMessage func(*grpc.ClientConn)) (err error) {
	m := getUniqueConnectionsMap(client)
	targetConn, ok := m[target]
	if !ok {
		err = fmt.Errorf("%s was not a valid target", target)
		return
	}
	sendMessage(targetConn)
	return
}
