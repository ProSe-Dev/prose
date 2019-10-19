package cmd

import (
	"github.com/ProSe-Dev/prose/blockchain/node"
	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(createMinerCmd)
}

var createMinerCmd = &cobra.Command{
	Use:   "create-miner",
	Short: "Creates a new miner",
	Long:  `Creates a new ProSe blockchain miner.`,
	Run: func(cmd *cobra.Command, args []string) {
		// TODO: validate args
		if len(args) >= 3 {
			node.Start(args[0], args[1], args[2])
		} else {
			// we probably don't want to call this...
			node.Start(args[0], "", "")
		}
	},
}
