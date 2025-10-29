package orderer

import (
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/ltu/fraktal/fabric-config/internal/config"
	"gopkg.in/yaml.v2"
)

// OrdererConfig represents the orderer.yaml configuration
type OrdererConfig struct {
	General              GeneralSection              `yaml:"General"`
	FileLedger           FileLedgerSection           `yaml:"FileLedger"`
	Consensus            ConsensusSection            `yaml:"Consensus"`
	Operations           OperationsSection           `yaml:"Operations"`
	Admin                AdminSection                `yaml:"Admin"`
	ChannelParticipation ChannelParticipationSection `yaml:"ChannelParticipation"`
}

// GeneralSection represents general orderer configuration
type GeneralSection struct {
	ListenAddress   string         `yaml:"ListenAddress"`
	ListenPort      int            `yaml:"ListenPort"`
	TLS             TLSSection     `yaml:"TLS"`
	Cluster         ClusterSection `yaml:"Cluster"`
	BootstrapMethod string         `yaml:"BootstrapMethod"`
	BootstrapFile   string         `yaml:"BootstrapFile,omitempty"`
	LocalMSPDir     string         `yaml:"LocalMSPDir"`
	LocalMSPID      string         `yaml:"LocalMSPID"`
	BCCSP           BCCSPSection   `yaml:"BCCSP"`
}

// TLSSection represents TLS configuration
type TLSSection struct {
	Enabled            bool     `yaml:"Enabled"`
	PrivateKey         string   `yaml:"PrivateKey"`
	Certificate        string   `yaml:"Certificate"`
	RootCAs            []string `yaml:"RootCAs"`
	ClientAuthRequired bool     `yaml:"ClientAuthRequired"`
	ClientRootCAs      []string `yaml:"ClientRootCAs"`
}

// ClusterSection represents cluster configuration for Raft
type ClusterSection struct {
	ClientCertificate       string   `yaml:"ClientCertificate"`
	ClientPrivateKey        string   `yaml:"ClientPrivateKey"`
	ListenPort              int      `yaml:"ListenPort,omitempty"`
	ListenAddress           string   `yaml:"ListenAddress,omitempty"`
	ServerCertificate       string   `yaml:"ServerCertificate,omitempty"`
	ServerPrivateKey        string   `yaml:"ServerPrivateKey,omitempty"`
	RootCAs                 []string `yaml:"RootCAs,omitempty"`
	SendBufferSize          int      `yaml:"SendBufferSize"`
	DialTimeout             string   `yaml:"DialTimeout"`
	RPCTimeout              string   `yaml:"RPCTimeout"`
	ReplicationBufferSize   int      `yaml:"ReplicationBufferSize"`
	ReplicationPullTimeout  string   `yaml:"ReplicationPullTimeout"`
	ReplicationRetryTimeout string   `yaml:"ReplicationRetryTimeout"`
}

// BCCSPSection represents BCCSP configuration
type BCCSPSection struct {
	Default string    `yaml:"Default"`
	SW      SWSection `yaml:"SW"`
}

// SWSection represents software-based cryptography configuration
type SWSection struct {
	Hash     string `yaml:"Hash"`
	Security int    `yaml:"Security"`
}

// FileLedgerSection represents file ledger configuration
type FileLedgerSection struct {
	Location string `yaml:"Location"`
}

// ConsensusSection represents consensus configuration
type ConsensusSection struct {
	WALDir  string `yaml:"WALDir"`
	SnapDir string `yaml:"SnapDir"`
}

// OperationsSection represents operations endpoint configuration
type OperationsSection struct {
	ListenAddress string        `yaml:"ListenAddress"`
	TLS           TLSSubSection `yaml:"TLS"`
}

// TLSSubSection represents TLS subsection for operations
type TLSSubSection struct {
	Enabled            bool     `yaml:"Enabled"`
	Certificate        string   `yaml:"Certificate,omitempty"`
	PrivateKey         string   `yaml:"PrivateKey,omitempty"`
	ClientAuthRequired bool     `yaml:"ClientAuthRequired"`
	ClientRootCAs      []string `yaml:"ClientRootCAs,omitempty"`
}

// AdminSection represents admin endpoint configuration
type AdminSection struct {
	ListenAddress string        `yaml:"ListenAddress"`
	TLS           TLSSubSection `yaml:"TLS"`
}

// ChannelParticipationSection represents channel participation configuration
type ChannelParticipationSection struct {
	Enabled bool `yaml:"Enabled"`
}

// CreateOrderer creates a new orderer configuration
func CreateOrderer(org *config.Organization, name string, port int, ordererCount int) *config.OrdererConfig {
	orderer := &config.OrdererConfig{
		Name:           name,
		Organization:   org.Name,
		Port:           port,
		AdminPort:      port + 1,
		OperationsPort: port + 1000,
		TLSEnabled:     true,
		OrdererType:    "etcdraft",
		MSPConfigPath:  filepath.Join(org.Path, "orderers", name+"."+org.Domain, "msp"),
		MSPID:          org.MSPID,
		GenesisBlock:   filepath.Join(org.Path, "system-genesis-block", "genesis.block"),
	}

	return orderer
}

