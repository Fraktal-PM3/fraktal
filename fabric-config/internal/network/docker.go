package network

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/ltu/fraktal/fabric-config/internal/ca"
	"github.com/ltu/fraktal/fabric-config/internal/config"
	"github.com/ltu/fraktal/fabric-config/internal/docker"
	"github.com/ltu/fraktal/fabric-config/internal/orderer"
	"github.com/ltu/fraktal/fabric-config/internal/peer"
)

// GenerateDockerCompose generates a docker-compose.yml file for the network
func (n *Network) GenerateDockerCompose() error {
	if n.Config.Orgs == nil {
		return fmt.Errorf("No orgs on channel yet")
	}

	fmt.Println("Generating docker-compose.yml...")

	// Create docker-compose config
	composeConfig := docker.NewDockerComposeConfig()

	// Add network
	networkName := "pm3"
	composeConfig.AddNetwork(networkName, &docker.Network{
		Driver: "bridge",
	})

	for _, org := range n.Config.Orgs {
		orgService := ca.GetCAServiceDefinition(org, networkName, n.Config.BasePath)
		composeConfig.AddServiceDefinition(orgService)
	}

	// Add orderer services
	for _, ord := range n.Config.Orderers {
		for _, org := range n.Config.Orgs {
			if org.Name == ord.Organization {
				ordererService := orderer.GetOrdererServiceDefinition(ord, org, networkName)
				composeConfig.AddServiceDefinition(ordererService)
			}
		}
	}

	// Add peer services
	for _, p := range n.Config.Peers {
		for _, org := range n.Config.Orgs {
			if org.Name == p.Organization {
				peerService := peer.GetPeerServiceDefinition(p, org, networkName)
				composeConfig.AddServiceDefinition(peerService)
			}
		}
	}

	// Write docker-compose.yml
	composePath := filepath.Join(n.Config.BasePath, "docker-compose.yml")
	if err := composeConfig.WriteToFile(composePath); err != nil {
		return fmt.Errorf("failed to write docker-compose.yml: %w", err)
	}

	fmt.Printf("\n✓ Generated docker-compose.yml at %s\n", composePath)
	return nil
}

// StartCA starts only the specified CA container and waits for it to initialize
func (n *Network) StartCA(ctx context.Context, caName string) error {
	fmt.Println("Starting Certificate Authority...")

	// Find CA org in network config
	var caOrg *config.Organization
	for _, org := range n.Config.Orgs {
		if org.Name == caName {
			caOrg = org
			break
		}
	}
	if caOrg == nil {
		return fmt.Errorf("could not find ca org %s in network config", caName)
	}

	// Check Docker is available
	dm := docker.NewDockerManager()
	version, err := dm.CheckDockerConfig()
	if err != nil {
		return fmt.Errorf("docker check failed: %w", err)
	}

	// Add compose version to context
	ctx = context.WithValue(ctx, docker.CtxComposeVersionKey{}, version)

	// Pull CA image first
	fmt.Println("Pulling CA Docker image...")
	if err := dm.PullImage(ctx, ca.FabricCAImage); err != nil {
		fmt.Printf("Warning: failed to pull %s: %v\n", ca.FabricCAImage, err)
	}

	// Start only the CA container
	fmt.Println("Starting CA container...")
	workDir := n.Config.BasePath
	caServiceName := fmt.Sprintf("%s_ca", caOrg.Name)

	if err := dm.RunDockerComposeCommand(ctx, workDir, "up", "-d", caServiceName); err != nil {
		return fmt.Errorf("failed to start CA container: %w", err)
	}

	// Wait for CA to initialize and create ca-cert.pem
	fmt.Println("Waiting for CA to initialize...")
	caCertPath := filepath.Join(caOrg.Path, "ca-cert.pem")

	// Wait up to 30 seconds for the cert file to appear
	for i := 0; i < 30; i++ {
		if _, err := os.Stat(caCertPath); err == nil {
			// File exists, wait a bit more to ensure it's complete
			fmt.Println("\n✓ CA initialized and certificate created")
			return nil
		}
		fmt.Print(".")
		select {
		case <-ctx.Done():
			return fmt.Errorf("context cancelled while waiting for CA")
		case <-time.After(1 * time.Second):
			// Wait 1 second
		}
	}

	return fmt.Errorf("CA certificate not created after 30 seconds")
}

