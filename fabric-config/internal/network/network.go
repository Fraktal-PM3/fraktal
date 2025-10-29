package network

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/ltu/fraktal/fabric-config/internal/ca"
	"github.com/ltu/fraktal/fabric-config/internal/channel"
	"github.com/ltu/fraktal/fabric-config/internal/config"
	"github.com/ltu/fraktal/fabric-config/internal/orderer"
	"github.com/ltu/fraktal/fabric-config/internal/peer"
)

const (
	// Port Allocation Strategy - Clear, non-overlapping ranges
	//
	// Service Ports (7000-7999):
	//   - Peers:    7050-7099 (main)
	//   - Orderers: 7100-7149 (main)
	//
	// Chaincode Ports (8000-8999):
	//   - Peer Chaincode: 8100-8149
	//
	// Operations/Admin Ports (9000+):
	//   - CA:              9000
	//   - Peer Ops:        9050-9099
	//   - Orderer Ops:     9150-9199
	//   - Orderer Admin:   9200-9249

	defaultPeerStartPort          = 7050
	defaultOrdererStartPort       = 7100
	defaultPeerChaincodeStartPort = 8100

	defaultCAPort                = 9000
	defaultPeerOpsStartPort      = 9050
	defaultOrdererOpsStartPort   = 9150
	defaultOrdererAdminStartPort = 9200

	// Validation limits based on port ranges
	maxPeerCount    = 50 // 7050-7099, 8100-8149, 9050-9099
	maxOrdererCount = 50 // 7100-7149, 9150-9199, 9200-9249
) // Network represents a Fabric network instance
type Network struct {
	Config *config.NetworkConfig
}

// OrgDefinition defines an organization to be created
type OrgDefinition struct {
	Name       string // Organization name (e.g., "root-org", "org1", "org2")
	Domain     string // Organization domain (e.g., "pm3.org", "org1.pm3.org")
	Identifier string // Unique identifier for bootstrap credentials (e.g., "rca", "org1ca")
}

// NewNetwork creates a new network instance
func NewNetwork(basePath, channelName string) *Network {
	netConfig := config.DefaultNetworkConfig()
	netConfig.BasePath = basePath
	netConfig.ChannelName = channelName

	return &Network{
		Config: netConfig,
	}
}

// prepareBaseDirectory ensures the base directory exists and is writable
func (n *Network) prepareBaseDirectory() error {
	// Check if organizations directory exists
	orgsPath := filepath.Join(n.Config.BasePath, "organizations")
	ordererOrgsPath := filepath.Join(orgsPath, "ordererOrganizations")
	peerOrgsPath := filepath.Join(orgsPath, "peerOrganizations")

	// Try to create the directory with proper permissions
	if err := os.MkdirAll(orgsPath, 0o755); err != nil {
		return fmt.Errorf("failed to create organizations directory at %s: %w\nPlease ensure you have write permissions or run: sudo chown -R $USER:$USER %s",
			orgsPath, err, n.Config.BasePath)
	}

	if err := os.MkdirAll(ordererOrgsPath, 0o755); err != nil {
		return fmt.Errorf("failed to create organizations directory at %s: %w\nPlease ensure you have write permissions or run: sudo chown -R $USER:$USER %s",
			ordererOrgsPath, err, n.Config.BasePath)
	}

	if err := os.MkdirAll(peerOrgsPath, 0o755); err != nil {
		return fmt.Errorf("failed to create organizations directory at %s: %w\nPlease ensure you have write permissions or run: sudo chown -R $USER:$USER %s",
			peerOrgsPath, err, n.Config.BasePath)
	}

	// Verify we can write to the directory
	testFile := filepath.Join(orgsPath, ".write_test")
	if err := os.WriteFile(testFile, []byte("test"), 0o644); err != nil {
		return fmt.Errorf("directory %s exists but is not writable: %w\nPlease fix permissions: sudo chown -R $USER:$USER %s",
			orgsPath, err, n.Config.BasePath)
	}
	os.Remove(testFile) // Clean up test file

	return nil
}

