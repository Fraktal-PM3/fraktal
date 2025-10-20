package docker

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
)

// ComposeVersion represents the Docker Compose version
type ComposeVersion int

const (
	ComposeVersionUnknown ComposeVersion = iota
	ComposeVersionV1                     // docker-compose
	ComposeVersionV2                     // docker compose
)

// CtxComposeVersionKey is the context key for compose version
type CtxComposeVersionKey struct{}

// CheckDockerConfig checks Docker and Compose installation
func CheckDockerConfig() (ComposeVersion, error) {
	// Check Docker
	if err := exec.Command("docker", "version").Run(); err != nil {
		return ComposeVersionUnknown, fmt.Errorf("docker is not installed or not running: %w", err)
	}

	// Check Docker Compose V2
	if err := exec.Command("docker", "compose", "version").Run(); err == nil {
		return ComposeVersionV2, nil
	}

	// Check Docker Compose V1
	if err := exec.Command("docker-compose", "version").Run(); err == nil {
		return ComposeVersionV1, nil
	}

	return ComposeVersionUnknown, fmt.Errorf("docker-compose is not installed")
}

// RunDockerCommand runs a Docker command
func RunDockerCommand(ctx context.Context, workDir string, command ...string) error {
	cmd := exec.CommandContext(ctx, "docker", command...)
	cmd.Dir = workDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("docker command failed: %w", err)
	}

	return nil
}

// RunDockerCommandBuffered runs a Docker command and returns stdout
func RunDockerCommandBuffered(ctx context.Context, workDir string, command ...string) (string, error) {
	cmd := exec.CommandContext(ctx, "docker", command...)
	cmd.Dir = workDir

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("docker command failed: %s: %w", stderr.String(), err)
	}

	return stdout.String(), nil
}

// RunDockerComposeCommand runs a docker-compose command with version detection
func RunDockerComposeCommand(ctx context.Context, workDir string, command ...string) error {
	version, ok := ctx.Value(CtxComposeVersionKey{}).(ComposeVersion)
	if !ok {
		var err error
		version, err = CheckDockerConfig()
		if err != nil {
			return err
		}
	}

	var cmd *exec.Cmd
	switch version {
	case ComposeVersionV2:
		args := append([]string{"compose"}, command...)
		cmd = exec.CommandContext(ctx, "docker", args...)
	case ComposeVersionV1:
		cmd = exec.CommandContext(ctx, "docker-compose", command...)
	default:
		return fmt.Errorf("unknown docker-compose version")
	}

	cmd.Dir = workDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("docker-compose command failed: %w", err)
	}

	return nil
}

// RunDockerComposeCommandReturnsStdout runs docker-compose and returns stdout
func RunDockerComposeCommandReturnsStdout(ctx context.Context, workDir string, command ...string) (string, error) {
	version, ok := ctx.Value(CtxComposeVersionKey{}).(ComposeVersion)
	if !ok {
		var err error
		version, err = CheckDockerConfig()
		if err != nil {
			return "", err
		}
	}

	var cmd *exec.Cmd
	switch version {
	case ComposeVersionV2:
		args := append([]string{"compose"}, command...)
		cmd = exec.CommandContext(ctx, "docker", args...)
	case ComposeVersionV1:
		cmd = exec.CommandContext(ctx, "docker-compose", command...)
	default:
		return "", fmt.Errorf("unknown docker-compose version")
	}

	cmd.Dir = workDir

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("docker-compose command failed: %s: %w", stderr.String(), err)
	}

	return stdout.String(), nil
}

// StreamDockerLogs streams logs from containers
func StreamDockerLogs(ctx context.Context, workDir string, follow bool, services ...string) error {
	version, ok := ctx.Value(CtxComposeVersionKey{}).(ComposeVersion)
	if !ok {
		var err error
		version, err = CheckDockerConfig()
		if err != nil {
			return err
		}
	}

	args := []string{"logs"}
	if follow {
		args = append(args, "-f")
	}
	args = append(args, services...)

	var cmd *exec.Cmd
	switch version {
	case ComposeVersionV2:
		composeArgs := append([]string{"compose"}, args...)
		cmd = exec.CommandContext(ctx, "docker", composeArgs...)
	case ComposeVersionV1:
		cmd = exec.CommandContext(ctx, "docker-compose", args...)
	default:
		return fmt.Errorf("unknown docker-compose version")
	}

	cmd.Dir = workDir

	// Stream output
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return err
	}

	if err := cmd.Start(); err != nil {
		return err
	}

	// Create channels to coordinate goroutine completion
	done := make(chan struct{}, 2)

	// Stream stdout
	go func() {
		defer func() { done <- struct{}{} }()
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			select {
			case <-ctx.Done():
				return
			default:
				fmt.Println(scanner.Text())
			}
		}
	}()

	// Stream stderr
	go func() {
		defer func() { done <- struct{}{} }()
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			select {
			case <-ctx.Done():
				return
			default:
				fmt.Fprintln(os.Stderr, scanner.Text())
			}
		}
	}()

	// Wait for command to complete
	cmdErr := cmd.Wait()

	// Wait for both goroutines to finish
	<-done
	<-done

	return cmdErr
}

// CreateVolume creates a Docker volume
func CreateVolume(ctx context.Context, volumeName string) error {
	if volumeName == "" {
		return fmt.Errorf("volume name cannot be empty")
	}
	// Input validation: prevent command injection
	if strings.ContainsAny(volumeName, ";|&$`<>") {
		return fmt.Errorf("invalid volume name: contains forbidden characters")
	}
	return RunDockerCommand(ctx, "", "volume", "create", volumeName)
}

