package cmd

import (
	"fmt"
	"os"

	"github.com/ltu/fraktal/fabric-config/internal/config"
	"github.com/ltu/fraktal/fabric-config/internal/network"
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