// AddOrganization creates and adds a new organization to the network
// tlsCA is the TLS CA organization used to sign the org CA certificates
func (n *Network) AddOrganization(ctx context.Context, tlsCA *config.Organization, orgDef OrgDefinition) error {
	fmt.Printf("Creating organization '%s'...\n", orgDef.Name)

	// Register and enroll a bootstrap identity for this org with the TLS CA
	enrollConfig, err := ca.RegAndEnrollOrgCABootrapID(n.Config, tlsCA, orgDef.Identifier)
	if err != nil {
		return fmt.Errorf("failed to register and enroll %s CA bootstrap identity: %w", orgDef.Name, err)
	}

	// Create the organization CA using the bootstrap credentials
	org, err := ca.CreateOrgWithEnroll(n.Config, enrollConfig, orgDef.Name, orgDef.Domain)
	if err != nil {
		return fmt.Errorf("failed to create %s CA: %w", orgDef.Name, err)
	}
	n.AddOrg(org)

	// Start the CA server for this organization
	n.StartCA(ctx, org.Name)

	// Enroll the admin for this organization
	if err := ca.EnrollOrgAdmin(n.Config, org); err != nil {
		return fmt.Errorf("failed to enroll admin for %s: %w", orgDef.Name, err)
	}

	fmt.Printf("✓ Organization '%s' created with CA at %s:%d\n", org.Name, org.CA.Host, org.CA.Port)
	return nil
}

// Initialize initializes the network with root organization and CA
func (n *Network) Initialize(numPeers int, numOrderers int) error {
	fmt.Println("Initializing Fabric network...")

	// Ensure base directory is properly set up
	if err := n.prepareBaseDirectory(); err != nil {
		return fmt.Errorf("failed to prepare base directory: %w", err)
	}

	// Create root order organization with CA
	rootOrgTLSCA, err := ca.CreateRootOrgTLSCA(n.Config.BasePath, n.Config.FabricBinPath)
	if err != nil {
		return fmt.Errorf("failed to create root organization TLS CA: %w", err)
	}
	n.AddOrg(rootOrgTLSCA)

	ctx := context.Background()

	n.StartCA(ctx, rootOrgTLSCA.Name)

	if err := ca.EnrollBootstrapUserTLSCA(n.Config, rootOrgTLSCA); err != nil {
		return fmt.Errorf("failed to enroll bootstrap user with root TLS CA: %w", err)
	}

	// Create the root organization
	if err := n.AddOrganization(ctx, rootOrgTLSCA, OrgDefinition{
		Name:       "root-org",
		Domain:     "pm3.org",
		Identifier: "rca",
	}); err != nil {
		return err
	}

	// Stop all CA servers before returning
	n.StopCA(ctx)

	fmt.Println("\n✓ Network initialization complete")
	return nil
}

// InitializeWithOrgs initializes the network with multiple organizations
// This allows you to create an arbitrary number of organizations programmatically
func (n *Network) InitializeWithOrgs(orgDefs []OrgDefinition) error {
	fmt.Println("Initializing Fabric network with multiple organizations...")

	// Ensure base directory is properly set up
	if err := n.prepareBaseDirectory(); err != nil {
		return fmt.Errorf("failed to prepare base directory: %w", err)
	}

	// Create root order organization with CA
	rootOrgTLSCA, err := ca.CreateRootOrgTLSCA(n.Config.BasePath, n.Config.FabricBinPath)
	if err != nil {
		return fmt.Errorf("failed to create root organization TLS CA: %w", err)
	}
	n.AddOrg(rootOrgTLSCA)

	ctx := context.Background()

	n.StartCA(ctx, rootOrgTLSCA.Name)

	if err := ca.EnrollBootstrapUserTLSCA(n.Config, rootOrgTLSCA); err != nil {
		return fmt.Errorf("failed to enroll bootstrap user with root TLS CA: %w", err)
	}

	// Create all defined organizations
	for _, orgDef := range orgDefs {
		if err := n.AddOrganization(ctx, rootOrgTLSCA, orgDef); err != nil {
			return err
		}
	}

	// Stop all CA servers before returning
	n.StopCA(ctx)

	fmt.Printf("\n✓ Network initialization complete with %d organization(s)\n", len(orgDefs))
	return nil
}

