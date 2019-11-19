package cmd

import (
	"context"
	"fmt"
	"log"
	"net"
	"strconv"
	"time"

	"github.com/ProSe-Dev/prose/prose/consensus"
	"github.com/ProSe-Dev/prose/prose/gossip"
	"github.com/ProSe-Dev/prose/prose/mining"
	"github.com/ProSe-Dev/prose/prose/node"
	"github.com/ProSe-Dev/prose/prose/proto"
	"github.com/ProSe-Dev/prose/prose/statemachine"
	"github.com/perlin-network/noise"
	"github.com/perlin-network/noise/cipher"
	"github.com/perlin-network/noise/handshake"
	"github.com/perlin-network/noise/skademlia"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"google.golang.org/grpc"
)

func init() {
	createSubvertedMinerCmd.PersistentFlags().StringP("initNode", "i", "", "initialization node")
	createSubvertedMinerCmd.PersistentFlags().StringP("consensus", "c", "", "consensus mode")
	createSubvertedMinerCmd.PersistentFlags().StringP("remoteIP", "r", "127.0.0.1", "IP address accessible to remote nodes - used akin to an ID")
	viper.BindPFlag("sinitNode", createSubvertedMinerCmd.PersistentFlags().Lookup("initNode"))
	viper.BindPFlag("sconsensus", createSubvertedMinerCmd.PersistentFlags().Lookup("consensus"))
	viper.BindPFlag("sremoteIP", createSubvertedMinerCmd.PersistentFlags().Lookup("remoteIP"))
	rootCmd.AddCommand(createSubvertedMinerCmd)
}

var createSubvertedMinerCmd = &cobra.Command{
	Use:   "subvert [port]",
	Short: "Creates a new subverted miner",
	Long:  `Creates a new subverted ProSe blockchain miner.`,
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		var (
			n             *evilNode
			port          uint64
			err           error
			consensusMode consensus.Mode = consensus.DefaultConsensus
		)
		if port, err = strconv.ParseUint(args[0], 10, 32); err != nil {
			log.Fatal(err)
		}
		initializationNode := viper.GetString("sinitNode")
		c := viper.GetString("sconsensus")
		if c != "" {
			consensusMode = consensus.Mode(c)
		}
		remoteIP := viper.GetString("sremoteIP")
		if n, err = newEvilNode(uint16(port), initializationNode, remoteIP, consensusMode); err != nil {
			log.Fatal(err)
		}
		log.Print("Initialized very evil miner node")
		if err = n.Serve(); err != nil {
			log.Fatal(err)
		}
		return
	},
}

type evilNode struct {
	node.Node
}

// AddBlock adds a new block to blockchain
func (n *evilNode) AddBlock(ctx context.Context, in *proto.AddBlockRequest) (resp *proto.AddBlockResponse, err error) {
	data := mining.BlockData{
		Author:     "L33T H4CK0R",
		Timestamp:  mining.TimeToString(time.Now().UTC()),
		CommitHash: "abcdefgthisisahash123",
		FileHashes: map[string]string{},
	}
	n.StateMachine.Printf("MUAHAHAHAAA")
	mining.EnqueueTransactionData(&data)
	// if we're in the middle of consensus already, skip
	if n.StateMachine.State == node.StateIdle {
		n.Consensus.Start()
	}
	resp = &proto.AddBlockResponse{
		ACK: true,
	}
	return
}

func newEvilNode(port uint16, initNode string, remoteIP string, consensusMode consensus.Mode) (n *evilNode, err error) {
	n = &evilNode{}
	n.Blockchain = mining.NewBlockchain()
	n.StateMachine = statemachine.NewStateMachine(node.StateNascent)
	listener, err := net.Listen("tcp", ":"+fmt.Sprint(port))
	if err != nil {
		return
	}
	keys, err := skademlia.NewKeys(1, 2)
	if err != nil {
		return
	}
	addr := net.JoinHostPort(remoteIP, strconv.Itoa(listener.Addr().(*net.TCPAddr).Port))
	n.Client = skademlia.NewClient(addr, keys, skademlia.WithC1(1), skademlia.WithC2(1))
	n.Client.SetCredentials(noise.NewCredentials(addr, handshake.NewECDH(), cipher.NewAEAD(), n.Client.Protocol()))

	n.Server = n.Client.Listen()
	proto.RegisterBlockchainServer(n.Server, n)
	proto.RegisterSyncServer(n.Server, n)
	n.ConsensusMode = consensusMode
	n.Consensus = consensus.RegisterConsensusServer(n.Blockchain, n.StateMachine, n.Server, n.Client, consensusMode)

	if initNode != "" {
		var conn *grpc.ClientConn
		if conn, err = n.Client.Dial(initNode); err != nil {
			return
		}
		log.Printf("Dialed %s", initNode)
		n.Client.Bootstrap()
		if err = n.FastForwardToInitNode(conn); err != nil {
			log.Printf("[ERROR] unable to fastforward: %v", err)
		}
		network := gossip.GetNetwork(n.Client)
		log.Printf("Finished bootstrapping. Network: %s", network)
	}

	n.Serve = func() error {
		n.StateMachine.SetState(node.StateIdle)
		return n.Server.Serve(listener)
	}
	return
}
