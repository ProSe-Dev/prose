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
	viper.BindPFlag("minitNode", createMinerCmd.PersistentFlags().Lookup("initNode"))
	viper.BindPFlag("mconsensus", createMinerCmd.PersistentFlags().Lookup("consensus"))
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
		c := viper.GetString("mconsensus")
		if c != "" {
			consensusMode = consensus.Mode(c)
		}
		initializationNode := viper.GetString("minitNode")
		if n, err = node.NewNode(uint16(port), initializationNode, true, consensusMode); err != nil {
			log.Fatal(err)
		}
		log.Print("Initialized miner node")
		n.Serve()
		return
	},
}
