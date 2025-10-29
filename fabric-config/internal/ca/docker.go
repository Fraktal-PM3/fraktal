package ca

import (
	"fmt"
	"path/filepath"

	"github.com/ltu/fraktal/fabric-config/internal/config"
	"github.com/ltu/fraktal/fabric-config/internal/docker"
)

const (
	// FabricCAImage is the Docker image for Fabric CA
	FabricCAImage = "hyperledger/fabric-ca:1.5"
)

// GetCAServiceDefinition returns Docker service definition for CA
func GetCAServiceDefinition(org *config.Organization, networkName string, orgPath string) *docker.ServiceDefinition {
	serviceName := fmt.Sprintf("%s_ca", org.Name)
	containerName := fmt.Sprintf("%s_fabric_ca", org.Name)
	volumeName := fmt.Sprintf("%s_ca", org.Name)

	service := &docker.Service{
		ContainerName: containerName,
		Image:         FabricCAImage,
		Environment: docker.EnvironmentFromMap(map[string]string{
			"FABRIC_CA_HOME":         "/etc/hyperledger/fabric-ca-server",
			"FABRIC_CA_SERVER_DEBUG": "false",
		}),
		Ports: []string{
			docker.PortMapping(org.CA.Port, org.CA.Port),
		},
		Volumes: []string{
			docker.BindMount(orgPath, "/etc/hyperledger/fabric-ca-server", false),
		},
		Command: []string{
			"sh", "-c",
			"fabric-ca-server start",
		},
		HealthCheck: getCAHealthCheck(org),
		Logging:     docker.DefaultLoggingConfig(),
		Restart:     "unless-stopped",
		Networks: []string{
			networkName,
		},
	}

	return &docker.ServiceDefinition{
		ServiceName: serviceName,
		Service:     service,
		VolumeNames: []string{volumeName},
	}
}

// GetCAEnrollmentServiceDefinition returns a one-time enrollment service
func GetCAEnrollmentServiceDefinition(org *config.Organization, networkName string, identity string) *docker.ServiceDefinition {
	serviceName := fmt.Sprintf("%s_ca_enroll_%s", networkName, identity)
	containerName := fmt.Sprintf("%s_fabric_ca_enroll_%s", networkName, identity)

	enrollPath := filepath.Join(org.Path, "enroll", identity)

	service := &docker.Service{
		ContainerName: containerName,
		Image:         FabricCAImage,
		Environment: docker.EnvironmentFromMap(map[string]string{
			"FABRIC_CA_CLIENT_HOME": "/etc/hyperledger/fabric-ca-client",
		}),
		Volumes: []string{
			docker.BindMount(enrollPath, "/etc/hyperledger/fabric-ca-client", false),
		},
		Command: []string{
			"sh", "-c",
			fmt.Sprintf("fabric-ca-client enroll -u https://%s:%s@%s_fabric_ca:%d --caname %s",
				org.CA.AdminUser, org.CA.AdminPassword, networkName, org.CA.Port, org.CA.Name),
		},
		DependsOn: docker.DependsOnHealthy(fmt.Sprintf("%s_ca", networkName)),
		Networks: []string{
			networkName,
		},
	}

	return &docker.ServiceDefinition{
		ServiceName: serviceName,
		Service:     service,
		VolumeNames: []string{},
	}
}

// getCAHealthCheck returns the appropriate health check for the CA service
func getCAHealthCheck(org *config.Organization) *docker.HealthCheck {
	var healthCheckCmd string

	if org.CA.TLSEnabled {
		// Use HTTPS and specify the TLS cert file for verification
		healthCheckCmd = fmt.Sprintf(
			"fabric-ca-client getcainfo -u https://localhost:%d --caname %s --tls.certfiles /etc/hyperledger/fabric-ca-server/ca-cert.pem",
			org.CA.Port, org.CA.Name,
		)
	} else {
		// Use HTTP when TLS is disabled
		healthCheckCmd = fmt.Sprintf(
			"fabric-ca-client getcainfo -u http://localhost:%d --caname %s",
			org.CA.Port, org.CA.Name,
		)
	}

	return docker.DefaultHealthCheck(healthCheckCmd, "10s", "5s")
}
