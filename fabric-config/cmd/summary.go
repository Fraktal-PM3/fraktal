package cmd

import (
	"fmt"
	"os"

	"github.com/ltu/fraktal/fabric-config/internal/config"
	"github.com/ltu/fraktal/fabric-config/internal/network"
	"github.com/spf13/cobra"
)

var summaryCmd = &cobra.Command{
	Use:   "summary",
	Short: "Display network configuration summary",
	Long: `Display a summary of the current network configuration.

Shows information about:
  - Root organization and CA
  - Peer nodes and their configurations
  - Orderer nodes and consensus settings
  - Channel configuration
  - Docker service status`,
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

		net.PrintSummary()

		return nil
	},
}

func init() {
	rootCmd.AddCommand(summaryCmd)
}
