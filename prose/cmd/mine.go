package cmd

import (
	"strconv"

	"github.com/ProSe-Dev/prose/prose/node"
	"github.com/perlin-network/noise"
	"github.com/perlin-network/noise/log"
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
			n    *noise.Node
			port uint64
			err  error
		)
		if port, err = strconv.ParseUint(args[0], 10, 32); err != nil {
			log.Panic().Err(err)
		}
		initializationNode := viper.GetString("minitNode")
		if n, err = node.NewNode(uint16(port), initializationNode, true); err != nil {
			log.Panic().Err(err)
		}
		log.Info().Msg("Initialized miner node")
		n.Listen()
		return
	},
}
