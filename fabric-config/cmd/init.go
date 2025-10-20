package cmd

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/ltu/fraktal/fabric-config/internal/enrollment"
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
		if err := net.Initialize(); err != nil {
			return fmt.Errorf("failed to initialize network: %w", err)
		}
		fmt.Println("\n✓ Base network configuration initialized successfully!")

		fmt.Println("\nAdding peers to configuration...")
		if err := net.AddPeers(initOptions.numPeers); err != nil {
			return fmt.Errorf("failed to initialize peer configuration: %w", err)
		}
		fmt.Println("\n✓ Peer configuration initialized successfully!")

		fmt.Println("\nAdding orderers to configuration...")
		if err := net.AddOrderers(initOptions.numOrderers); err != nil {
			return fmt.Errorf("failed to initialize orderer configuration: %w", err)
		}
		fmt.Println("\n✓ Orderer configuration initialized successfully!")

		net.PrintSummary()

		if err := net.GenerateDockerCompose(); err != nil {
			return fmt.Errorf("failed to generate docker-compose: %w", err)
		}
		fmt.Println("\n✓ Docker-compose configuration initialized successfully!")

		// Now that we have the base configuration we need to enroll org, peers, orderers and users.
		ctx := context.Background()
		net.StartCA(ctx)

		if err := enrollment.EnrollOrganization(net.Config.RootOrg); err != nil {
			return fmt.Errorf("failed to enroll root org: %w", err)
		}
		fmt.Println("\n✓ Enrolled root org successfully!")

		fmt.Println("\nEnrolling peers...")
		for _, peer := range net.Config.Peers {
			if err := enrollment.EnrollPeer(peer, net.Config.RootOrg); err != nil {
				return fmt.Errorf("failed to enroll peer: %w", err)
			}
		}
		fmt.Println("\n✓ Enrolled peers successfully!")

		fmt.Println("\nEnrolling orderers...")
		for _, orderer := range net.Config.Orderers {
			if err := enrollment.EnrollOrderer(orderer, net.Config.RootOrg); err != nil {
				return fmt.Errorf("failed to enroll orderer: %w", err)
			}
		}
		fmt.Println("\n✓ Enrolled orderers successfully!")

		fmt.Println("\nEnrolling users...")
		if err := enrollment.EnrollOrgAdmin(net.Config.RootOrg); err != nil {
			return fmt.Errorf("failed to enroll admin user: %w", err)
		}
		if err := enrollment.EnrollOrgUser(net.Config.RootOrg); err != nil {
			return fmt.Errorf("failed to enroll user: %w", err)
		}
		fmt.Println("\n✓ Enrolled users successfully!")

		net.StopCA(ctx)

		// Now that orderers are enrolled with TLS certs, generate channel artifacts
		fmt.Println("\nGenerating channel artifacts (requires TLS certificates)...")
		if err := net.GenerateChannelArtifacts(); err != nil {
			return fmt.Errorf("failed to generate channel artifacts: %w", err)
		}
		fmt.Println("\n✓ Channel artifacts generated successfully!")

		// Start network before creating channel (orderers must be running for osnadmin)
		if initOptions.start {
			fmt.Println("\n=== Starting Network ===")
			ctx := context.Background()
			if err := net.StartNetwork(ctx); err != nil {
				return fmt.Errorf("failed to start network: %w", err)
			}
			fmt.Println("\n✓ Network started successfully!")

			// Create channel and join orderers/peers (requires running orderers)
			fmt.Println("\nCreating channel and joining orderers/peers...")
			if err := net.CreateChannel(); err != nil {
				return fmt.Errorf("failed to create channel: %w", err)
			}
			fmt.Println("\n✓ Channel created and nodes joined successfully!")
		} else {
			fmt.Println("\nNetwork is configured but not started.")
			fmt.Println("To complete setup: 'fabric-config start' then 'fabric-config create-channel'")
		}

		return nil
	},
}

func init() {
	initCmd.Flags().StringVarP(&initOptions.channelName, "channel", "c", defaultChannelName, "channel name")
	initCmd.Flags().IntVar(&initOptions.numPeers, "peers", 1, "number of peer nodes to create")
	initCmd.Flags().IntVar(&initOptions.numOrderers, "orderers", 1, "number of orderer nodes to create")
	initCmd.Flags().BoolVar(&initOptions.start, "start", false, "start the network after setup")

	rootCmd.AddCommand(initCmd)
}
