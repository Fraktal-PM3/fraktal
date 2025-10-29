package cmd

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/ltu/fraktal/fabric-config/internal/config"
	"github.com/ltu/fraktal/fabric-config/internal/logger"
	"github.com/ltu/fraktal/fabric-config/internal/network"
	"github.com/spf13/cobra"
)

var initOptions struct {
	channelName string
	numPeers    int
	numOrderers int
	start       bool
}

var initCmd = &cobra.Command{
	Use:   "init",
	Short: "Initialize network with root organization and CA",
	Long: `Initialize a new Fabric network with a root organization and Certificate Authority.

This command creates the basic network structure including:
  - Root organization (RootOrg) with CA
  - MSP directory structures
  - CA server configuration
  - Admin enrollment setup`,
	RunE: func(cmd *cobra.Command, args []string) error {
		if os.Getenv("FABRIC_BIN_PATH") == "" {
			return fmt.Errorf("FABRIC_BIN_PATH environment variable must be set")
		}

		path := GetBasePath(cmd)

		// Check if there exist a network on the basePath
		if _, err := os.Stat(path); !os.IsNotExist(err) {
			return fmt.Errorf("network at path already exits, please make sure to delete it first! : %w", err)
		}

		// Create base path directory
		if err := os.MkdirAll(path, 0o755); err != nil {
			return fmt.Errorf("could not make basePath directory: %w", err)
		}

		basePath, err := filepath.Abs(path)
		if err != nil {
			return fmt.Errorf("failed to get absolute path to basePath: %w", err)
		}

		net := network.NewNetwork(basePath, initOptions.channelName)
		if err := net.Initialize(initOptions.numPeers, initOptions.numOrderers); err != nil {
			return fmt.Errorf("failed to initialize network: %w", err)
		}

		// Start network before creating channel (orderers must be running for osnadmin)
		if initOptions.start {
			logger.Info("starting network")
			ctx := context.Background()
			if err := net.StartNetwork(ctx); err != nil {
				return fmt.Errorf("failed to start network: %w", err)
			}
			logger.Info("network started successfully")

			// Create channel and join orderers/peers (requires running orderers)
			logger.Info("creating channel and joining orderers/peers")
			if err := net.CreateChannel(); err != nil {
				return fmt.Errorf("failed to create channel: %w", err)
			}
			logger.Info("channel created and nodes joined successfully")
		} else {
			logger.Info("network is configured but not started")
			logger.Info("to complete setup run: 'fabric-config start' then 'fabric-config create-channel'")
		}

		// Put a json of the network config in the basePath so that we can restore our configuration.
		if err := config.WriteStack(*net.Config); err != nil {
			return err
		}

		return nil
	},
}

func init() {
	initCmd.Flags().StringVarP(&initOptions.channelName, "channel", "c", defaultChannelName, "channel name")
	initCmd.Flags().IntVar(&initOptions.numPeers, "peers", 1, "number of peer nodes to create under the rootorg")
	initCmd.Flags().IntVar(&initOptions.numOrderers, "orderers", 1, "number of orderer nodes to create under the rootorg")
	initCmd.Flags().BoolVar(&initOptions.start, "start", false, "start the network after setup")

	rootCmd.AddCommand(initCmd)
}
