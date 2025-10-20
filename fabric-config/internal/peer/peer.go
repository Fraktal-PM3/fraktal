package peer

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/ltu/fraktal/fabric-config/internal/config"
	"gopkg.in/yaml.v2"
)

// CoreConfig represents the core.yaml configuration for a peer
type CoreConfig struct {
	Peer      PeerSection      `yaml:"peer"`
	VM        VMSection        `yaml:"vm"`
	Chaincode ChaincodeSection `yaml:"chaincode"`
	Ledger    LedgerSection    `yaml:"ledger"`
}

// PeerSection represents peer configuration
type PeerSection struct {
	ID                     string           `yaml:"id"`
	NetworkID              string           `yaml:"networkId"`
	ListenAddress          string           `yaml:"listenAddress"`
	ChaincodeListenAddress string           `yaml:"chaincodeListenAddress"`
	ChaincodeAddress       string           `yaml:"chaincodeAddress"`
	Address                string           `yaml:"address"`
	AddressAutoDetect      bool             `yaml:"addressAutoDetect"`
	Keepalive              KeepaliveSection `yaml:"keepalive"`
	Gossip                 GossipSection    `yaml:"gossip"`
	TLS                    TLSSection       `yaml:"tls"`
	BCCSP                  BCCSPSection     `yaml:"BCCSP"`
	MSPConfigPath          string           `yaml:"mspConfigPath"`
	LocalMSPID             string           `yaml:"localMspId"`
}

// KeepaliveSection represents keepalive configuration
type KeepaliveSection struct {
	MinInterval    string                 `yaml:"minInterval"`
	Client         KeepaliveClientSection `yaml:"client"`
	DeliveryClient KeepaliveClientSection `yaml:"deliveryClient"`
}

// KeepaliveClientSection represents client keepalive settings
type KeepaliveClientSection struct {
	Interval string `yaml:"interval"`
	Timeout  string `yaml:"timeout"`
}

// GossipSection represents gossip protocol configuration
type GossipSection struct {
	Bootstrap                string `yaml:"bootstrap"`
	UseLeaderElection        bool   `yaml:"useLeaderElection"`
	OrgLeader                bool   `yaml:"orgLeader"`
	Endpoint                 string `yaml:"endpoint,omitempty"`
	ExternalEndpoint         string `yaml:"externalEndpoint,omitempty"`
	PropagateIterations      int    `yaml:"propagateIterations"`
	PropagatePeerNum         int    `yaml:"propagatePeerNum"`
	PullInterval             string `yaml:"pullInterval"`
	RequestStateInfoInterval string `yaml:"requestStateInfoInterval"`
	PublishStateInfoInterval string `yaml:"publishStateInfoInterval"`
}

// TLSSection represents TLS configuration
type TLSSection struct {
	Enabled            bool                 `yaml:"enabled"`
	ClientAuthRequired bool                 `yaml:"clientAuthRequired"`
	Cert               CertSection          `yaml:"cert"`
	Key                KeySection           `yaml:"key"`
	RootCert           RootCertSection      `yaml:"rootcert"`
	ClientRootCAs      ClientRootCAsSection `yaml:"clientRootCAs"`
}

// CertSection represents certificate configuration
type CertSection struct {
	File string `yaml:"file"`
}

// KeySection represents key configuration
type KeySection struct {
	File string `yaml:"file"`
}

// RootCertSection represents root certificate configuration
type RootCertSection struct {
	File string `yaml:"file"`
}

// ClientRootCAsSection represents client root CAs configuration
type ClientRootCAsSection struct {
	Files []string `yaml:"files"`
}

// BCCSPSection represents BCCSP (Blockchain Crypto Service Provider) configuration
type BCCSPSection struct {
	Default string        `yaml:"Default"`
	SW      SWSection     `yaml:"SW"`
	PKCS11  PKCS11Section `yaml:"PKCS11"`
}

// SWSection represents software-based cryptography configuration
type SWSection struct {
	Hash     string `yaml:"Hash"`
	Security int    `yaml:"Security"`
}

// PKCS11Section represents PKCS11 hardware security module configuration
type PKCS11Section struct {
	Library  string `yaml:"Library"`
	Label    string `yaml:"Label"`
	Pin      string `yaml:"Pin"`
	Hash     string `yaml:"Hash"`
	Security int    `yaml:"Security"`
}

