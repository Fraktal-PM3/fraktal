package channel

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/ltu/fraktal/fabric-config/internal/config"
	"gopkg.in/yaml.v2"
)

// ConfigTx represents the configtx.yaml structure
type ConfigTx struct {
	Organizations []Organization      `yaml:"Organizations"`
	Capabilities  CapabilitiesSection `yaml:"Capabilities"`
	Application   *ApplicationSection `yaml:"Application"`
	Orderer       *OrdererSection     `yaml:"Orderer"`
	Channel       *ChannelSection     `yaml:"Channel"`
	Profiles      map[string]Profile  `yaml:"Profiles"`
}

// Organization represents an organization in configtx
type Organization struct {
	Name             string            `yaml:"Name"`
	ID               string            `yaml:"ID"`
	MSPDir           string            `yaml:"MSPDir"`
	Policies         map[string]Policy `yaml:"Policies"`
	AnchorPeers      []AnchorPeer      `yaml:"AnchorPeers,omitempty"`
	OrdererEndpoints []string          `yaml:"OrdererEndpoints,omitempty"`
}

// Policy represents a policy definition
type Policy struct {
	Type string `yaml:"Type"`
	Rule string `yaml:"Rule"`
}

// AnchorPeer represents an anchor peer
type AnchorPeer struct {
	Host string `yaml:"Host"`
	Port int    `yaml:"Port"`
}

// CapabilitiesSection represents capabilities for different components
type CapabilitiesSection struct {
	Channel     map[string]bool `yaml:"Channel"`
	Orderer     map[string]bool `yaml:"Orderer"`
	Application map[string]bool `yaml:"Application"`
}

// ApplicationSection represents application defaults
type ApplicationSection struct {
	Organizations []*Organization   `yaml:"Organizations,omitempty"`
	Policies      map[string]Policy `yaml:"Policies"`
	Capabilities  map[string]bool   `yaml:"Capabilities"`
}

// OrdererSection represents orderer defaults
type OrdererSection struct {
	OrdererType   string            `yaml:"OrdererType"`
	Addresses     []string          `yaml:"Addresses"`
	BatchTimeout  string            `yaml:"BatchTimeout"`
	BatchSize     BatchSize         `yaml:"BatchSize"`
	Organizations []*Organization   `yaml:"Organizations,omitempty"`
	Policies      map[string]Policy `yaml:"Policies"`
	Capabilities  map[string]bool   `yaml:"Capabilities"`
	EtcdRaft      *EtcdRaft         `yaml:"EtcdRaft,omitempty"`
}

// BatchSize represents orderer batch size configuration
type BatchSize struct {
	MaxMessageCount   uint32 `yaml:"MaxMessageCount"`
	AbsoluteMaxBytes  uint32 `yaml:"AbsoluteMaxBytes"`
	PreferredMaxBytes uint32 `yaml:"PreferredMaxBytes"`
}

// EtcdRaft represents etcd raft configuration
type EtcdRaft struct {
	Consenters []Consenter `yaml:"Consenters"`
}

// Consenter represents a raft consenter
type Consenter struct {
	Host          string `yaml:"Host"`
	Port          int    `yaml:"Port"`
	ClientTLSCert string `yaml:"ClientTLSCert"`
	ServerTLSCert string `yaml:"ServerTLSCert"`
}

// ChannelSection represents channel defaults
type ChannelSection struct {
	Policies     map[string]Policy `yaml:"Policies"`
	Capabilities map[string]bool   `yaml:"Capabilities"`
}

// Profile represents a configuration profile
type Profile struct {
	Consortium   string              `yaml:"Consortium,omitempty"`
	Application  *ApplicationSection `yaml:"Application,omitempty"`
	Orderer      *OrdererSection     `yaml:"Orderer,omitempty"`
	Policies     map[string]Policy   `yaml:"Policies,omitempty"`
	Capabilities map[string]bool     `yaml:"Capabilities,omitempty"`
}

