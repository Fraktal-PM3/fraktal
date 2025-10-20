package docker

import "context"

// IDockerManager is an interface for Docker operations
type IDockerManager interface {
	// Compose operations
	RunDockerComposeCommand(ctx context.Context, workDir string, command ...string) error
	RunDockerComposeCommandReturnsStdout(ctx context.Context, workDir string, command ...string) (string, error)
	StreamDockerLogs(ctx context.Context, workDir string, follow bool, services ...string) error

	// Container operations
	RunDockerCommand(ctx context.Context, workDir string, command ...string) error
	RunDockerCommandBuffered(ctx context.Context, workDir string, command ...string) (string, error)
	InspectContainer(ctx context.Context, containerName string) (string, error)
	GetContainerIP(ctx context.Context, containerName string) (string, error)
	ListContainers(ctx context.Context) (string, error)
	ExecInContainer(ctx context.Context, containerName string, command ...string) error
	ExecInContainerBuffered(ctx context.Context, containerName string, command ...string) (string, error)
	WaitForContainer(ctx context.Context, containerName string) error
	ReadDockerLogs(ctx context.Context, containerName string, tail int) (string, error)
	CopyFromContainer(ctx context.Context, containerName, sourcePath, destPath string) error

	// Volume operations
	CreateVolume(ctx context.Context, volumeName string) error
	RemoveVolume(ctx context.Context, volumeName string) error
	CopyFileToVolume(ctx context.Context, volumeName, sourcePath, destPath string) error

	// Image operations
	PullImage(ctx context.Context, imageName string) error
	GetImageDigest(ctx context.Context, imageName string) (string, error)

	// Utility
	CheckDockerConfig() (ComposeVersion, error)
}

// DockerManager is the default implementation
type DockerManager struct{}

// NewDockerManager creates a new Docker manager
func NewDockerManager() IDockerManager {
	return &DockerManager{}
}

// Implement all interface methods by delegating to package functions

func (d *DockerManager) RunDockerComposeCommand(ctx context.Context, workDir string, command ...string) error {
	return RunDockerComposeCommand(ctx, workDir, command...)
}

func (d *DockerManager) RunDockerComposeCommandReturnsStdout(ctx context.Context, workDir string, command ...string) (string, error) {
	return RunDockerComposeCommandReturnsStdout(ctx, workDir, command...)
}

func (d *DockerManager) StreamDockerLogs(ctx context.Context, workDir string, follow bool, services ...string) error {
	return StreamDockerLogs(ctx, workDir, follow, services...)
}

func (d *DockerManager) RunDockerCommand(ctx context.Context, workDir string, command ...string) error {
	return RunDockerCommand(ctx, workDir, command...)
}

func (d *DockerManager) RunDockerCommandBuffered(ctx context.Context, workDir string, command ...string) (string, error) {
	return RunDockerCommandBuffered(ctx, workDir, command...)
}

func (d *DockerManager) InspectContainer(ctx context.Context, containerName string) (string, error) {
	return InspectContainer(ctx, containerName)
}

func (d *DockerManager) GetContainerIP(ctx context.Context, containerName string) (string, error) {
	return GetContainerIP(ctx, containerName)
}

func (d *DockerManager) ListContainers(ctx context.Context) (string, error) {
	return ListContainers(ctx)
}

func (d *DockerManager) ExecInContainer(ctx context.Context, containerName string, command ...string) error {
	return ExecInContainer(ctx, containerName, command...)
}

func (d *DockerManager) ExecInContainerBuffered(ctx context.Context, containerName string, command ...string) (string, error) {
	return ExecInContainerBuffered(ctx, containerName, command...)
}

func (d *DockerManager) WaitForContainer(ctx context.Context, containerName string) error {
	return WaitForContainer(ctx, containerName)
}

func (d *DockerManager) ReadDockerLogs(ctx context.Context, containerName string, tail int) (string, error) {
	return ReadDockerLogs(ctx, containerName, tail)
}

func (d *DockerManager) CopyFromContainer(ctx context.Context, containerName, sourcePath, destPath string) error {
	return CopyFromContainer(ctx, containerName, sourcePath, destPath)
}

func (d *DockerManager) CreateVolume(ctx context.Context, volumeName string) error {
	return CreateVolume(ctx, volumeName)
}

func (d *DockerManager) RemoveVolume(ctx context.Context, volumeName string) error {
	return RemoveVolume(ctx, volumeName)
}

func (d *DockerManager) CopyFileToVolume(ctx context.Context, volumeName, sourcePath, destPath string) error {
	return CopyFileToVolume(ctx, volumeName, sourcePath, destPath)
}

func (d *DockerManager) PullImage(ctx context.Context, imageName string) error {
	return PullImage(ctx, imageName)
}

func (d *DockerManager) GetImageDigest(ctx context.Context, imageName string) (string, error) {
	return GetImageDigest(ctx, imageName)
}

func (d *DockerManager) CheckDockerConfig() (ComposeVersion, error) {
	return CheckDockerConfig()
}
