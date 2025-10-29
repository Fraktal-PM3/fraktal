package cmd

import (
	"context"
	"fmt"
	"os"

	"github.com/ltu/fraktal/fabric-config/internal/config"
	"github.com/ltu/fraktal/fabric-config/internal/network"
	"github.com/spf13/cobra"
)

var downOptions struct {
	volumes bool
}

var downCmd = &cobra.Command{
	Use:   "down",
	Short: "Stop and remove network containers",
	Long: `Stop and remove all Docker containers in the Fabric network.

By default, this command removes containers but preserves volumes
and networks. Use the --volumes flag to also remove volumes.

WARNING: Using --volumes will delete all blockchain data and cannot be undone.`,
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

		if downOptions.volumes {
			if err := net.DownNetworkWithVolumes(ctx); err != nil {
				return fmt.Errorf("failed to remove network with volumes: %w", err)
			}
		} else {
			if err := net.DownNetwork(ctx); err != nil {
				return fmt.Errorf("failed to remove network: %w", err)
			}
		}

		return nil
	},
}

func init() {
	downCmd.Flags().BoolVar(&downOptions.volumes, "volumes", false, "remove volumes as well")
	rootCmd.AddCommand(downCmd)
}