// GenerateConfigTx generates a configtx.yaml for the PM3 channel
func GenerateConfigTx(netConfig *config.NetworkConfig) (*ConfigTx, error) {
	org := netConfig.RootOrg

	// Build orderer endpoints from configured orderers
	ordererEndpoints := []string{}
	for _, orderer := range netConfig.Orderers {
		endpoint := fmt.Sprintf("%s.%s:%d", orderer.Name, org.Domain, orderer.Port)
		ordererEndpoints = append(ordererEndpoints, endpoint)
	}

	// Make paths relative to configtx.yaml location (which is in config/)
	// org.CryptoPath is absolute (e.g., /path/to/network-config/organizations/rootorg)
	// We need ../organizations/rootorg relative to config/
	relOrgPath := filepath.Join("..", "organizations", "rootorg")

	configTx := &ConfigTx{
		Organizations: []Organization{
			{
				Name:             org.Name,
				ID:               org.MSPID,
				MSPDir:           filepath.Join(relOrgPath, "msp"),
				OrdererEndpoints: ordererEndpoints, // Add orderer endpoints for channel participation
				Policies: map[string]Policy{
					"Readers": {
						Type: "Signature",
						Rule: fmt.Sprintf("OR('%s.member')", org.MSPID),
					},
					"Writers": {
						Type: "Signature",
						Rule: fmt.Sprintf("OR('%s.member')", org.MSPID),
					},
					"Admins": {
						Type: "Signature",
						Rule: fmt.Sprintf("OR('%s.admin')", org.MSPID),
					},
					"Endorsement": {
						Type: "Signature",
						Rule: fmt.Sprintf("OR('%s.peer')", org.MSPID),
					},
				},
			},
		},
		Capabilities: CapabilitiesSection{
			Channel: map[string]bool{
				"V2_0": true,
			},
			Orderer: map[string]bool{
				"V2_0": true,
			},
			Application: map[string]bool{
				"V2_5": true,
			},
		},
		Application: &ApplicationSection{
			Policies: map[string]Policy{
				"Readers": {
					Type: "ImplicitMeta",
					Rule: "ANY Readers",
				},
				"Writers": {
					Type: "ImplicitMeta",
					Rule: "ANY Writers",
				},
				"Admins": {
					Type: "ImplicitMeta",
					Rule: "MAJORITY Admins",
				},
				"LifecycleEndorsement": {
					Type: "ImplicitMeta",
					Rule: "MAJORITY Endorsement",
				},
				"Endorsement": {
					Type: "ImplicitMeta",
					Rule: "MAJORITY Endorsement",
				},
			},
			Capabilities: map[string]bool{
				"V2_5": true,
			},
		},
		Orderer: &OrdererSection{
			OrdererType:  "etcdraft",
			Addresses:    []string{}, // Will be populated with orderer addresses
			BatchTimeout: "2s",
			BatchSize: BatchSize{
				MaxMessageCount:   netConfig.Channel.MaxMessageCount,
				AbsoluteMaxBytes:  netConfig.Channel.AbsoluteMaxBytes,
				PreferredMaxBytes: netConfig.Channel.PreferredMaxBytes,
			},
			Policies: map[string]Policy{
				"Readers": {
					Type: "ImplicitMeta",
					Rule: "ANY Readers",
				},
				"Writers": {
					Type: "ImplicitMeta",
					Rule: "ANY Writers",
				},
				"Admins": {
					Type: "ImplicitMeta",
					Rule: "MAJORITY Admins",
				},
				"BlockValidation": {
					Type: "ImplicitMeta",
					Rule: "ANY Writers",
				},
			},
			Capabilities: map[string]bool{
				"V2_0": true,
			},
		},
		Channel: &ChannelSection{
			Policies: map[string]Policy{
				"Readers": {
					Type: "ImplicitMeta",
					Rule: "ANY Readers",
				},
				"Writers": {
					Type: "ImplicitMeta",
					Rule: "ANY Writers",
				},
				"Admins": {
					Type: "ImplicitMeta",
					Rule: "MAJORITY Admins",
				},
			},
			Capabilities: map[string]bool{
				"V2_0": true,
			},
		},
		Profiles: map[string]Profile{
			// Main channel profile using Raft consensus (matches test-network pattern)
			"ChannelUsingRaft": {
				Policies: map[string]Policy{
					"Readers": {
						Type: "ImplicitMeta",
						Rule: "ANY Readers",
					},
					"Writers": {
						Type: "ImplicitMeta",
						Rule: "ANY Writers",
					},
					"Admins": {
						Type: "ImplicitMeta",
						Rule: "MAJORITY Admins",
					},
				},
				Capabilities: map[string]bool{
					"V2_0": true,
				},
				Orderer:     nil, // Will be populated with orderer configuration below
				Application: nil, // Will be populated with application configuration below
			},
		},
	}

	// Add orderer addresses and consenters
	if len(netConfig.Orderers) > 0 {
		consenters := []Consenter{}
		addresses := []string{}

		for _, orderer := range netConfig.Orderers {
			// Use FQDN for addresses
			address := fmt.Sprintf("%s.%s:%d", orderer.Name, org.Domain, orderer.Port)
			addresses = append(addresses, address)

			consenter := Consenter{
				Host:          fmt.Sprintf("%s.%s", orderer.Name, org.Domain),
				Port:          orderer.Port,
				ClientTLSCert: filepath.Join(relOrgPath, "orderers", fmt.Sprintf("%s.%s", orderer.Name, org.Domain), "tls", "server.crt"),
				ServerTLSCert: filepath.Join(relOrgPath, "orderers", fmt.Sprintf("%s.%s", orderer.Name, org.Domain), "tls", "server.crt"),
			}
			consenters = append(consenters, consenter)
		}

		configTx.Orderer.Addresses = addresses
		configTx.Orderer.EtcdRaft = &EtcdRaft{
			Consenters: consenters,
		}

		// Update ChannelUsingRaft profile with orderer configuration
		channelProfile := configTx.Profiles["ChannelUsingRaft"]
		channelProfile.Orderer = &OrdererSection{
			OrdererType:  "etcdraft",
			Addresses:    addresses,
			BatchTimeout: "2s",
			BatchSize: BatchSize{
				MaxMessageCount:   netConfig.Channel.MaxMessageCount,
				AbsoluteMaxBytes:  netConfig.Channel.AbsoluteMaxBytes,
				PreferredMaxBytes: netConfig.Channel.PreferredMaxBytes,
			},
			Organizations: []*Organization{&configTx.Organizations[0]}, // Include the orderer organization
			Policies: map[string]Policy{
				"Readers": {
					Type: "ImplicitMeta",
					Rule: "ANY Readers",
				},
				"Writers": {
					Type: "ImplicitMeta",
					Rule: "ANY Writers",
				},
				"Admins": {
					Type: "ImplicitMeta",
					Rule: "MAJORITY Admins",
				},
				"BlockValidation": {
					Type: "ImplicitMeta",
					Rule: "ANY Writers",
				},
			},
			Capabilities: map[string]bool{
				"V2_0": true,
			},
			EtcdRaft: &EtcdRaft{
				Consenters: consenters,
			},
		}

		// Add application section with peer organization
		channelProfile.Application = &ApplicationSection{
			Organizations: []*Organization{&configTx.Organizations[0]}, // Include the peer organization
			Policies: map[string]Policy{
				"Readers": {
					Type: "ImplicitMeta",
					Rule: "ANY Readers",
				},
				"Writers": {
					Type: "ImplicitMeta",
					Rule: "ANY Writers",
				},
				"Admins": {
					Type: "ImplicitMeta",
					Rule: "MAJORITY Admins",
				},
				"LifecycleEndorsement": {
					Type: "ImplicitMeta",
					Rule: "MAJORITY Endorsement",
				},
				"Endorsement": {
					Type: "ImplicitMeta",
					Rule: "MAJORITY Endorsement",
				},
			},
			Capabilities: map[string]bool{
				"V2_5": true,
			},
		}

		configTx.Profiles["ChannelUsingRaft"] = channelProfile
	}

	// Add anchor peers if available
	if len(netConfig.Peers) > 0 {
		// Use first peer as anchor peer with FQDN
		anchorPeer := AnchorPeer{
			Host: fmt.Sprintf("%s.%s", netConfig.Peers[0].Name, org.Domain),
			Port: netConfig.Peers[0].Port,
		}
		configTx.Organizations[0].AnchorPeers = []AnchorPeer{anchorPeer}
	}

	return configTx, nil
}