// VMSection represents virtual machine configuration for chaincode
type VMSection struct {
	Endpoint string          `yaml:"endpoint"`
	Docker   DockerVMSection `yaml:"docker"`
}

// DockerVMSection represents Docker VM configuration
type DockerVMSection struct {
	TLS          DockerTLSSection `yaml:"tls"`
	AttachStdout bool             `yaml:"attachStdout"`
}

// DockerTLSSection represents Docker TLS configuration
type DockerTLSSection struct {
	Enabled bool        `yaml:"enabled"`
	CA      CertSection `yaml:"ca"`
	Cert    CertSection `yaml:"cert"`
	Key     KeySection  `yaml:"key"`
}

// ChaincodeSection represents chaincode configuration
type ChaincodeSection struct {
	Mode           string                  `yaml:"mode"`
	Keepalive      int                     `yaml:"keepalive"`
	StartupTimeout string                  `yaml:"startuptimeout"`
	ExecuteTimeout string                  `yaml:"executetimeout"`
	Logging        ChaincodeLoggingSection `yaml:"logging"`
	System         map[string]string       `yaml:"system"`
}

// ChaincodeLoggingSection represents chaincode logging configuration
type ChaincodeLoggingSection struct {
	Level  string `yaml:"level"`
	Shim   string `yaml:"shim"`
	Format string `yaml:"format"`
}

// LedgerSection represents ledger configuration
type LedgerSection struct {
	State   StateSection   `yaml:"state"`
	History HistorySection `yaml:"history"`
}

// StateSection represents state database configuration
type StateSection struct {
	StateDatabase string         `yaml:"stateDatabase"`
	CouchDBConfig CouchDBSection `yaml:"couchDBConfig"`
}

// CouchDBSection represents CouchDB configuration
type CouchDBSection struct {
	CouchDBAddress      string `yaml:"couchDBAddress"`
	Username            string `yaml:"username"`
	Password            string `yaml:"password"`
	MaxRetries          int    `yaml:"maxRetries"`
	MaxRetriesOnStartup int    `yaml:"maxRetriesOnStartup"`
	RequestTimeout      string `yaml:"requestTimeout"`
}

// HistorySection represents history database configuration
type HistorySection struct {
	EnableHistoryDatabase bool `yaml:"enableHistoryDatabase"`
}

// CreatePeer creates a new peer configuration
func CreatePeer(org *config.Organization, name string, port int, peerCount int) *config.PeerConfig {
	peer := &config.PeerConfig{
		Name:           name,
		Organization:   org.Name,
		Port:           port,
		ChaincodePort:  port + 1,
		OperationsPort: port + 1000,
		TLSEnabled:     true,
		MSPConfigPath:  filepath.Join(org.CryptoPath, "peers", name+"."+org.Domain, "msp"),
		MSPID:          org.MSPID,
	}

	// Set gossip bootstrap to first peer if this is not the first peer
	if peerCount > 0 {
		firstPeerPort := port - peerCount
		peer.GossipBootstrap = fmt.Sprintf("peer0:%d", firstPeerPort)
	}

	return peer
}

