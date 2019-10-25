package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var testTransactionCmd = &cobra.Command{
	Use:   "test-transaction [commit-hash]",
	Short: "Tests submission of a transaction",
	Long:  `Tests submission of a transaction.`,
	Args: func(cmd *cobra.Command, args []string) (err error) {
		if len(args) != 1 {
			err = fmt.Errorf("expected 1 positional argument but got %d", len(args))
		}
		return
	},
	RunE: func(cmd *cobra.Command, args []string) (err error) {

		return
	},
}
