package cmd

import (
	"context"
	"fmt"
	"os"

	"github.com/ltu/fraktal/fabric-config/internal/config"
	"github.com/ltu/fraktal/fabric-config/internal/network"
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

		if net.Config.Orgs[0] == nil {
			return fmt.Errorf("no network found - run 'fabric-config init' first")
		}

		ctx := context.Background()

		// Start CA first and wait for it to initialize
		if err := net.StartCA(ctx, net.Config.Orgs[0].Name); err != nil {
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
