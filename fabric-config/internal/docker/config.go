package docker

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v2"
)

// DockerComposeConfig represents a docker-compose.yml file
type DockerComposeConfig struct {
	Version  string              `yaml:"version"`
	Services map[string]*Service `yaml:"services"`
	Volumes  map[string]*Volume  `yaml:"volumes,omitempty"`
	Networks map[string]*Network `yaml:"networks,omitempty"`
}

// Service represents a Docker service
type Service struct {
	ContainerName string                 `yaml:"container_name,omitempty"`
	Image         string                 `yaml:"image,omitempty"`
	Build         *BuildConfig           `yaml:"build,omitempty"`
	Command       interface{}            `yaml:"command,omitempty"` // can be string or []string
	Environment   map[string]interface{} `yaml:"environment,omitempty"`
	EnvFile       []string               `yaml:"env_file,omitempty"`
	Ports         []string               `yaml:"ports,omitempty"`
	Expose        []string               `yaml:"expose,omitempty"`
	Volumes       []string               `yaml:"volumes,omitempty"`
	Networks      []string               `yaml:"networks,omitempty"`
	DependsOn     map[string]*DependsOn  `yaml:"depends_on,omitempty"`
	HealthCheck   *HealthCheck           `yaml:"healthcheck,omitempty"`
	Logging       *LoggingConfig         `yaml:"logging,omitempty"`
	Restart       string                 `yaml:"restart,omitempty"`
	WorkingDir    string                 `yaml:"working_dir,omitempty"`
	Entrypoint    interface{}            `yaml:"entrypoint,omitempty"` // can be string or []string
	User          string                 `yaml:"user,omitempty"`
	Hostname      string                 `yaml:"hostname,omitempty"`
	ExtraHosts    []string               `yaml:"extra_hosts,omitempty"`
	CapAdd        []string               `yaml:"cap_add,omitempty"`
	CapDrop       []string               `yaml:"cap_drop,omitempty"`
	Privileged    bool                   `yaml:"privileged,omitempty"`
	Labels        map[string]string      `yaml:"labels,omitempty"`
}

// BuildConfig represents Docker build configuration
type BuildConfig struct {
	Context    string            `yaml:"context,omitempty"`
	Dockerfile string            `yaml:"dockerfile,omitempty"`
	Args       map[string]string `yaml:"args,omitempty"`
	Target     string            `yaml:"target,omitempty"`
}

// DependsOn represents service dependencies
type DependsOn struct {
	Condition string `yaml:"condition,omitempty"`
}

// HealthCheck represents a health check configuration
type HealthCheck struct {
	Test        []string `yaml:"test,omitempty"`
	Interval    string   `yaml:"interval,omitempty"`
	Timeout     string   `yaml:"timeout,omitempty"`
	Retries     int      `yaml:"retries,omitempty"`
	StartPeriod string   `yaml:"start_period,omitempty"`
}

// LoggingConfig represents logging configuration
type LoggingConfig struct {
	Driver  string            `yaml:"driver,omitempty"`
	Options map[string]string `yaml:"options,omitempty"`
}

// Volume represents a Docker volume
type Volume struct {
	Driver     string            `yaml:"driver,omitempty"`
	DriverOpts map[string]string `yaml:"driver_opts,omitempty"`
	External   bool              `yaml:"external,omitempty"`
	Labels     map[string]string `yaml:"labels,omitempty"`
	Name       string            `yaml:"name,omitempty"`
}

// Network represents a Docker network
type Network struct {
	Driver     string            `yaml:"driver,omitempty"`
	DriverOpts map[string]string `yaml:"driver_opts,omitempty"`
	External   bool              `yaml:"external,omitempty"`
	Labels     map[string]string `yaml:"labels,omitempty"`
	Name       string            `yaml:"name,omitempty"`
}

// ServiceDefinition is a helper struct for building services
type ServiceDefinition struct {
	ServiceName string
	Service     *Service
	VolumeNames []string
}

// NewDockerComposeConfig creates a new docker-compose configuration
func NewDockerComposeConfig() *DockerComposeConfig {
	return &DockerComposeConfig{
		Version:  "3.8",
		Services: make(map[string]*Service),
		Volumes:  make(map[string]*Volume),
		Networks: make(map[string]*Network),
	}
}

// AddService adds a service to the configuration
func (c *DockerComposeConfig) AddService(serviceName string, service *Service) {
	c.Services[serviceName] = service
}

