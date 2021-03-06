package cmd

import (
	"strconv"

	"log"

	"github.com/ProSe-Dev/prose/prose/consensus"
	"github.com/ProSe-Dev/prose/prose/node"
	"github.com/ProSe-Dev/prose/relay/server"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func init() {
	createRelayCmd.PersistentFlags().StringP("initNode", "i", "", "initialization node")
	createRelayCmd.PersistentFlags().StringP("consensus", "c", "", "consensus mode")
	createRelayCmd.PersistentFlags().StringP("remoteIP", "r", "127.0.0.1", "IP address accessible to remote nodes - used akin to an ID")
	if err := viper.BindPFlag("rinitNode", createRelayCmd.PersistentFlags().Lookup("initNode")); err != nil {
		panic(err)
	}
	if err := viper.BindPFlag("rconsensus", createRelayCmd.PersistentFlags().Lookup("consensus")); err != nil {
		panic(err)
	}
	if err := viper.BindPFlag("rremoteIP", createRelayCmd.PersistentFlags().Lookup("remoteIP")); err != nil {
		panic(err)
	}
	rootCmd.AddCommand(createRelayCmd)
}

var createRelayCmd = &cobra.Command{
	Use:   "start [server-port] [node-port]",
	Short: "Creates a new relay",
	Long:  `Creates a new ProSe blockchain relay agent.`,
	Args:  cobra.ExactArgs(2),
	Run: func(cmd *cobra.Command, args []string) {
		var (
			n             *node.Node
			rport         uint64
			sport         uint64
			err           error
			consensusMode consensus.Mode = consensus.DefaultConsensus
		)
		if sport, err = strconv.ParseUint(args[0], 10, 32); err != nil {
			log.Fatal(err)
		}
		if rport, err = strconv.ParseUint(args[1], 10, 32); err != nil {
			log.Fatal(err)
		}
		initializationNode := viper.GetString("rinitNode")
		c := viper.GetString("rconsensus")
		if c != "" {
			consensusMode = consensus.Mode(c)
		}
		remoteIP := viper.GetString("rremoteIP")
		if n, err = node.NewNode(uint16(rport), initializationNode, remoteIP, consensusMode); err != nil {
			log.Fatal(err)
		}
		log.Print("Initialized relay node")
		go func() {
			if err = n.Serve(); err != nil {
				log.Fatal(err)
			}
		}()
		server.Start(n, sport)
	},
}