func (n *Network) AddOrg(org *config.Organization) {
	n.Config.Orgs = append(n.Config.Orgs, org)
	n.Config.Channel.Organizations = append(n.Config.Channel.Organizations, org)
	// Regenerate docker-compose as we have changed network config
	n.GenerateDockerCompose()
}

// AddPeers adds a specified number of peers to the network
func (n *Network) AddPeers(count int) error {
	if n.Config.Orgs[0] == nil {
		return fmt.Errorf("network not initialized - run Initialize() first")
	}

	// Input validation
	if count <= 0 {
		return fmt.Errorf("peer count must be positive, got: %d", count)
	}
	if count > maxPeerCount {
		return fmt.Errorf("peer count exceeds maximum allowed (%d), got: %d", maxPeerCount, count)
	}

	fmt.Printf("Adding %d peer(s) to the network...\n", count)

	for i := 0; i < count; i++ {
		currentPeerIndex := len(n.Config.Peers)
		peerName := fmt.Sprintf("peer%d", currentPeerIndex)
		peerPort := defaultPeerStartPort + currentPeerIndex

		peerConfig := &config.PeerConfig{
			Name:           peerName,
			Organization:   n.Config.Orgs[0].Name,
			Port:           peerPort,
			ChaincodePort:  defaultPeerChaincodeStartPort + currentPeerIndex,
			OperationsPort: defaultPeerOpsStartPort + currentPeerIndex,
			TLSEnabled:     true,
			MSPConfigPath:  filepath.Join(n.Config.Orgs[0].Path, "peers", peerName+"."+n.Config.Orgs[0].Domain, "msp"),
			MSPID:          n.Config.Orgs[0].MSPID,
		}

		// Set gossip bootstrap for non-first peers
		if currentPeerIndex > 0 {
			peerConfig.GossipBootstrap = fmt.Sprintf("peer0.%s:%d", n.Config.Orgs[0].Domain, defaultPeerStartPort)
		}

		n.Config.Peers = append(n.Config.Peers, peerConfig)

		// Create peer MSP structure
		if err := peer.CreatePeerMSP(peerConfig, n.Config.Orgs[0]); err != nil {
			return fmt.Errorf("failed to create peer MSP for %s: %w", peerName, err)
		}

		// Generate core.yaml
		coreConfig, err := peer.GenerateCoreYAML(peerConfig, n.Config.Orgs[0])
		if err != nil {
			return fmt.Errorf("failed to generate core.yaml for %s: %w", peerName, err)
		}

		coreYAMLPath := filepath.Join(n.Config.BasePath, "config", peerName, "core.yaml")
		if err := peer.WriteCoreYAML(coreConfig, coreYAMLPath); err != nil {
			return fmt.Errorf("failed to write core.yaml for %s: %w", peerName, err)
		}

		fmt.Printf("  ✓ Peer '%s' created at port %d\n", peerName, peerPort)
	}

	return nil
}

