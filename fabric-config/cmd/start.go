package cmd

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"
)

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Start the network containers",
	Long: `Start all Docker containers for the Fabric network.

This command will:
  - Check Docker and Docker Compose availability
  - Pull required Docker images
  - Start all services defined in docker-compose.yml
  - Wait for containers to become healthy

The network will run in detached mode (background).`,
	RunE: func(cmd *cobra.Command, args []string) error {
		basePath := GetBasePath(cmd)

		net := loadOrCreateNetwork(basePath)

		if err := net.DiscoverExistingNetwork(); err != nil {
			return fmt.Errorf("failed to discover network: %w", err)
		}

		if net.Config.RootOrg == nil {
			return fmt.Errorf("no network found - run 'fabric-config init' first")
		}

		ctx := context.Background()

		// Start CA first and wait for it to initialize
		if err := net.StartCA(ctx); err != nil {
			return fmt.Errorf("failed to start CA: %w", err)
		}

		// Start the rest of the network
		if err := net.StartNetwork(ctx); err != nil {
			return fmt.Errorf("failed to start network: %w", err)
		}

		fmt.Println("✓ Network started successfully")
		return nil
	},
}

func init() {
	rootCmd.AddCommand(startCmd)
}
