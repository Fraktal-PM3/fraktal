package peer

import (
	"fmt"
	"path/filepath"

	"github.com/ltu/fraktal/fabric-config/internal/config"
	"github.com/ltu/fraktal/fabric-config/internal/docker"
)

const (
	// FabricPeerImage is the Docker image for Fabric Peer
	FabricPeerImage = "hyperledger/fabric-peer:2.5"

	// FabricCCEnvImage is the Docker image for chaincode environment
	FabricCCEnvImage = "hyperledger/fabric-ccenv:2.5"
)

// GetPeerServiceDefinition returns Docker service definition for a peer
func GetPeerServiceDefinition(peerConfig *config.PeerConfig, org *config.Organization, networkName string) *docker.ServiceDefinition {
	serviceName := fmt.Sprintf("%s_%s", networkName, peerConfig.Name)
	containerName := fmt.Sprintf("%s_%s", networkName, peerConfig.Name)
	volumeName := fmt.Sprintf("%s_%s", networkName, peerConfig.Name)

	// Paths
	mspPath := peerConfig.MSPConfigPath
	// Get the peer's directory (which contains both msp and tls subdirectories)
	peerDir := filepath.Dir(mspPath) // This gets the peer0.example.com directory
	peerDataPath := filepath.Join(org.CryptoPath, "peers", peerConfig.Name+"."+org.Domain, "data")

	// Extract base path from CryptoPath (remove "/organizations/rootorg" suffix)
	basePath := filepath.Dir(filepath.Dir(org.CryptoPath))

	// Peer config directory path
	peerConfigPath := filepath.Join(basePath, "config", peerConfig.Name)

	// Environment variables
	env := map[string]string{
		// Config path
		"FABRIC_CFG_PATH": "/etc/hyperledger/peercfg",

		// Core peer settings
		"CORE_PEER_ID":                      peerConfig.Name,
		"CORE_PEER_ADDRESS":                 fmt.Sprintf("%s:%d", peerConfig.Name, peerConfig.Port),
		"CORE_PEER_LISTENADDRESS":           fmt.Sprintf("0.0.0.0:%d", peerConfig.Port),
		"CORE_PEER_CHAINCODEADDRESS":        fmt.Sprintf("%s:%d", peerConfig.Name, peerConfig.ChaincodePort),
		"CORE_PEER_CHAINCODELISTENADDRESS":  fmt.Sprintf("0.0.0.0:%d", peerConfig.ChaincodePort),
		"CORE_PEER_GOSSIP_BOOTSTRAP":        peerConfig.GossipBootstrap,
		"CORE_PEER_GOSSIP_ENDPOINT":         fmt.Sprintf("%s:%d", peerConfig.Name, peerConfig.Port),
		"CORE_PEER_GOSSIP_EXTERNALENDPOINT": fmt.Sprintf("%s:%d", peerConfig.Name, peerConfig.Port),

		// MSP settings
		"CORE_PEER_LOCALMSPID":    peerConfig.MSPID,
		"CORE_PEER_MSPCONFIGPATH": "/etc/hyperledger/fabric/msp",

		// TLS settings
		"CORE_PEER_TLS_ENABLED":       fmt.Sprintf("%t", peerConfig.TLSEnabled),
		"CORE_PEER_TLS_CERT_FILE":     "/etc/hyperledger/fabric/tls/server.crt",
		"CORE_PEER_TLS_KEY_FILE":      "/etc/hyperledger/fabric/tls/server.key",
		"CORE_PEER_TLS_ROOTCERT_FILE": "/etc/hyperledger/fabric/tls/ca.crt",

		// Operations settings
		"CORE_OPERATIONS_LISTENADDRESS": fmt.Sprintf("0.0.0.0:%d", peerConfig.OperationsPort),
		"CORE_METRICS_PROVIDER":         "disabled",

		// VM settings
		"CORE_VM_ENDPOINT":                      "unix:///host/var/run/docker.sock",
		"CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE": networkName,

		// Ledger settings
		"CORE_LEDGER_STATE_STATEDATABASE":           "goleveldb",
		"CORE_LEDGER_HISTORY_ENABLEHISTORYDATABASE": "true",
		"CORE_LEDGER_SNAPSHOTS_ROOTDIR":             "/var/hyperledger/production/snapshots",

		// Chaincode settings
		"CORE_CHAINCODE_LOGGING_LEVEL":  "info",
		"CORE_CHAINCODE_LOGGING_SHIM":   "warning",
		"CORE_CHAINCODE_LOGGING_FORMAT": "%{color}%{time:2006-01-02 15:04:05.000 MST} [%{module}] %{shortfunc} -> %{level:.4s} %{id:03x}%{color:reset} %{message}",

		// Logging
		"FABRIC_LOGGING_SPEC": "INFO",
	}

	service := &docker.Service{
		ContainerName: containerName,
		Image:         FabricPeerImage,
		Environment:   docker.EnvironmentFromMap(env),
		WorkingDir:    "/root",
		Command:       "peer node start",
		Ports: []string{
			docker.PortMapping(peerConfig.Port, peerConfig.Port),
			docker.PortMapping(peerConfig.ChaincodePort, peerConfig.ChaincodePort),
			docker.PortMapping(peerConfig.OperationsPort, peerConfig.OperationsPort),
		},
		Volumes: []string{
			docker.RelativeBindMount(basePath, peerConfigPath, "/etc/hyperledger/peercfg", true),
			// Mount the entire peer directory (containing both msp and tls subdirectories)
			// This matches the fabric-samples test-network pattern
			docker.RelativeBindMount(basePath, peerDir, "/etc/hyperledger/fabric", true),
			docker.RelativeBindMount(basePath, peerDataPath, "/var/hyperledger/production", false),
			docker.BindMount("/var/run/docker.sock", "/host/var/run/docker.sock", false),
		},
		HealthCheck: docker.DefaultHealthCheck(
			"peer node status | grep -q 'status:STARTED'",
			"30s",
			"10s",
		),
		Logging: docker.DefaultLoggingConfig(),
		Restart: "unless-stopped",
		Networks: []string{
			networkName,
		},
		Hostname: peerConfig.Name + "." + org.Domain,
	}

	// Gossip bootstrap is set in environment variables for peer discovery,
	// but we don't need a hard Docker dependency since gossip can handle
	// peers discovering each other dynamically after startup

	return &docker.ServiceDefinition{
		ServiceName: serviceName,
		Service:     service,
		VolumeNames: []string{volumeName},
	}
}