// AddOrderers adds a specified number of orderers to the network
func (n *Network) AddOrderers(count int) error {
	if n.Config.Orgs[0] == nil {
		return fmt.Errorf("network not initialized - run Initialize() first")
	}

	// Input validation
	if count <= 0 {
		return fmt.Errorf("orderer count must be positive, got: %d", count)
	}
	if count > maxOrdererCount {
		return fmt.Errorf("orderer count exceeds maximum allowed (%d), got: %d", maxOrdererCount, count)
	}

	fmt.Printf("Adding %d orderer(s) to the network...\n", count)

	for i := 0; i < count; i++ {
		currentOrdererIndex := len(n.Config.Orderers)
		ordererName := fmt.Sprintf("orderer%d", currentOrdererIndex)
		ordererPort := defaultOrdererStartPort + currentOrdererIndex

		// Create orderer configuration with correct port allocation
		ordererConfig := &config.OrdererConfig{
			Name:           ordererName,
			Organization:   n.Config.Orgs[0].Name,
			Port:           ordererPort,
			AdminPort:      defaultOrdererAdminStartPort + currentOrdererIndex,
			OperationsPort: defaultOrdererOpsStartPort + currentOrdererIndex,
			TLSEnabled:     true,
			OrdererType:    "etcdraft",
			MSPConfigPath:  filepath.Join(n.Config.Orgs[0].Path, "orderers", ordererName+"."+n.Config.Orgs[0].Domain, "msp"),
			MSPID:          n.Config.Orgs[0].MSPID,
			GenesisBlock:   filepath.Join(n.Config.Orgs[0].Path, "system-genesis-block", "genesis.block"),
		}

		n.Config.Orderers = append(n.Config.Orderers, ordererConfig)

		// Create orderer MSP structure
		if err := orderer.CreateOrdererMSP(ordererConfig, n.Config.Orgs[0]); err != nil {
			return fmt.Errorf("failed to create orderer MSP for %s: %w", ordererName, err)
		}

		// Generate orderer.yaml
		ordererYAMLConfig, err := orderer.GenerateOrdererYAML(ordererConfig, n.Config.Orgs[0])
		if err != nil {
			return fmt.Errorf("failed to generate orderer.yaml for %s: %w", ordererName, err)
		}

		ordererYAMLPath := filepath.Join(n.Config.BasePath, "config", ordererName, "orderer.yaml")
		if err := orderer.WriteOrdererYAML(ordererYAMLConfig, ordererYAMLPath); err != nil {
			return fmt.Errorf("failed to write orderer.yaml for %s: %w", ordererName, err)
		}

		fmt.Printf("  ✓ Orderer '%s' created at port %d\n", ordererName, ordererPort)
	}

	// Create genesis block directory
	genesisBlockDir := filepath.Join(n.Config.Orgs[0].Path, "system-genesis-block")
	if err := os.MkdirAll(genesisBlockDir, 0o755); err != nil {
		return fmt.Errorf("failed to create genesis block directory: %w", err)
	}

	return nil
}

// GenerateChannelArtifacts generates channel configuration artifacts
func (n *Network) GenerateChannelArtifacts() error {
	if len(n.Config.Orderers) == 0 {
		return fmt.Errorf("no orderers configured - add at least one orderer first")
	}

	fmt.Printf("Generating channel artifacts for '%s'...\n", n.Config.ChannelName)

	baseConfigPath := "config/configtx.yaml"
	configTx, err := channel.InitializeConfigTx(baseConfigPath, n.Config)
	if err != nil {
		return fmt.Errorf("failed to initialize configtx: %w", err)
	}

	configTxPath := filepath.Join(n.Config.BasePath, "config", "configtx.yaml")
	if err := channel.WriteConfigTx(configTx, configTxPath); err != nil {
		return fmt.Errorf("failed to write configtx: %w", err)
	}

	fmt.Printf("  ✓ Generated configtx.yaml at %s\n", configTxPath)

	// Create channel genesis block using channel participation approach (Fabric 2.3+)
	channelBlockPath := filepath.Join(n.Config.BasePath, "channel-artifacts", n.Config.ChannelName+".block")
	if err := channel.CreateChannelGenesisBlock(configTxPath, channelBlockPath, n.Config.ChannelName); err != nil {
		return fmt.Errorf("failed to create channel genesis block: %w", err)
	}

	fmt.Printf("  ✓ Channel genesis block created at %s\n", channelBlockPath)

	return nil
}

