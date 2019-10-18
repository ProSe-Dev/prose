package cmd

import (
	"fmt"

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
		fmt.Println("TODO")
	},
}