// AddVolume adds a volume to the configuration
func (c *DockerComposeConfig) AddVolume(volumeName string, volume *Volume) {
	if c.Volumes == nil {
		c.Volumes = make(map[string]*Volume)
	}
	c.Volumes[volumeName] = volume
}

// AddNetwork adds a network to the configuration
func (c *DockerComposeConfig) AddNetwork(networkName string, network *Network) {
	if c.Networks == nil {
		c.Networks = make(map[string]*Network)
	}
	c.Networks[networkName] = network
}

// AddServiceDefinition adds a service definition and its volumes
func (c *DockerComposeConfig) AddServiceDefinition(def *ServiceDefinition) {
	c.AddService(def.ServiceName, def.Service)
	for _, volumeName := range def.VolumeNames {
		if _, exists := c.Volumes[volumeName]; !exists {
			c.AddVolume(volumeName, &Volume{})
		}
	}
}

// AddServiceDefinitions adds multiple service definitions
func (c *DockerComposeConfig) AddServiceDefinitions(defs []*ServiceDefinition) {
	for _, def := range defs {
		c.AddServiceDefinition(def)
	}
}

// WriteToFile writes the docker-compose config to a YAML file
func (c *DockerComposeConfig) WriteToFile(path string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	data, err := yaml.Marshal(c)
	if err != nil {
		return fmt.Errorf("failed to marshal docker-compose config: %w", err)
	}

	if err := os.WriteFile(path, data, 0644); err != nil {
		return fmt.Errorf("failed to write docker-compose file: %w", err)
	}

	return nil
}

// DefaultLoggingConfig returns a standard logging configuration
func DefaultLoggingConfig() *LoggingConfig {
	return &LoggingConfig{
		Driver: "json-file",
		Options: map[string]string{
			"max-size": "10m",
			"max-file": "3",
		},
	}
}

// DefaultHealthCheck returns a standard health check configuration
func DefaultHealthCheck(command string, interval, timeout string) *HealthCheck {
	return &HealthCheck{
		Test:        []string{"CMD-SHELL", command},
		Interval:    interval,
		Timeout:     timeout,
		Retries:     5,
		StartPeriod: "30s",
	}
}

// DependsOnHealthy creates a depends_on condition for a healthy service
func DependsOnHealthy(services ...string) map[string]*DependsOn {
	deps := make(map[string]*DependsOn)
	for _, service := range services {
		deps[service] = &DependsOn{
			Condition: "service_healthy",
		}
	}
	return deps
}

// DependsOnStarted creates a depends_on condition for a started service
func DependsOnStarted(services ...string) map[string]*DependsOn {
	deps := make(map[string]*DependsOn)
	for _, service := range services {
		deps[service] = &DependsOn{
			Condition: "service_started",
		}
	}
	return deps
}

// EnvironmentFromMap converts a string map to environment format
func EnvironmentFromMap(env map[string]string) map[string]interface{} {
	result := make(map[string]interface{})
	for k, v := range env {
		result[k] = v
	}
	return result
}

// VolumeMount creates a volume mount string
func VolumeMount(volumeName, containerPath string) string {
	return fmt.Sprintf("%s:%s", volumeName, containerPath)
}

// BindMount creates a bind mount string
func BindMount(hostPath, containerPath string, readOnly bool) string {
	mount := fmt.Sprintf("%s:%s", hostPath, containerPath)
	if readOnly {
		mount += ":ro"
	}
	return mount
}

// RelativeBindMount creates a bind mount string with a relative path
// This is useful for docker-compose.yml files where paths should be relative to the compose file
func RelativeBindMount(basePath, hostPath, containerPath string, readOnly bool) string {
	// Convert to relative path if hostPath is under basePath
	relPath, err := filepath.Rel(basePath, hostPath)
	if err != nil || filepath.IsAbs(relPath) {
		// If we can't make it relative or it's already absolute, use as-is but prefix with ./
		relPath = "./" + filepath.Base(hostPath)
	} else {
		// Ensure relative path starts with ./
		if relPath != "." && !filepath.IsAbs(relPath) {
			relPath = "./" + relPath
		}
	}

	mount := fmt.Sprintf("%s:%s", relPath, containerPath)
	if readOnly {
		mount += ":ro"
	}
	return mount
}

// PortMapping creates a port mapping string
func PortMapping(hostPort, containerPort int) string {
	return fmt.Sprintf("%d:%d", hostPort, containerPort)
}

// PortMappingWithProtocol creates a port mapping with protocol
func PortMappingWithProtocol(hostPort, containerPort int, protocol string) string {
	return fmt.Sprintf("%d:%d/%s", hostPort, containerPort, protocol)
}
