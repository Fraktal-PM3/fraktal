---
sidebar_position: 1
sidebar_label: Installation
title: Installation Guide
description: Complete guide to setting up the development environment for the distributed hash ledger project
---

# Installation Guide

This guide walks you through setting up the complete development environment for the distributed hash ledger project. The installation process takes approximately 20-30 minutes.

## Overview

You'll install the following components:

- **Go** - Primary programming language
- **Docker & Docker Compose** - Container runtime for Hyperledger Fabric and FireFly
- **Hyperledger Fabric** - Blockchain framework (binaries and Docker images)
- **Hyperledger FireFly** - Blockchain orchestration layer
- **Supporting tools** - jq, OpenSSL, and project dependencies

## Prerequisites

### System Requirements

:::warning Platform Support
This installation guide has been tested and verified on:
- **Ubuntu 20.04 LTS** or later
- **WSL2 with Ubuntu**

macOS support is currently untested but should work with minor adjustments.
:::

### Before You Begin

Ensure you have:
- A Unix-like environment (Linux or WSL2 on Windows with Ubuntu)
- Administrator/sudo access
- Stable internet connection

---

## Installation Steps

### 1. Install Go

Go version 1.20 or later is required for building and running the project components.

Please follow the official installation guide for your operating system:

**📚 [Official Go Installation Guide](https://golang.org/doc/install)**

After installation, verify Go is correctly installed:

```bash
# Verify installation
go version

# Ensure Go bin is in your PATH
echo 'export PATH=$PATH:$(go env GOPATH)/bin' >> ~/.bashrc
source ~/.bashrc
```

:::tip
The Go bin directory (`$(go env GOPATH)/bin`) must be in your PATH to run Go-installed binaries like the FireFly CLI.
:::

---

### 2. Install Docker and Docker Compose

Docker and Docker Compose are essential for running Hyperledger Fabric and FireFly containers.

Please follow the official Docker installation guide for your operating system:

**📚 [Docker Installation Guides](https://docs.docker.com/engine/install/)**

Common platforms:
- [Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Debian](https://docs.docker.com/engine/install/debian/)
- [Fedora](https://docs.docker.com/engine/install/fedora/)
- [WSL2](https://docs.docker.com/desktop/wsl/)
- [macOS](https://docs.docker.com/desktop/install/mac-install/)

#### Post-Installation Configuration

After installing Docker, ensure your user can run Docker commands without sudo:

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Apply the new group membership (or log out and back in)
newgrp docker
```

#### Verify Installation

```bash
# Verify Docker and Docker Compose are installed
docker --version
docker compose version

# Test Docker
docker run hello-world
```

---

### 3. Install Supporting Tools

The project requires jq (JSON processor) and OpenSSL. These are typically available through your system's package manager.

#### jq

jq is used for parsing and manipulating JSON data in scripts.

**Installation:** Use your package manager (apt, yum, dnf, brew, etc.)

**📚 [jq Download Guide](https://stedolan.github.io/jq/download/)**

Verify installation:
```bash
jq --version
```

#### OpenSSL

OpenSSL is used for cryptographic operations and certificate generation.

**Installation:** Usually pre-installed on most Unix-like systems. If not, use your package manager.

**📚 [OpenSSL Documentation](https://www.openssl.org/source/)**

Verify installation:
```bash
openssl version
```

---

### 4. Install Hyperledger Fabric

This step installs the Hyperledger Fabric binaries and Docker images required for the blockchain network.

:::info What Gets Installed
- Fabric peer, orderer, and CA binaries
- Fabric Docker images (peer, orderer, CA, tools)
- Fabric samples and test network
:::

The official Hyperledger Fabric documentation recommends installing fabric-samples in the Go workspace directory. Follow these steps:

```bash
# Create the recommended directory structure for Go projects
mkdir -p $HOME/go/src/github.com/<your_github_userid>
cd $HOME/go/src/github.com/<your_github_userid>

# Download the install script
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh

# Install Docker images and binaries
# This downloads ~2GB of Docker images and may take several minutes
./install-fabric.sh docker binary

# Add Fabric binaries to PATH
echo 'export PATH=$PATH:$HOME/go/src/github.com/<your_github_userid>/bin' >> ~/.bashrc
source ~/.bashrc
```

:::tip Version Selection
By default, this installs the latest stable version. To install a specific version:
```bash
./install-fabric.sh --fabric-version 2.5.0 docker binary
```
:::

:::note Directory Note
Replace `<your_github_userid>` with your GitHub username, or use any identifier. For example: `$HOME/go/src/github.com/myusername`

While this is the Go community recommendation, you can install fabric-samples in any directory. The important part is remembering where you installed it, as you'll need to reference this path in your project configuration.
:::

**📚 More Info:** [Hyperledger Fabric Installation Guide](https://hyperledger-fabric.readthedocs.io/en/latest/install.html)

---

### 5. Install Hyperledger FireFly CLI

FireFly CLI manages the FireFly blockchain orchestration layer.

```bash
# Install firefly-cli using Go
go install github.com/hyperledger/firefly-cli/ff@latest

# Verify installation (may require sourcing bashrc again)
source ~/.bashrc
ff version
```

:::note Troubleshooting
If `ff version` returns "command not found", ensure your Go bin directory is in your PATH:
```bash
echo $PATH | grep "$(go env GOPATH)/bin"
```
If it's not there, run:
```bash
echo 'export PATH=$PATH:$(go env GOPATH)/bin' >> ~/.bashrc
source ~/.bashrc
```
:::

**📚 More Info:** [FireFly CLI Repository](https://github.com/hyperledger/firefly-cli)

---

### 6. Install Project Dependencies

Now install the project-specific dependencies and configuration. This project is separate from the fabric-samples installation.

```bash
# Create and navigate to project directory
mkdir -p $HOME/fraktal
cd $HOME/fraktal

# Clone or initialize your project here (adjust as needed for your setup)
# git clone <your-project-repo> .

# Make the development script executable
chmod +x dev.sh

# Run the installation script
./dev.sh install
```

:::info What This Does
- Configures Fabric network parameters
- Sets up FireFly integration
- Installs chaincode dependencies
- Prepares the development environment
- Links to your Hyperledger Fabric installation
:::

---

## Starting the Development Environment

After successful installation, start the development environment:

### Start Everything

```bash
# Start both Fabric network and FireFly containers
./dev.sh up
```

### Start Components Separately

```bash
# Start only Fabric network
./dev.sh up fabric

# Start only FireFly containers
./dev.sh up firefly
```

### Verify Everything is Running

```bash
# Check container status
docker ps

# You should see containers for:
# - Fabric peers (peer0.org1, peer0.org2)
# - Fabric orderer
# - Fabric CAs
# - FireFly nodes
```

---

## Common Commands

```bash
# Deploy chaincode to the network
./dev.sh deploycc

# Stop all containers
./dev.sh down

# Restart the entire network
./dev.sh restart

# Get help
./dev.sh --help
```

---

## Troubleshooting

### Common Issues

<details>
<summary><strong>Docker permission denied errors</strong></summary>

**Problem:** Cannot connect to Docker daemon

**Solution:**
```bash
# Ensure your user is in the docker group
sudo usermod -aG docker $USER

# Log out and back in, or run
newgrp docker

# Test Docker access
docker run hello-world
```
</details>

<details>
<summary><strong>MSP path does not exist error</strong></summary>

**Problem:** 
```
Cannot init crypto, specified path does not exist or cannot be accessed
```

**Solution:**
```bash
# Navigate to your fabric-samples test network
# (adjust path if you installed in a different location)
cd $HOME/go/src/github.com/<your_github_userid>/fabric-samples/test-network

# Clean up existing state
./network.sh down

# Remove old certificates
rm -rf organizations/peerOrganizations organizations/ordererOrganizations

# Regenerate certificates
./network.sh up createChannel -ca
./network.sh down

# Return to project directory and restart
cd $HOME/fraktal
./dev.sh up
```

**Why this happens:** Old certificate remnants can conflict with new certificate generation.
</details>

<details>
<summary><strong>Containers won't start or keep restarting</strong></summary>

**Problem:** Containers in restart loop or fail to start

**Solution:**
```bash
# Stop everything cleanly
./dev.sh down

# Wait a moment for cleanup
sleep 5

# Check if any containers are still running
docker ps -a

# Remove any stuck containers (if needed)
docker rm -f $(docker ps -aq)

# Start fresh
./dev.sh up
```
</details>

<details>
<summary><strong>Port already in use errors</strong></summary>

**Problem:** Cannot start container because port is already allocated

**Solution:**
```bash
# Find what's using the port (e.g., port 8000)
sudo lsof -i :8000

# Kill the process using the port
sudo kill -9 <PID>

# Or stop all containers
./dev.sh down
```
</details>

<details>
<summary><strong>"ff: command not found"</strong></summary>

**Problem:** FireFly CLI not found after installation

**Solution:**
```bash
# Verify Go bin is in PATH
echo $PATH | grep "$(go env GOPATH)/bin"

# If not, add it
echo 'export PATH=$PATH:$(go env GOPATH)/bin' >> ~/.bashrc
source ~/.bashrc

# Reinstall FireFly CLI
go install github.com/hyperledger/firefly-cli/ff@latest
```
</details>

### Best Practices

1. **Always ensure Docker is running** before starting the network
2. **Clean restart procedure**: Run `./dev.sh down` before `./dev.sh up` if encountering errors
3. **Check container health**: Use `docker ps` to verify all containers are running
4. **Review logs**: Use `docker logs <container-name>` for debugging
5. **Keep Docker images updated**: Periodically pull latest images with `docker pull`

---

## Additional Resources

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Hyperledger FireFly Documentation](https://hyperledger.github.io/firefly/)
- [Docker Documentation](https://docs.docker.com/)
- [Go Documentation](https://golang.org/doc/)