// RemoveVolume removes a Docker volume
func RemoveVolume(ctx context.Context, volumeName string) error {
	if volumeName == "" {
		return fmt.Errorf("volume name cannot be empty")
	}
	// Input validation: prevent command injection
	if strings.ContainsAny(volumeName, ";|&$`<>") {
		return fmt.Errorf("invalid volume name: contains forbidden characters")
	}
	return RunDockerCommand(ctx, "", "volume", "rm", volumeName)
}

// CopyFileToVolume copies a file to a Docker volume
func CopyFileToVolume(ctx context.Context, volumeName, sourcePath, destPath string) error {
	// Create a temporary container to access the volume
	containerID, err := RunDockerCommandBuffered(ctx, "",
		"create", "-v", fmt.Sprintf("%s:/data", volumeName), "alpine", "true")
	if err != nil {
		return err
	}
	containerID = strings.TrimSpace(containerID)

	// Copy file to container
	if err := RunDockerCommand(ctx, "", "cp", sourcePath, fmt.Sprintf("%s:/data/%s", containerID, destPath)); err != nil {
		RunDockerCommand(ctx, "", "rm", containerID) // Cleanup
		return err
	}

	// Remove temporary container
	return RunDockerCommand(ctx, "", "rm", containerID)
}

// CopyFromContainer copies a file from a container
func CopyFromContainer(ctx context.Context, containerName, sourcePath, destPath string) error {
	return RunDockerCommand(ctx, "", "cp", fmt.Sprintf("%s:%s", containerName, sourcePath), destPath)
}

// InspectContainer gets container information
func InspectContainer(ctx context.Context, containerName string) (string, error) {
	return RunDockerCommandBuffered(ctx, "", "inspect", containerName)
}

// GetContainerIP gets the IP address of a container
func GetContainerIP(ctx context.Context, containerName string) (string, error) {
	output, err := RunDockerCommandBuffered(ctx, "",
		"inspect", "-f", "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}", containerName)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(output), nil
}

// PullImage pulls a Docker image
func PullImage(ctx context.Context, imageName string) error {
	fmt.Printf("Pulling image: %s\n", imageName)
	return RunDockerCommand(ctx, "", "pull", imageName)
}

// ListContainers lists running containers
func ListContainers(ctx context.Context) (string, error) {
	return RunDockerCommandBuffered(ctx, "", "ps", "-a")
}

// ExecInContainer executes a command in a running container
func ExecInContainer(ctx context.Context, containerName string, command ...string) error {
	if containerName == "" {
		return fmt.Errorf("container name cannot be empty")
	}
	// Input validation: prevent command injection
	if strings.ContainsAny(containerName, ";|&$`<>") {
		return fmt.Errorf("invalid container name: contains forbidden characters")
	}
	args := append([]string{"exec", containerName}, command...)
	return RunDockerCommand(ctx, "", args...)
}

// ExecInContainerBuffered executes a command and returns output
func ExecInContainerBuffered(ctx context.Context, containerName string, command ...string) (string, error) {
	if containerName == "" {
		return "", fmt.Errorf("container name cannot be empty")
	}
	// Input validation: prevent command injection
	if strings.ContainsAny(containerName, ";|&$`<>") {
		return "", fmt.Errorf("invalid container name: contains forbidden characters")
	}
	args := append([]string{"exec", containerName}, command...)
	return RunDockerCommandBuffered(ctx, "", args...)
}

// WaitForContainer waits for a container to be healthy
func WaitForContainer(ctx context.Context, containerName string) error {
	// Check if container has health check
	output, err := RunDockerCommandBuffered(ctx, "",
		"inspect", "-f", "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}", containerName)
	if err != nil {
		return err
	}

	healthStatus := strings.TrimSpace(output)
	if healthStatus == "none" {
		// No health check, just verify it's running
		output, err = RunDockerCommandBuffered(ctx, "",
			"inspect", "-f", "{{.State.Status}}", containerName)
		if err != nil {
			return err
		}
		if strings.TrimSpace(output) != "running" {
			return fmt.Errorf("container %s is not running", containerName)
		}
		return nil
	}

	// Wait for health check to pass
	return RunDockerCommand(ctx, "", "wait", containerName)
}

// ReadDockerLogs reads logs from a container
func ReadDockerLogs(ctx context.Context, containerName string, tail int) (string, error) {
	args := []string{"logs"}
	if tail > 0 {
		args = append(args, "--tail", fmt.Sprintf("%d", tail))
	}
	args = append(args, containerName)
	return RunDockerCommandBuffered(ctx, "", args...)
}

// GetImageDigest gets the digest of an image
func GetImageDigest(ctx context.Context, imageName string) (string, error) {
	output, err := RunDockerCommandBuffered(ctx, "",
		"inspect", "-f", "{{index .RepoDigests 0}}", imageName)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(output), nil
}

// StreamCommandOutput streams command output line by line
func StreamCommandOutput(ctx context.Context, cmd *exec.Cmd, outputCallback func(string)) error {
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return err
	}

	if err := cmd.Start(); err != nil {
		return err
	}

	// Stream stdout
	go streamReader(stdout, outputCallback)

	// Stream stderr
	go streamReader(stderr, func(line string) {
		outputCallback(fmt.Sprintf("ERROR: %s", line))
	})

	return cmd.Wait()
}

func streamReader(reader io.Reader, callback func(string)) {
	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		callback(scanner.Text())
	}
}
