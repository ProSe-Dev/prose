package cmd

import (
	"log"
	"strconv"

	"github.com/ProSe-Dev/prose/prose/consensus"
	"github.com/ProSe-Dev/prose/prose/node"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func init() {
	createMinerCmd.PersistentFlags().StringP("initNode", "i", "", "initialization node")
	createMinerCmd.PersistentFlags().StringP("consensus", "c", "", "consensus mode")
	createMinerCmd.PersistentFlags().StringP("remoteIP", "r", "127.0.0.1", "IP address accessible to remote nodes - used akin to an ID")
	viper.BindPFlag("minitNode", createMinerCmd.PersistentFlags().Lookup("initNode"))
	viper.BindPFlag("mconsensus", createMinerCmd.PersistentFlags().Lookup("consensus"))
	viper.BindPFlag("mremoteIP", createMinerCmd.PersistentFlags().Lookup("remoteIP"))
	rootCmd.AddCommand(createMinerCmd)
}

var createMinerCmd = &cobra.Command{
	Use:   "mine [port]",
	Short: "Creates a new miner",
	Long:  `Creates a new ProSe blockchain miner.`,
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
		initializationNode := viper.GetString("minitNode")
		c := viper.GetString("mconsensus")
		if c != "" {
			consensusMode = consensus.Mode(c)
		}
		remoteIP := viper.GetString("mremoteIP")
		if n, err = node.NewNode(uint16(port), initializationNode, remoteIP, consensusMode); err != nil {
			log.Fatal(err)
		}
		log.Print("Initialized miner node")
		if err = n.Serve(); err != nil {
			log.Fatal(err)
		}
		return
	},
}
