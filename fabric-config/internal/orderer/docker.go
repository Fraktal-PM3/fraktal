package orderer

import (
	"fmt"
	"path/filepath"

	"github.com/ltu/fraktal/fabric-config/internal/config"
	"github.com/ltu/fraktal/fabric-config/internal/docker"
)

const (
	// FabricOrdererImage is the Docker image for Fabric Orderer
	FabricOrdererImage = "hyperledger/fabric-orderer:2.5"
)

// GetOrdererServiceDefinition returns Docker service definition for an orderer
func GetOrdererServiceDefinition(ordererConfig *config.OrdererConfig, org *config.Organization, networkName string) *docker.ServiceDefinition {
	serviceName := fmt.Sprintf("%s_%s", networkName, ordererConfig.Name)
	containerName := fmt.Sprintf("%s_%s", networkName, ordererConfig.Name)
	volumeName := fmt.Sprintf("%s_%s", networkName, ordererConfig.Name)

	// Paths
	mspPath := ordererConfig.MSPConfigPath
	ordererDataPath := filepath.Join(org.Path, "orderers", ordererConfig.Name+"."+org.Domain, "data")
	genesisBlockPath := filepath.Join(org.Path, "system-genesis-block", "genesis.block")

	// Extract base path from CryptoPath (remove "/organizations/rootorg" suffix)
	basePath := filepath.Dir(filepath.Dir(org.Path))

	// Orderer config directory path
	ordererConfigPath := filepath.Join(basePath, "config", ordererConfig.Name)

	// Environment variables
	env := map[string]string{
		// Config path
		"FABRIC_CFG_PATH": "/etc/hyperledger/orderercfg",

		// General settings
		"ORDERER_GENERAL_LISTENADDRESS": "0.0.0.0",
		"ORDERER_GENERAL_LISTENPORT":    fmt.Sprintf("%d", ordererConfig.Port),
		"ORDERER_GENERAL_LOCALMSPID":    ordererConfig.MSPID,
		"ORDERER_GENERAL_LOCALMSPDIR":   "/var/hyperledger/orderer/msp",

		// Bootstrap method (channel participation)
		"ORDERER_GENERAL_BOOTSTRAPMETHOD":                 "none",
		"ORDERER_CHANNELPARTICIPATION_ENABLED":            "true",
		"ORDERER_CHANNELPARTICIPATION_MAXREQUESTBODYSIZE": "10485760", // 10MB in bytes

		// TLS settings
		"ORDERER_GENERAL_TLS_ENABLED":     fmt.Sprintf("%t", ordererConfig.TLSEnabled),
		"ORDERER_GENERAL_TLS_PRIVATEKEY":  "/var/hyperledger/orderer/tls/server.key",
		"ORDERER_GENERAL_TLS_CERTIFICATE": "/var/hyperledger/orderer/tls/server.crt",
		"ORDERER_GENERAL_TLS_ROOTCAS":     "[/var/hyperledger/orderer/tls/ca.crt]",

		// Cluster settings (required for etcdraft consensus)
		"ORDERER_GENERAL_CLUSTER_CLIENTCERTIFICATE": "/var/hyperledger/orderer/tls/server.crt",
		"ORDERER_GENERAL_CLUSTER_CLIENTPRIVATEKEY":  "/var/hyperledger/orderer/tls/server.key",
		"ORDERER_GENERAL_CLUSTER_ROOTCAS":           "[/var/hyperledger/orderer/tls/ca.crt]",

		// Operations settings
		"ORDERER_OPERATIONS_LISTENADDRESS": fmt.Sprintf("0.0.0.0:%d", ordererConfig.OperationsPort),
		"ORDERER_METRICS_PROVIDER":         "disabled",

		// Admin server (matches test-network configuration)
		"ORDERER_ADMIN_LISTENADDRESS":          fmt.Sprintf("0.0.0.0:%d", ordererConfig.AdminPort),
		"ORDERER_ADMIN_TLS_ENABLED":            "true",
		"ORDERER_ADMIN_TLS_CERTIFICATE":        "/var/hyperledger/orderer/tls/server.crt",
		"ORDERER_ADMIN_TLS_PRIVATEKEY":         "/var/hyperledger/orderer/tls/server.key",
		"ORDERER_ADMIN_TLS_ROOTCAS":            "[/var/hyperledger/orderer/tls/ca.crt]",
		"ORDERER_ADMIN_TLS_CLIENTAUTHREQUIRED": "true",
		"ORDERER_ADMIN_TLS_CLIENTROOTCAS":      "[/var/hyperledger/orderer/tls/ca.crt]",

		// Consensus (etcdraft)
		"ORDERER_CONSENSUS_WALDIR":  "/var/hyperledger/production/orderer/etcdraft/wal",
		"ORDERER_CONSENSUS_SNAPDIR": "/var/hyperledger/production/orderer/etcdraft/snapshot",

		// File ledger
		"ORDERER_FILELEDGER_LOCATION": "/var/hyperledger/production/orderer",

		// Logging
		"FABRIC_LOGGING_SPEC":      "INFO",
		"ORDERER_GENERAL_LOGLEVEL": "INFO",
	}

	service := &docker.Service{
		ContainerName: containerName,
		Image:         FabricOrdererImage,
		Environment:   docker.EnvironmentFromMap(env),
		WorkingDir:    "/root",
		Command:       "orderer",
		Ports: []string{
			docker.PortMapping(ordererConfig.Port, ordererConfig.Port),
			docker.PortMapping(ordererConfig.AdminPort, ordererConfig.AdminPort),
			docker.PortMapping(ordererConfig.OperationsPort, ordererConfig.OperationsPort),
		},
		Volumes: []string{
			docker.RelativeBindMount(basePath, ordererConfigPath, "/etc/hyperledger/orderercfg", true),
			docker.RelativeBindMount(basePath, mspPath, "/var/hyperledger/orderer/msp", true),
			docker.RelativeBindMount(basePath, filepath.Join(mspPath, "../tls"), "/var/hyperledger/orderer/tls", true),
			docker.RelativeBindMount(basePath, ordererDataPath, "/var/hyperledger/production/orderer", false),
			docker.RelativeBindMount(basePath, genesisBlockPath, "/var/hyperledger/orderer/genesis.block", true),
		},
		HealthCheck: docker.DefaultHealthCheck(
			fmt.Sprintf("test -f /var/hyperledger/production/orderer/chains/system-channel/blockfile_000000"),
			"30s",
			"10s",
		),
		Logging: docker.DefaultLoggingConfig(),
		Restart: "unless-stopped",
		Networks: []string{
			networkName,
		},
		Hostname: ordererConfig.Name + "." + org.Domain,
	}

	return &docker.ServiceDefinition{
		ServiceName: serviceName,
		Service:     service,
		VolumeNames: []string{volumeName},
	}
}
