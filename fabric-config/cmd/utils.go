package cmd

import (
	"fmt"

	"github.com/ltu/fraktal/fabric-config/internal/network"
)

// loadOrCreateNetwork loads an existing network or creates a new one
func loadOrCreateNetwork(basePath string) *network.Network {
	net := network.NewNetwork(basePath, defaultChannelName)

	// Try to detect existing configuration from directory structure
	if err := net.DiscoverExistingNetwork(); err != nil {
		if IsVerbose() {
			fmt.Printf("Warning: failed to discover existing network: %v\n", err)
		}
	} else if net.Config.RootOrg != nil {
		if IsVerbose() {
			fmt.Println("Using existing network configuration...")
		}
	}

	return net
}
