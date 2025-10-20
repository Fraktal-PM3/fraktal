package cmd

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"
)

var stopCmd = &cobra.Command{
	Use:   "stop",
	Short: "Stop the network containers",
	Long: `Stop all running Docker containers in the Fabric network.

This command stops containers without removing them. Container data
and volumes are preserved. Use 'start' to resume the network.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		basePath := GetBasePath(cmd)

		net := loadOrCreateNetwork(basePath)
		ctx := context.Background()

		if err := net.StopNetwork(ctx); err != nil {
			return fmt.Errorf("failed to stop network: %w", err)
		}

		return nil
	},
}

func init() {
	rootCmd.AddCommand(stopCmd)
}
