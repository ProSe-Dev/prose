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
	createRelayCmd.PersistentFlags().StringP("initNode", "i", "", "initialization node")
	createRelayCmd.PersistentFlags().StringP("consensus", "c", "", "consensus mode")
	viper.BindPFlag("rinitNode", createRelayCmd.PersistentFlags().Lookup("initNode"))
	viper.BindPFlag("rconsensus", createRelayCmd.PersistentFlags().Lookup("consensus"))
	rootCmd.AddCommand(createRelayCmd)
}

var createRelayCmd = &cobra.Command{
	Use:   "relay [port]",
	Short: "Creates a new relay",
	Long:  `Creates a new ProSe blockchain relay agent.`,
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
		initializationNode := viper.GetString("rinitNode")
		if n, err = node.NewNode(uint16(port), initializationNode, false); err != nil {
			log.Panic().Err(err)
		}
		log.Info().Msg("Initialized relay node")
		node.MakeTransaction(n, "abcdefg", "Paul Wang")
		n.Listen()
		return
	},
}
