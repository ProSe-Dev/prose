package cmd

import (
	"context"
	"strconv"

	"log"

	"github.com/ProSe-Dev/prose/prose/consensus"
	"github.com/ProSe-Dev/prose/prose/gossip"
	"github.com/ProSe-Dev/prose/prose/node"
	"github.com/ProSe-Dev/prose/prose/proto"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"google.golang.org/grpc"
)

func init() {
	createRelayCmd.PersistentFlags().StringP("initNode", "i", "", "initialization node")
	createRelayCmd.PersistentFlags().StringP("consensus", "c", "", "consensus mode")
	// TODO: these shouldn't be flags
	createRelayCmd.PersistentFlags().StringP("addBlock", "a", "", "Add new block")
	createRelayCmd.PersistentFlags().BoolP("blockchain", "b", false, "Retrieve blockchain")
	createRelayCmd.PersistentFlags().BoolP("ephemeral", "e", false, "Don't block on listen")

	viper.BindPFlag("rinitNode", createRelayCmd.PersistentFlags().Lookup("initNode"))
	viper.BindPFlag("rconsensus", createRelayCmd.PersistentFlags().Lookup("consensus"))
	viper.BindPFlag("addBlock", createRelayCmd.PersistentFlags().Lookup("addBlock"))
	viper.BindPFlag("blockchain", createRelayCmd.PersistentFlags().Lookup("blockchain"))
	viper.BindPFlag("ephemeral", createRelayCmd.PersistentFlags().Lookup("ephemeral"))
	rootCmd.AddCommand(createRelayCmd)
}

var createRelayCmd = &cobra.Command{
	Use:   "relay [port]",
	Short: "Creates a new relay",
	Long:  `Creates a new ProSe blockchain relay agent.`,
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		var (
			n             *node.Node
			port          uint64
			err           error
			consensusMode consensus.Mode = consensus.DefaultConsensus
		)
		if port, err = strconv.ParseUint(args[0], 10, 32); err != nil {
			log.Fatal(err)
		}
		initializationNode := viper.GetString("rinitNode")
		c := viper.GetString("mconsensus")
		if c != "" {
			consensusMode = consensus.Mode(c)
		}
		if n, err = node.NewNode(uint16(port), initializationNode, false, consensusMode); err != nil {
			log.Fatal(err)
		}
		addBlock := viper.GetString("addBlock")

		if addBlock != "" {
			gossip.Broadcast(n.Client, func(conn *grpc.ClientConn) {
				m := &proto.AddBlockRequest{Data: addBlock}
				client := proto.NewBlockchainClient(conn)
				resp, err := client.AddBlock(context.Background(), m)
				if err != nil {
					log.Printf("[ERROR] unable to add block: %v", err)
				}
				log.Printf("[%s] block submitted: %v\n", conn.Target(), resp.ACK)
			})
		}

		blockchain := viper.GetBool("blockchain")
		if blockchain {
			var resp *proto.GetBlockchainResponse
			gossip.Broadcast(n.Client, func(conn *grpc.ClientConn) {
				m := &proto.GetBlockchainRequest{}
				client := proto.NewBlockchainClient(conn)
				resp, err = client.GetBlockchain(context.Background(), m)
				if err != nil {
					log.Printf("[ERROR] unable to get blockchain: %v", err)
				}
				for idx, b := range resp.Blocks {
					log.Printf("[%s - NODE #%d]\n==================\nHASH: %s\nPREV_HASH: %s\nDATA: %s\n==================\n", conn.Target(), idx, b.Hash, b.PrevBlockHash, b.Data)
				}
			})
		}
		log.Print("Initialized relay node")
		ephemeral := viper.GetBool("ephemeral")
		if !ephemeral {
			n.Serve()
		}
		return
	},
}