// WriteConfigTx writes the configtx.yaml to a file
func WriteConfigTx(configTx *ConfigTx, path string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	data, err := yaml.Marshal(configTx)
	if err != nil {
		return fmt.Errorf("failed to marshal configtx: %w", err)
	}

	if err := os.WriteFile(path, data, 0644); err != nil {
		return fmt.Errorf("failed to write configtx: %w", err)
	}

	return nil
}

// CreateChannelGenesisBlock creates the channel genesis block using configtxgen
// This uses the channel participation approach (Fabric 2.3+)
func CreateChannelGenesisBlock(configTxPath, outputPath, channelName string) error {
	// Ensure channel-artifacts directory exists
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return fmt.Errorf("failed to create channel artifacts directory: %w", err)
	}

	// Set FABRIC_CFG_PATH to the directory containing configtx.yaml
	configDir := filepath.Dir(configTxPath)
	absConfigDir, err := filepath.Abs(configDir)
	if err != nil {
		return fmt.Errorf("failed to get absolute path for config directory: %w", err)
	}

	// Run configtxgen to create channel genesis block
	// configtxgen -profile ChannelUsingRaft -outputBlock ./channel-artifacts/${CHANNEL_NAME}.block -channelID $CHANNEL_NAME
	cmd := exec.Command("configtxgen",
		"-profile", "ChannelUsingRaft",
		"-outputBlock", outputPath,
		"-channelID", channelName,
	)
	cmd.Env = append(os.Environ(), fmt.Sprintf("FABRIC_CFG_PATH=%s", absConfigDir))
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to run configtxgen: %w", err)
	}

	return nil
}
