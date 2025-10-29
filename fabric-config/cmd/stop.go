package cmd

import (
	"context"
	"fmt"
	"os"

	"github.com/ltu/fraktal/fabric-config/internal/config"
	"github.com/ltu/fraktal/fabric-config/internal/network"
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

		// Ensure that basePath exists
		if _, err := os.Stat(basePath); os.IsNotExist(err) {
			return fmt.Errorf("the provided basepath does not exist : %w", err)
		}
		config, err := config.LoadStack(basePath)
		if err != nil {
			return err
		}
		net := network.Network{
			Config: config,
		}
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
