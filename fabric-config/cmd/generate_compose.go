package cmd

import (
	"fmt"
	"os"

	"github.com/ltu/fraktal/fabric-config/internal/config"
	"github.com/ltu/fraktal/fabric-config/internal/network"
	"github.com/spf13/cobra"
)

var generateComposeCmd = &cobra.Command{
	Use:   "generate-compose",
	Short: "Generate docker-compose.yml file",
	Long: `Generate docker-compose.yml configuration file for the network.

The generated compose file includes:
  - CA service with health checks
  - Orderer service(s) with etcdraft consensus
  - Peer service(s) with gossip protocol
  - CLI service for channel operations
  - Named volumes for data persistence
  - Bridge network for inter-container communication`,
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
		if err := net.GenerateDockerCompose(); err != nil {
			return fmt.Errorf("failed to generate docker-compose: %w", err)
		}

		return nil
	},
}

func init() {
	rootCmd.AddCommand(generateComposeCmd)
}
