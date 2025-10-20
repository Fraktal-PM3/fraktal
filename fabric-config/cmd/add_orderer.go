package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var addOrdererOptions struct {
	count int
}

var addOrdererCmd = &cobra.Command{
	Use:   "add-orderer",
	Short: "Add orderers to the network",
	Long: `Add one or more orderers to the existing Fabric network.

Each orderer will be configured with:
  - Unique port assignments
  - MSP directory structure
  - TLS certificates
  - Raft consensus configuration
  - Orderer.yaml configuration file`,
	RunE: func(cmd *cobra.Command, args []string) error {
		basePath := GetBasePath(cmd)

		net := loadOrCreateNetwork(basePath)
		if err := net.AddOrderers(addOrdererOptions.count); err != nil {
			return fmt.Errorf("failed to add orderers: %w", err)
		}

		fmt.Printf("\n✓ Successfully added %d orderer(s)!\n", addOrdererOptions.count)

		return nil
	},
}

func init() {
	addOrdererCmd.Flags().IntVar(&addOrdererOptions.count, "count", 1, "number of orderers to add")
	rootCmd.AddCommand(addOrdererCmd)
}