// GenerateCoreYAML generates the core.yaml configuration for a peer
func GenerateCoreYAML(peer *config.PeerConfig, org *config.Organization) (*CoreConfig, error) {
	// Use FQDN for peer hostname to match TLS certificate
	peerHost := fmt.Sprintf("%s.%s", peer.Name, org.Domain)

	core := &CoreConfig{
		Peer: PeerSection{
			ID:                     peer.Name,
			NetworkID:              "pm3",
			ListenAddress:          fmt.Sprintf("0.0.0.0:%d", peer.Port),
			ChaincodeListenAddress: fmt.Sprintf("0.0.0.0:%d", peer.ChaincodePort),
			ChaincodeAddress:       fmt.Sprintf("%s:%d", peerHost, peer.ChaincodePort),
			Address:                fmt.Sprintf("%s:%d", peerHost, peer.Port),
			AddressAutoDetect:      false,
			Keepalive: KeepaliveSection{
				MinInterval: "60s",
				Client: KeepaliveClientSection{
					Interval: "60s",
					Timeout:  "20s",
				},
				DeliveryClient: KeepaliveClientSection{
					Interval: "60s",
					Timeout:  "20s",
				},
			},
			Gossip: GossipSection{
				Bootstrap:                peer.GossipBootstrap,
				UseLeaderElection:        true,
				OrgLeader:                false,
				Endpoint:                 fmt.Sprintf("%s:%d", peerHost, peer.Port),
				ExternalEndpoint:         fmt.Sprintf("%s:%d", peerHost, peer.Port),
				PropagateIterations:      1,
				PropagatePeerNum:         3,
				PullInterval:             "4s",
				RequestStateInfoInterval: "4s",
				PublishStateInfoInterval: "4s",
			},
			TLS: TLSSection{
				Enabled:            peer.TLSEnabled,
				ClientAuthRequired: false,
				Cert: CertSection{
					File: filepath.Join(peer.MSPConfigPath, "tls", "server.crt"),
				},
				Key: KeySection{
					File: filepath.Join(peer.MSPConfigPath, "tls", "server.key"),
				},
				RootCert: RootCertSection{
					File: filepath.Join(peer.MSPConfigPath, "tls", "ca.crt"),
				},
				ClientRootCAs: ClientRootCAsSection{
					Files: []string{
						filepath.Join(peer.MSPConfigPath, "tls", "ca.crt"),
					},
				},
			},
			BCCSP: BCCSPSection{
				Default: "SW",
				SW: SWSection{
					Hash:     "SHA2",
					Security: 256,
				},
			},
			MSPConfigPath: peer.MSPConfigPath,
			LocalMSPID:    peer.MSPID,
		},
		VM: VMSection{
			Endpoint: "unix:///var/run/docker.sock",
			Docker: DockerVMSection{
				TLS: DockerTLSSection{
					Enabled: false,
				},
				AttachStdout: false,
			},
		},
		Chaincode: ChaincodeSection{
			Mode:           "net",
			Keepalive:      0,
			StartupTimeout: "300s",
			ExecuteTimeout: "30s",
			Logging: ChaincodeLoggingSection{
				Level:  "info",
				Shim:   "warning",
				Format: "%{color}%{time:2006-01-02 15:04:05.000 MST} [%{module}] %{shortfunc} -> %{level:.4s} %{id:03x}%{color:reset} %{message}",
			},
			System: map[string]string{
				"_lifecycle": "enable",
				"cscc":       "enable",
				"lscc":       "enable",
				"qscc":       "enable",
			},
		},
		Ledger: LedgerSection{
			State: StateSection{
				StateDatabase: "goleveldb",
			},
			History: HistorySection{
				EnableHistoryDatabase: true,
			},
		},
	}

	return core, nil
}

// WriteCoreYAML writes the core.yaml configuration to a file
func WriteCoreYAML(core *CoreConfig, path string) error {
	if core == nil {
		return fmt.Errorf("core config cannot be nil")
	}

	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	data, err := yaml.Marshal(core)
	if err != nil {
		return fmt.Errorf("failed to marshal core config: %w", err)
	}

	// Security: Use restrictive permissions for config files
	if err := os.WriteFile(path, data, 0640); err != nil {
		return fmt.Errorf("failed to write core config: %w", err)
	}

	return nil
}

// MSPConfig represents the config.yaml file in an MSP directory
type MSPConfig struct {
	NodeOUs NodeOUsConfig `yaml:"NodeOUs"`
}

