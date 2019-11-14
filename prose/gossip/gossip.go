package gossip

import (
	"log"
	"net"
	"os"
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

// GetLocalIP returns the local IPv4 address by first trying the preferred outbound,
// and then any available IPv4 and lastly if nothing is found returns 127.0.0.1
func GetLocalIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)
	ipv4 := localAddr.IP.To4()
	if ipv4 != nil {
		return ipv4.String()
	}

	// any IP address
	host, _ := os.Hostname()
	addrs, _ := net.LookupIP(host)
	for _, addr := range addrs {
		if ipv4 := addr.To4(); ipv4 != nil {
			return ipv4.String()
		}
	}

	// couldn't find anything
	return "127.0.0.1"
}
