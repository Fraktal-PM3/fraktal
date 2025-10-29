package channel

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/ltu/fraktal/fabric-config/internal/config"
	"gopkg.in/yaml.v2"
)

type ConfigTx struct {
	Organizations []Organization      `yaml:"Organizations"`
	Capabilities  CapabilitiesSection `yaml:"Capabilities"`
	Application   *ApplicationSection `yaml:"Application"`
	Orderer       *OrdererSection     `yaml:"Orderer"`
	Channel       *ChannelSection     `yaml:"Channel"`
	Profiles      map[string]Profile  `yaml:"Profiles"`
}

type Organization struct {
	Name             string            `yaml:"Name"`
	ID               string            `yaml:"ID"`
	MSPDir           string            `yaml:"MSPDir"`
	Policies         map[string]Policy `yaml:"Policies"`
	AnchorPeers      []AnchorPeer      `yaml:"AnchorPeers,omitempty"`
	OrdererEndpoints []string          `yaml:"OrdererEndpoints,omitempty"`
}

type Policy struct {
	Type string `yaml:"Type"`
	Rule string `yaml:"Rule"`
}

type AnchorPeer struct {
	Host string `yaml:"Host"`
	Port int    `yaml:"Port"`
}

type CapabilitiesSection struct {
	Channel     map[string]bool `yaml:"Channel"`
	Orderer     map[string]bool `yaml:"Orderer"`
	Application map[string]bool `yaml:"Application"`
}

type ApplicationSection struct {
	ACLs          map[string]string `yaml:"ACLs,omitempty"`
	Organizations []*Organization   `yaml:"Organizations,omitempty"`
	Policies      map[string]Policy `yaml:"Policies"`
	Capabilities  map[string]bool   `yaml:"Capabilities"`
}

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

type BatchSize struct {
	MaxMessageCount   uint32 `yaml:"MaxMessageCount"`
	AbsoluteMaxBytes  string `yaml:"AbsoluteMaxBytes"`
	PreferredMaxBytes string `yaml:"PreferredMaxBytes"`
}

type EtcdRaft struct {
	Consenters []Consenter      `yaml:"Consenters"`
	Options    *EtcdRaftOptions `yaml:"Options,omitempty"`
}

type EtcdRaftOptions struct {
	TickInterval         string `yaml:"TickInterval,omitempty"`
	ElectionTick         int    `yaml:"ElectionTick,omitempty"`
	HeartbeatTick        int    `yaml:"HeartbeatTick,omitempty"`
	MaxInflightBlocks    int    `yaml:"MaxInflightBlocks,omitempty"`
	SnapshotIntervalSize string `yaml:"SnapshotIntervalSize,omitempty"`
}

type Consenter struct {
	Host          string `yaml:"Host"`
	Port          int    `yaml:"Port"`
	ClientTLSCert string `yaml:"ClientTLSCert"`
	ServerTLSCert string `yaml:"ServerTLSCert"`
}

type ChannelSection struct {
	Policies     map[string]Policy `yaml:"Policies"`
	Capabilities map[string]bool   `yaml:"Capabilities"`
}

type Profile struct {
	Consortium   string              `yaml:"Consortium,omitempty"`
	Application  *ApplicationSection `yaml:"Application,omitempty"`
	Orderer      *OrdererSection     `yaml:"Orderer,omitempty"`
	Policies     map[string]Policy   `yaml:"Policies,omitempty"`
	Capabilities map[string]bool     `yaml:"Capabilities,omitempty"`
}

func LoadBaseConfigTx(configPath string) (*ConfigTx, error) {
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read base configtx: %w", err)
	}

	var configTx ConfigTx
	if err := yaml.Unmarshal(data, &configTx); err != nil {
		return nil, fmt.Errorf("failed to unmarshal configtx: %w", err)
	}

	return &configTx, nil
}

func InitializeConfigTx(baseConfigPath string, netConfig *config.NetworkConfig) (*ConfigTx, error) {
	configTx, err := LoadBaseConfigTx(baseConfigPath)
	if err != nil {
		return nil, err
	}

	if len(netConfig.Orgs) == 0 {
		return nil, fmt.Errorf("no organizations configured")
	}

	org := netConfig.Orgs[0]
	relOrgPath := filepath.Join("..", "organizations", "rootorg")

	ordererEndpoints := []string{}
	for _, orderer := range netConfig.Orderers {
		endpoint := fmt.Sprintf("%s.%s:%d", orderer.Name, org.Domain, orderer.Port)
		ordererEndpoints = append(ordererEndpoints, endpoint)
	}

	orgConfig := Organization{
		Name:             org.Name,
		ID:               org.MSPID,
		MSPDir:           filepath.Join(relOrgPath, "msp"),
		OrdererEndpoints: ordererEndpoints,
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
	}

	if len(netConfig.Peers) > 0 {
		anchorPeer := AnchorPeer{
			Host: fmt.Sprintf("%s.%s", netConfig.Peers[0].Name, org.Domain),
			Port: netConfig.Peers[0].Port,
		}
		orgConfig.AnchorPeers = []AnchorPeer{anchorPeer}
	}

	configTx.Organizations = []Organization{orgConfig}

	if len(netConfig.Orderers) > 0 {
		consenters := []Consenter{}
		addresses := []string{}

		for _, orderer := range netConfig.Orderers {
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

		if configTx.Orderer != nil {
			configTx.Orderer.Addresses = addresses
			if configTx.Orderer.EtcdRaft == nil {
				configTx.Orderer.EtcdRaft = &EtcdRaft{}
			}
			configTx.Orderer.EtcdRaft.Consenters = consenters
		}

		if profile, exists := configTx.Profiles["ChannelUsingRaft"]; exists {
			if profile.Orderer != nil {
				profile.Orderer.Addresses = addresses
				profile.Orderer.Organizations = []*Organization{&configTx.Organizations[0]}
				if profile.Orderer.EtcdRaft == nil {
					profile.Orderer.EtcdRaft = &EtcdRaft{}
				}
				profile.Orderer.EtcdRaft.Consenters = consenters
			}

			if profile.Application != nil {
				profile.Application.Organizations = []*Organization{&configTx.Organizations[0]}
			}

			configTx.Profiles["ChannelUsingRaft"] = profile
		}
	}

	return configTx, nil
}

func WriteConfigTx(configTx *ConfigTx, path string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	data, err := yaml.Marshal(configTx)
	if err != nil {
		return fmt.Errorf("failed to marshal configtx: %w", err)
	}

	if err := os.WriteFile(path, data, 0o644); err != nil {
		return fmt.Errorf("failed to write configtx: %w", err)
	}

	return nil
}

func CreateChannelGenesisBlock(configTxPath, outputPath, channelName string) error {
	if err := os.MkdirAll(filepath.Dir(outputPath), 0o755); err != nil {
		return fmt.Errorf("failed to create channel artifacts directory: %w", err)
	}

	configDir := filepath.Dir(configTxPath)
	absConfigDir, err := filepath.Abs(configDir)
	if err != nil {
		return fmt.Errorf("failed to get absolute path for config directory: %w", err)
	}

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