// LoadBaseOrdererConfig loads the orderer.yaml configuration
func LoadBaseOrdererConfig(configPath string) (*OrdererConfig, error) {
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read base orderer config: %w", err)
	}

	var ordererConfig OrdererConfig
	if err := yaml.Unmarshal(data, &ordererConfig); err != nil {
		return nil, fmt.Errorf("failed to unmarshal orderer config: %w", err)
	}

	return &ordererConfig, nil
}

func InitializeOrdererConfig(baseConfigPath string, ord *config.OrdererConfig, org *config.Organization) (*OrdererConfig, error) {
	ordererConfig, err := LoadBaseOrdererConfig(baseConfigPath)
	if err != nil {
		return nil, err
	}

	// containerMSPPath := "/var/hyperledger/orderer/msp"
	// containerTLSPath := "/var/hyperledger/orderer/tls"

	ordererConfig.General.ListenPort = ord.Port

	// NOTE: Might not be necessary
	// ordererConfig.General.TLS.PrivateKey = filepath.Join(containerTLSPath, "server.key")
	// ordererConfig.General.TLS.Certificate = filepath.Join(containerTLSPath, "server.crt")
	// ordererConfig.General.TLS.RootCAs = []string{filepath.Join(containerTLSPath, "ca.crt")}
	// ordererConfig.General.TLS.ClientRootCAs = []string{filepath.Join(containerTLSPath, "ca.crt")}
	//
	// ordererConfig.General.Cluster.ClientCertificate = filepath.Join(containerTLSPath, "server.crt")
	// ordererConfig.General.Cluster.ClientPrivateKey = filepath.Join(containerTLSPath, "server.key")
	// ordererConfig.General.Cluster.RootCAs = []string{filepath.Join(containerTLSPath, "ca.crt")}
	// ordererConfig.General.LocalMSPDir = containerMSPPath

	ordererConfig.General.LocalMSPID = ord.MSPID

	ordererConfig.Operations.ListenAddress = fmt.Sprintf("0.0.0.0:%d", ord.OperationsPort)

	ordererConfig.Admin.ListenAddress = fmt.Sprintf("0.0.0.0:%d", ord.AdminPort)
	// NOTE: Needs to be set if amdin tls is specified
	// ordererConfig.Admin.TLS.Certificate = filepath.Join(containerTLSPath, "server.crt")
	// ordererConfig.Admin.TLS.PrivateKey = filepath.Join(containerTLSPath, "server.key")
	// ordererConfig.Admin.TLS.ClientRootCAs = []string{filepath.Join(containerTLSPath, "ca.crt")}

	return ordererConfig, nil
}

func GenerateOrdererYAML(ord *config.OrdererConfig, org *config.Organization) (*OrdererConfig, error) {
	return InitializeOrdererConfig("config/orderer.yaml", ord, org)
}

// WriteOrdererYAML writes the orderer.yaml configuration to a file
func WriteOrdererYAML(ordererConfig *OrdererConfig, path string) error {
	if ordererConfig == nil {
		return fmt.Errorf("orderer config cannot be nil")
	}

	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	data, err := yaml.Marshal(ordererConfig)
	if err != nil {
		return fmt.Errorf("failed to marshal orderer config: %w", err)
	}

	// Security: Use restrictive permissions for config files
	if err := os.WriteFile(path, data, 0o640); err != nil {
		return fmt.Errorf("failed to write orderer config: %w", err)
	}

	return nil
}

// MSPConfig represents the config.yaml file in an MSP directory
type MSPConfig struct {
	NodeOUs NodeOUsConfig `yaml:"NodeOUs"`
}

// NodeOUsConfig represents Node OU configuration
type NodeOUsConfig struct {
	Enable              bool         `yaml:"NodeOUs"`
	ClientOUIdentifier  OUIdentifier `yaml:"ClientOUIdentifier"`
	PeerOUIdentifier    OUIdentifier `yaml:"PeerOUIdentifier"`
	AdminOUIdentifier   OUIdentifier `yaml:"AdminOUIdentifier"`
	OrdererOUIdentifier OUIdentifier `yaml:"OrdererOUIdentifier"`
}

// OUIdentifier represents an Organizational Unit identifier
type OUIdentifier struct {
	Certificate                  string `yaml:"Certificate"`
	OrganizationalUnitIdentifier string `yaml:"OrganizationalUnitIdentifier"`
}

