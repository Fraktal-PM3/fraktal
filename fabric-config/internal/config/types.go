package config

import (
	"os"
	"time"
)

// NetworkConfig represents the overall Fabric network configuration
type NetworkConfig struct {
	Orgs          []*Organization
	Channel       *ChannelConfig
	Peers         []*PeerConfig
	Orderers      []*OrdererConfig
	BasePath      string
	ChannelName   string
	FabricBinPath string
}

// Organization represents a Fabric organization
type Organization struct {
	Name       string
	MSPID      string
	Domain     string
	Type       CAType
	Path       string
	CA         *CAConfig
	Admin      *Identity
	Users      []*Identity
	Operations *OperationsConfig // For use in changing ca server operations
}

type CAType int

const (
	TLS CAType = iota
	CA
	OrdererOrg
	PeerOrg
)

// CAConfig represents Certificate Authority configuration for Hyperledger Fabric CA.
// The AdminPassword should never be hardcoded and must be provided via environment variables.
type CAConfig struct {
	Name            string                     // CA server name
	Host            string                     // CA server hostname or IP
	Port            int                        // CA server port (default: 7054)
	AdminUser       string                     // CA admin username
	AdminPassword   string                     // CA admin password (must be from environment variable)
	TLSEnabled      bool                       // Whether TLS is enabled for CA
	CSR             *CSRConfig                 // Certificate Signing Request configuration
	CLR             *CLRConfig                 // Configuration for genclr
	SigningProfiles map[string]*SigningProfile // Signing profiles for different certificate types
	Affiliations    map[string][]string        // Organization affiliations
	DBDriver        string                     // Database driver (default: sqlite3)
	DBDataSource    string                     // Database connection string
}

type OperationsConfig struct {
	ListenAddress int
}

// CSRConfig represents Certificate Signing Request configuration
type CSRConfig struct {
	CN    string
	Names []Name
	Hosts []string
	CA    *CSRCAConfig
}

// CLRConfig represents configuration for genclr request processing
type CLRConfig struct {
	Expiry string
}

// Name represents a distinguished name
type Name struct {
	C  string // Country
	ST string // State
	L  string // Locality
	O  string // Organization
	OU string // Organizational Unit
}

// CSRCAConfig represents CA-specific CSR configuration
type CSRCAConfig struct {
	Expiry     string
	PathLength int
}

// SigningProfile represents a certificate signing profile
type SigningProfile struct {
	Usage        []string
	ExpiryString string
	Expiry       time.Duration
	CAConstraint *CAConstraint
}

// CAConstraint represents CA constraints in a signing profile
type CAConstraint struct {
	IsCA           bool
	MaxPathLen     int
	MaxPathLenZero bool
}

// Identity represents a Fabric identity
type Identity struct {
	Name           string
	Type           string
	Affiliation    string
	Attributes     map[string]string
	MaxEnrollments int
}

// ChannelConfig represents a Fabric channel configuration
type ChannelConfig struct {
	Name              string
	Organizations     []*Organization
	Capabilities      *Capabilities
	Policies          *Policies
	OrdererType       string
	BatchTimeout      time.Duration
	MaxMessageCount   uint32
	AbsoluteMaxBytes  uint32
	PreferredMaxBytes uint32
}

// Capabilities represents version capabilities for channel/orderer/application
type Capabilities struct {
	Channel     []string
	Orderer     []string
	Application []string
}

// Policies represents access policies
type Policies struct {
	Readers     string
	Writers     string
	Admins      string
	Endorsement string
}

// PeerConfig represents a Fabric peer configuration.
// Peers are the nodes that execute chaincode and maintain the ledger.
type PeerConfig struct {
	Name            string // Peer name (e.g., peer0, peer1)
	Organization    string // Organization this peer belongs to
	Port            int    // Main peer port (default: 7051)
	ChaincodePort   int    // Chaincode communication port
	OperationsPort  int    // Operations and metrics port
	TLSEnabled      bool   // Whether TLS is enabled
	GossipBootstrap string // Bootstrap peer for gossip protocol
	MSPConfigPath   string // Path to MSP configuration directory
	MSPID           string // Membership Service Provider ID
}

// OrdererConfig represents a Fabric orderer configuration.
// Orderers provide the ordering service and consensus for the network.
type OrdererConfig struct {
	Name           string // Orderer name (e.g., orderer0, orderer1)
	Organization   string // Organization this orderer belongs to
	Port           int    // Main orderer port (default: 7050)
	AdminPort      int    // Admin port for channel management
	OperationsPort int    // Operations and metrics port
	TLSEnabled     bool   // Whether TLS is enabled
	OrdererType    string // Consensus type (e.g., etcdraft, solo)
	MSPConfigPath  string // Path to MSP configuration directory
	MSPID          string // Membership Service Provider ID
	GenesisBlock   string // Path to genesis block file
}

// DefaultNetworkConfig creates a default network configuration
func DefaultNetworkConfig() *NetworkConfig {
	fabricBinPath := os.Getenv("FABRIC_BIN_PATH")
	if fabricBinPath == "" {
		fabricBinPath = ""
	}

	return &NetworkConfig{
		BasePath:      "./network-config",
		ChannelName:   "pm3",
		FabricBinPath: fabricBinPath,
		Channel: &ChannelConfig{
			Name:              "pm3",
			OrdererType:       "etcdraft",
			BatchTimeout:      2 * time.Second,
			MaxMessageCount:   10,
			AbsoluteMaxBytes:  103809024, // 99 MB
			PreferredMaxBytes: 524288,    // 512 KB
			Capabilities: &Capabilities{
				Channel:     []string{"V2_0"},
				Orderer:     []string{"V2_0"},
				Application: []string{"V2_5"},
			},
			Policies: &Policies{
				Readers:     "ANY Readers",
				Writers:     "ANY Writers",
				Admins:      "MAJORITY Admins",
				Endorsement: "MAJORITY Endorsement",
			},
		},
	}
}