// StopCA stops the CA server
func (n *Network) StopCA(ctx context.Context) error {
	fmt.Println("Stopping Certificate Authority...")

	dm := docker.NewDockerManager()
	version, err := dm.CheckDockerConfig()
	if err != nil {
		return fmt.Errorf("docker check failed: %w", err)
	}

	ctx = context.WithValue(ctx, docker.CtxComposeVersionKey{}, version)

	workDir := n.Config.BasePath
	networkName := "pm3"
	caServiceName := fmt.Sprintf("%s_ca", networkName)

	if err := dm.RunDockerComposeCommand(ctx, workDir, "stop", caServiceName); err != nil {
		return fmt.Errorf("failed to stop CA container: %w", err)
	}

	fmt.Println("✓ CA stopped successfully!")
	return nil
}

// StartNetwork starts the Docker containers
func (n *Network) StartNetwork(ctx context.Context) error {
	fmt.Println("Starting Fabric network...")

	// Check Docker is available
	dm := docker.NewDockerManager()
	version, err := dm.CheckDockerConfig()
	if err != nil {
		return fmt.Errorf("docker check failed: %w", err)
	}

	// Add compose version to context
	ctx = context.WithValue(ctx, docker.CtxComposeVersionKey{}, version)

	// Pull images first
	fmt.Println("\nPulling Docker images...")
	images := []string{
		orderer.FabricOrdererImage,
		peer.FabricPeerImage,
	}

	for _, image := range images {
		if err := dm.PullImage(ctx, image); err != nil {
			fmt.Printf("Warning: failed to pull %s: %v\n", image, err)
		}
	}

	// Start containers
	fmt.Println("\nStarting containers...")
	workDir := n.Config.BasePath
	if err := dm.RunDockerComposeCommand(ctx, workDir, "up", "-d"); err != nil {
		return fmt.Errorf("failed to start containers: %w", err)
	}

	fmt.Println("\n✓ Network started successfully!")
	fmt.Println("\nTo view logs, run:")
	fmt.Printf("  cd %s && docker-compose logs -f\n", workDir)

	return nil
}

// StopNetwork stops the Docker containers
func (n *Network) StopNetwork(ctx context.Context) error {
	fmt.Println("Stopping Fabric network...")

	dm := docker.NewDockerManager()
	version, err := dm.CheckDockerConfig()
	if err != nil {
		return fmt.Errorf("docker check failed: %w", err)
	}

	ctx = context.WithValue(ctx, docker.CtxComposeVersionKey{}, version)

	workDir := n.Config.BasePath
	if err := dm.RunDockerComposeCommand(ctx, workDir, "stop"); err != nil {
		return fmt.Errorf("failed to stop containers: %w", err)
	}

	fmt.Println("✓ Network stopped successfully!")
	return nil
}

// DownNetwork stops and removes containers
func (n *Network) DownNetwork(ctx context.Context) error {
	fmt.Println("Removing Fabric network containers...")

	dm := docker.NewDockerManager()
	version, err := dm.CheckDockerConfig()
	if err != nil {
		return fmt.Errorf("docker check failed: %w", err)
	}

	ctx = context.WithValue(ctx, docker.CtxComposeVersionKey{}, version)

	workDir := n.Config.BasePath
	if err := dm.RunDockerComposeCommand(ctx, workDir, "down"); err != nil {
		return fmt.Errorf("failed to remove containers: %w", err)
	}

	fmt.Println("✓ Network containers removed successfully!")
	return nil
}

// DownNetworkWithVolumes stops and removes containers and volumes
func (n *Network) DownNetworkWithVolumes(ctx context.Context) error {
	fmt.Println("Removing Fabric network containers and volumes...")

	dm := docker.NewDockerManager()
	version, err := dm.CheckDockerConfig()
	if err != nil {
		return fmt.Errorf("docker check failed: %w", err)
	}

	ctx = context.WithValue(ctx, docker.CtxComposeVersionKey{}, version)

	workDir := n.Config.BasePath
	if err := dm.RunDockerComposeCommand(ctx, workDir, "down", "-v"); err != nil {
		return fmt.Errorf("failed to remove containers and volumes: %w", err)
	}

	fmt.Println("✓ Network containers and volumes removed successfully!")
	return nil
}

// ShowLogs streams logs from the network
func (n *Network) ShowLogs(ctx context.Context, follow bool, services ...string) error {
	dm := docker.NewDockerManager()
	version, err := dm.CheckDockerConfig()
	if err != nil {
		return fmt.Errorf("docker check failed: %w", err)
	}

	ctx = context.WithValue(ctx, docker.CtxComposeVersionKey{}, version)

	workDir := n.Config.BasePath
	return dm.StreamDockerLogs(ctx, workDir, follow, services...)
}

// ListContainers lists all containers in the network
func (n *Network) ListContainers(ctx context.Context) (string, error) {
	dm := docker.NewDockerManager()
	return dm.ListContainers(ctx)
}
