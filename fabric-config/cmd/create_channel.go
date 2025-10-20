package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var createChannelOptions struct {
	channelName string
}

var createChannelCmd = &cobra.Command{
	Use:   "create-channel",
	Short: "Create and configure channel",
	Long: `Generate channel artifacts and create the channel.

This command will:
  - Generate configtx.yaml
  - Create genesis block
  - Create channel transaction
  - Create anchor peer update transaction
  - Join peers and orderers to the channel`,
	RunE: func(cmd *cobra.Command, args []string) error {
		basePath := GetBasePath(cmd)

		net := loadOrCreateNetwork(basePath)
		net.Config.ChannelName = createChannelOptions.channelName

		// Generate channel artifacts
		if err := net.GenerateChannelArtifacts(); err != nil {
			return fmt.Errorf("failed to generate channel artifacts: %w", err)
		}

		// Create and join channel
		if err := net.CreateChannel(); err != nil {
			return fmt.Errorf("failed to create channel: %w", err)
		}

		fmt.Printf("\n✓ Channel '%s' created successfully!\n", createChannelOptions.channelName)

		return nil
	},
}

func init() {
	createChannelCmd.Flags().StringVarP(&createChannelOptions.channelName, "channel", "c", defaultChannelName, "channel name")
	rootCmd.AddCommand(createChannelCmd)
}
