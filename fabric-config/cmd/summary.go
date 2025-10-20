package cmd

import (
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

		net := loadOrCreateNetwork(basePath)
		net.PrintSummary()

		return nil
	},
}

func init() {
	rootCmd.AddCommand(summaryCmd)
}