// CreateChannel creates the channel and joins peers and orderers
func (n *Network) CreateChannel() error {
	if len(n.Config.Peers) == 0 {
		return fmt.Errorf("no peers configured - add at least one peer first")
	}

	fmt.Printf("Creating channel '%s'...\n", n.Config.ChannelName)

	fmt.Printf("Waiting for orderers to be ready...\n")
	for _, ord := range n.Config.Orderers {
		if err := orderer.WaitForAdminEndpoint(ord, 30*time.Second); err != nil {
			return fmt.Errorf("orderer %s admin endpoint not ready: %w", ord.Name, err)
		}
	}

	// Channel block path
	channelBlockPath := filepath.Join(n.Config.BasePath, "channel-artifacts", n.Config.ChannelName+".block")

	// Join orderers to channel
	for _, ord := range n.Config.Orderers {
		if err := orderer.JoinChannel(ord, n.Config.Orgs[0], n.Config.ChannelName, channelBlockPath); err != nil {
			return fmt.Errorf("failed to join orderer %s to channel: %w", ord.Name, err)
		}
		fmt.Printf("  ✓ Orderer '%s' joined channel '%s'\n", ord.Name, n.Config.ChannelName)
	}

	// Join peers to channel
	for _, p := range n.Config.Peers {
		// Pass the first orderer as well for peer to fetch blocks if needed
		var ordererEndpoint string
		if len(n.Config.Orderers) > 0 {
			ordererEndpoint = fmt.Sprintf("orderer0.%s:%d", n.Config.Orgs[0].Domain, n.Config.Orderers[0].Port)
		}
		if err := peer.JoinChannel(p, n.Config.ChannelName, channelBlockPath, n.Config.BasePath, ordererEndpoint); err != nil {
			return fmt.Errorf("failed to join peer %s to channel: %w", p.Name, err)
		}
		fmt.Printf("  ✓ Peer '%s' joined channel '%s'\n", p.Name, n.Config.ChannelName)
	}

	return nil
}

// PrintSummary prints a summary of the network configuration
func (n *Network) PrintSummary() {
	fmt.Println("\n" + repeat("=", 60))
	fmt.Println("FABRIC NETWORK CONFIGURATION SUMMARY")
	fmt.Println(repeat("=", 60))

	if n.Config.Orgs[0] != nil {
		fmt.Printf("\nRoot Organization:\n")
		fmt.Printf("  Name:   %s\n", n.Config.Orgs[0].Name)
		fmt.Printf("  MSPID:  %s\n", n.Config.Orgs[0].MSPID)
		fmt.Printf("  Domain: %s\n", n.Config.Orgs[0].Domain)
		fmt.Printf("  CA:     %s:%d\n", n.Config.Orgs[0].CA.Host, n.Config.Orgs[0].CA.Port)
	}

	fmt.Printf("\nChannel:\n")
	fmt.Printf("  Name:        %s\n", n.Config.ChannelName)
	fmt.Printf("  Orderer Type: %s\n", n.Config.Channel.OrdererType)

	if len(n.Config.Orderers) > 0 {
		fmt.Printf("\nOrderers (%d):\n", len(n.Config.Orderers))
		for _, ord := range n.Config.Orderers {
			fmt.Printf("  - %s (port: %d, admin: %d, ops: %d)\n",
				ord.Name, ord.Port, ord.AdminPort, ord.OperationsPort)
		}
	}

	if len(n.Config.Peers) > 0 {
		fmt.Printf("\nPeers (%d):\n", len(n.Config.Peers))
		for _, p := range n.Config.Peers {
			fmt.Printf("  - %s (port: %d, chaincode: %d, ops: %d)\n",
				p.Name, p.Port, p.ChaincodePort, p.OperationsPort)
		}
	}

	fmt.Println("\n" + repeat("=", 60))
}

// repeat is a helper function to repeat strings efficiently using strings.Builder
func repeat(s string, count int) string {
	if count <= 0 {
		return ""
	}
	var builder strings.Builder
	builder.Grow(len(s) * count)
	for i := 0; i < count; i++ {
		builder.WriteString(s)
	}
	return builder.String()
}