// NodeOUsConfig represents Node OU configuration
type NodeOUsConfig struct {
	Enable              bool         `yaml:"Enable"`
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

// CreatePeerMSP creates the MSP directory structure for a peer
func CreatePeerMSP(peer *config.PeerConfig, org *config.Organization) error {
	if peer == nil {
		return fmt.Errorf("peer config cannot be nil")
	}
	if org == nil {
		return fmt.Errorf("organization cannot be nil")
	}

	peerMSPPath := peer.MSPConfigPath

	dirs := []string{
		filepath.Join(peerMSPPath, "signcerts"),
		filepath.Join(peerMSPPath, "keystore"),
		filepath.Join(peerMSPPath, "cacerts"),
		filepath.Join(peerMSPPath, "tlscacerts"),
		filepath.Join(peerMSPPath, "admincerts"),
		filepath.Join(peerMSPPath, "tls"),
	}

	for _, dir := range dirs {
		// Security: Use restrictive permissions for keystore and tls directories
		perm := os.FileMode(0755)
		baseName := filepath.Base(dir)
		if baseName == "keystore" || baseName == "tls" {
			perm = 0700
		}
		if err := os.MkdirAll(dir, perm); err != nil {
			return fmt.Errorf("failed to create peer MSP directory %s: %w", dir, err)
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

	configYAMLPath := filepath.Join(peerMSPPath, "config.yaml")
	data, err := yaml.Marshal(&mspConfig)
	if err != nil {
		return fmt.Errorf("failed to marshal MSP config: %w", err)
	}

	if err := os.WriteFile(configYAMLPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write MSP config.yaml: %w", err)
	}

	return nil
}

// JoinChannel joins a peer to a channel
func JoinChannel(peerConfig *config.PeerConfig, channelName string, blockPath string, basePath string, ordererEndpoint string) error {
	// Get absolute path for the block
	absBlockPath, err := filepath.Abs(blockPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute path for block: %w", err)
	}

	// Like fabric test-network, we run peer CLI from the host using Admin credentials
	// MSPConfigPath is: <orgCryptoPath>/peers/<peername>/msp
	// We need: <orgCryptoPath>/users/Admin@<orgdomain>/msp
	peerMSPDir := filepath.Dir(peerConfig.MSPConfigPath) // <orgCryptoPath>/peers/<peername>
	peerNodeDir := filepath.Dir(peerMSPDir)              // <orgCryptoPath>/peers
	orgCryptoPath := filepath.Dir(peerNodeDir)           // <orgCryptoPath>

	// Extract the org domain from the peer name (e.g., peer0.rootorg.pm3.org -> rootorg.pm3.org)
	peerNodeName := filepath.Base(peerMSPDir) // peer0.rootorg.pm3.org
	parts := strings.SplitN(peerNodeName, ".", 2)
	var orgDomain string
	if len(parts) > 1 {
		orgDomain = parts[1]
	} else {
		return fmt.Errorf("could not extract org domain from peer name: %s", peerNodeName)
	}

	adminMSPPath := filepath.Join(orgCryptoPath, "users", fmt.Sprintf("Admin@%s", orgDomain), "msp")

	// Get absolute path for Admin MSP
	absAdminMSPPath, err := filepath.Abs(adminMSPPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute path for admin MSP: %w", err)
	}

	// Get peer TLS CA certificate
	tlsCACert := filepath.Join(filepath.Dir(peerConfig.MSPConfigPath), "tls", "ca.crt")
	absTLSCACert, err := filepath.Abs(tlsCACert)
	if err != nil {
		return fmt.Errorf("failed to get absolute path for TLS CA cert: %w", err)
	}

	// Construct peer address (localhost from host perspective)
	peerAddress := fmt.Sprintf("localhost:%d", peerConfig.Port)

	// Get the peer's config directory path for FABRIC_CFG_PATH
	peerConfigDir := filepath.Join(basePath, "config", peerConfig.Name)
	absPeerConfigDir, err := filepath.Abs(peerConfigDir)
	if err != nil {
		return fmt.Errorf("failed to get absolute path for peer config dir: %w", err)
	}

	// Set environment variables for peer CLI (like fabric test-network)
	env := os.Environ()
	env = append(env, fmt.Sprintf("FABRIC_CFG_PATH=%s", absPeerConfigDir))
	env = append(env, "CORE_PEER_TLS_ENABLED=true")
	env = append(env, fmt.Sprintf("CORE_PEER_LOCALMSPID=%s", peerConfig.MSPID))
	env = append(env, fmt.Sprintf("CORE_PEER_TLS_ROOTCERT_FILE=%s", absTLSCACert))
	env = append(env, fmt.Sprintf("CORE_PEER_MSPCONFIGPATH=%s", absAdminMSPPath))
	env = append(env, fmt.Sprintf("CORE_PEER_ADDRESS=%s", peerAddress))

	// Run peer channel join command from host
	cmd := exec.Command("peer", "channel", "join",
		"-b", absBlockPath,
	)
	cmd.Env = env
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to join peer %s to channel: %w", peerConfig.Name, err)
	}

	return nil
} // InstallChaincode installs chaincode on a peer
func InstallChaincode(peer *config.PeerConfig, chaincodePath string, chaincodeName string) error {
	// This would use peer lifecycle chaincode install command
	fmt.Printf("Chaincode %s would be installed on peer %s from %s\n", chaincodeName, peer.Name, chaincodePath)
	return nil
}
