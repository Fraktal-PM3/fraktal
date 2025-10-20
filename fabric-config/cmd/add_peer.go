package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var addPeerOptions struct {
	count int
}

var addPeerCmd = &cobra.Command{
	Use:   "add-peer",
	Short: "Add peers to the network",
	Long: `Add one or more peers to the existing Fabric network.

Each peer will be configured with:
  - Unique port assignments
  - MSP directory structure
  - TLS certificates
  - Gossip protocol configuration
  - Core.yaml configuration file`,
	RunE: func(cmd *cobra.Command, args []string) error {
		basePath := GetBasePath(cmd)

		net := loadOrCreateNetwork(basePath)
		if err := net.AddPeers(addPeerOptions.count); err != nil {
			return fmt.Errorf("failed to add peers: %w", err)
		}

		fmt.Printf("\n✓ Successfully added %d peer(s)!\n", addPeerOptions.count)

		return nil
	},
}

func init() {
	addPeerCmd.Flags().IntVar(&addPeerOptions.count, "count", 1, "number of peers to add")
	rootCmd.AddCommand(addPeerCmd)
}
