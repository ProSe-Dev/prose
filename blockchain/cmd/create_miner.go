package cmd

import (
	"fmt"
	"strconv"

	"github.com/ProSe-Dev/prose/blockchain/node"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func init() {
	createMinerCmd.PersistentFlags().StringP("initNode", "i", "", "initialization node")
	viper.BindPFlag("PersistentFlags", createMinerCmd.PersistentFlags().Lookup("initNode"))
	createMinerCmd.PersistentFlags().StringP("consensus", "c", "pbft", "initialization node")
	viper.BindPFlag("initNode", createMinerCmd.PersistentFlags().Lookup("initNode"))
	rootCmd.AddCommand(createMinerCmd)
}

var createMinerCmd = &cobra.Command{
	Use:   "create-miner [port]",
	Short: "Creates a new miner",
	Long:  `Creates a new ProSe blockchain miner.`,
	Args: func(cmd *cobra.Command, args []string) (err error) {
		if len(args) != 1 {
			err = fmt.Errorf("expected 1 positional argument but got %d", len(args))
		}
		return
	},
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		var (
			port uint64
		)
		port, err = strconv.ParseUint(args[0], 10, 32)
		initializationNode := viper.GetString("initNode")
		_, err = node.NewNode(uint16(port), initializationNode, true)
		return
	},
}
