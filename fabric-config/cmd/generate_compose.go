package cmd

import (
	"fmt"

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

		net := loadOrCreateNetwork(basePath)
		if err := net.GenerateDockerCompose(); err != nil {
			return fmt.Errorf("failed to generate docker-compose: %w", err)
		}

		return nil
	},
}

func init() {
	rootCmd.AddCommand(generateComposeCmd)
}
