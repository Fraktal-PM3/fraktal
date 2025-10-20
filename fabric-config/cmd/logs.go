package cmd

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"
)

var logsOptions struct {
	follow bool
}

var logsCmd = &cobra.Command{
	Use:   "logs [services...]",
	Short: "View container logs",
	Long: `View logs from network containers.

Without arguments, shows logs from all containers.
Specify service names to show logs from specific containers.

Examples:
  fabric-config logs                    # All services
  fabric-config logs --follow           # Follow all logs
  fabric-config logs pm3_ca pm3_peer0   # Specific services`,
	RunE: func(cmd *cobra.Command, args []string) error {
		basePath := GetBasePath(cmd)

		net := loadOrCreateNetwork(basePath)
		ctx := context.Background()

		// args contains the service names (if any)
		services := args

		if err := net.ShowLogs(ctx, logsOptions.follow, services...); err != nil {
			return fmt.Errorf("failed to show logs: %w", err)
		}

		return nil
	},
}

func init() {
	logsCmd.Flags().BoolVarP(&logsOptions.follow, "follow", "f", false, "follow log output")
	rootCmd.AddCommand(logsCmd)
}