// CreateOrdererMSP creates the MSP directory structure for an orderer
func CreateOrdererMSP(ord *config.OrdererConfig, org *config.Organization) error {
	if ord == nil {
		return fmt.Errorf("orderer config cannot be nil")
	}
	if org == nil {
		return fmt.Errorf("organization cannot be nil")
	}

	ordererMSPPath := ord.MSPConfigPath

	dirs := []string{
		filepath.Join(ordererMSPPath, "signcerts"),
		filepath.Join(ordererMSPPath, "keystore"),
		filepath.Join(ordererMSPPath, "cacerts"),
		filepath.Join(ordererMSPPath, "tlscacerts"),
		filepath.Join(ordererMSPPath, "admincerts"),
		filepath.Join(ordererMSPPath, "tls"),
	}

	for _, dir := range dirs {
		// Security: Use restrictive permissions for keystore and tls directories
		perm := os.FileMode(0o755)
		baseName := filepath.Base(dir)
		if baseName == "keystore" || baseName == "tls" {
			perm = 0o700
		}
		if err := os.MkdirAll(dir, perm); err != nil {
			return fmt.Errorf("failed to create orderer MSP directory %s: %w", dir, err)
		}
	}

	// Create MSP config.yaml with NodeOUs configuration
	certFileName := "ca-cert.pem"
	mspConfig := MSPConfig{
		NodeOUs: NodeOUsConfig{
			Enable: true,
			ClientOUIdentifier: OUIdentifier{
				Certificate:                  fmt.Sprintf("cacerts/%s", certFileName),
				OrganizationalUnitIdentifier: "client",
			},
			PeerOUIdentifier: OUIdentifier{
				Certificate:                  fmt.Sprintf("cacerts/%s", certFileName),
				OrganizationalUnitIdentifier: "peer",
			},
			AdminOUIdentifier: OUIdentifier{
				Certificate:                  fmt.Sprintf("cacerts/%s", certFileName),
				OrganizationalUnitIdentifier: "admin",
			},
			OrdererOUIdentifier: OUIdentifier{
				Certificate:                  fmt.Sprintf("cacerts/%s", certFileName),
				OrganizationalUnitIdentifier: "orderer",
			},
		},
	}

	configYAMLPath := filepath.Join(ordererMSPPath, "config.yaml")
	data, err := yaml.Marshal(&mspConfig)
	if err != nil {
		return fmt.Errorf("failed to marshal MSP config: %w", err)
	}

	if err := os.WriteFile(configYAMLPath, data, 0o644); err != nil {
		return fmt.Errorf("failed to write MSP config.yaml: %w", err)
	}

	return nil
}

// JoinChannel joins an orderer to a channel using osnadmin channel participation
func JoinChannel(ord *config.OrdererConfig, org *config.Organization, channelName string, blockPath string) error {
	// Get TLS certificate paths
	ordererMSPPath := ord.MSPConfigPath
	tlsDir := filepath.Join(filepath.Dir(ordererMSPPath), "tls")

	tlsCACert := filepath.Join(tlsDir, "ca.crt")
	tlsClientCert := filepath.Join(tlsDir, "server.crt")
	tlsClientKey := filepath.Join(tlsDir, "server.key")

	// Get absolute paths
	absBlockPath, err := filepath.Abs(blockPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute path for block: %w", err)
	}

	absTLSCACert, err := filepath.Abs(tlsCACert)
	if err != nil {
		return fmt.Errorf("failed to get absolute path for TLS CA cert: %w", err)
	}

	absTLSClientCert, err := filepath.Abs(tlsClientCert)
	if err != nil {
		return fmt.Errorf("failed to get absolute path for TLS client cert: %w", err)
	}

	absTLSClientKey, err := filepath.Abs(tlsClientKey)
	if err != nil {
		return fmt.Errorf("failed to get absolute path for TLS client key: %w", err)
	}

	// Run osnadmin channel join command
	cmd := exec.Command("osnadmin", "channel", "join",
		"--channelID", channelName,
		"--config-block", absBlockPath,
		"-o", fmt.Sprintf("localhost:%d", ord.AdminPort),
		"--ca-file", absTLSCACert,
		"--client-cert", absTLSClientCert,
		"--client-key", absTLSClientKey,
	)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to join orderer %s to channel %s: %w", ord.Name, channelName, err)
	}

	return nil
}

// WaitForAdminEndpoint polls the admin listener until it accepts connections.
func WaitForAdminEndpoint(ord *config.OrdererConfig, timeout time.Duration) error {
	if ord == nil {
		return fmt.Errorf("orderer config cannot be nil")
	}
	if timeout <= 0 {
		timeout = 10 * time.Second
	}

	address := fmt.Sprintf("localhost:%d", ord.AdminPort)
	deadline := time.Now().Add(timeout)
	var lastErr error

	for time.Now().Before(deadline) {
		conn, err := net.DialTimeout("tcp", address, 2*time.Second)
		if err == nil {
			conn.Close()
			// Give the orderer a moment to fully initialize the admin service
			time.Sleep(2 * time.Second)
			return nil
		}
		lastErr = err
		time.Sleep(500 * time.Millisecond)
	}

	if lastErr == nil {
		lastErr = fmt.Errorf("admin endpoint did not open before timeout")
	}

	return fmt.Errorf("timeout waiting for admin endpoint %s: %w", address, lastErr)
}

// ListChannels lists all channels the orderer has joined
func ListChannels(ord *config.OrdererConfig) error {
	// This would use osnadmin channel list command
	fmt.Printf("osnadmin channel list -o localhost:%d\n", ord.AdminPort)
	return nil
}
