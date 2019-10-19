package node

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"net/rpc"
	"time"
)

type N int

// ListNodes that we know
func (t *N) ListNodes(argType *int, replyType *[]string) error {
	*replyType = []string{"123456"}
	fmt.Println("doing stuff")
	return nil
}

// Start generic node listener
func Start(port string, knownIP string, knownPort string) {
	var (
		l      net.Listener
		e      error
		client *rpc.Client
	)

	n := new(N)
	rpc.Register(n)
	rpc.HandleHTTP()
	if l, e = net.Listen("tcp", ":"+port); e != nil {
		log.Fatal("listen error", e)
	}

	fmt.Println("About to serve")
	go http.Serve(l, nil)

	fmt.Println("Trying serve " + knownIP + " " + knownPort)
	if knownIP != "" && knownPort != "" {
		fmt.Println("Serving...")
		if client, e = rpc.DialHTTP("tcp", knownIP+":"+knownPort); e != nil {
			log.Fatal(e)
		}
		var arg int = 0
		var reply []string
		fmt.Println("Calling")
		if e = client.Call("N.ListNodes", &arg, &reply); e != nil {
			log.Fatal(e)
		}
		fmt.Println(reply)
	}

	fmt.Println("DONE")
	for {
		time.Sleep(1000)
	}
}
