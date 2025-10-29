---
sidebar_position: 1
sidebar_label: Development Setup
title: Chaincode Development Setup
description: Complete guide to setting up your development environment for the distributed hash ledger project
---

# Chaincode Development Setup

This guide walks you through setting up your complete development environment for the distributed hash ledger project. The installation process takes approximately 20-30 minutes.

## What You'll Install

By the end of this guide, you'll have:

- **Go** (v1.20+) - Primary programming language
- **Node.js** (v24.11.0) - JavaScript runtime for chaincode development
- **Docker & Docker Compose** - Container runtime for Hyperledger Fabric and FireFly
- **Hyperledger Fabric** - Blockchain framework with binaries and Docker images
- **Hyperledger FireFly** - Blockchain orchestration layer
- **Supporting tools** - jq, OpenSSL, and project dependencies

---

## System Requirements

:::warning Platform Support
This installation guide has been tested and verified on:
- **Ubuntu 20.04 LTS** or later
- **WSL2 with Ubuntu**

macOS support is currently untested but should work with minor adjustments.
:::

### Before You Begin

Ensure you have:
- A Unix-like environment (Linux or WSL2 on Windows)
- Administrator/sudo access
- Stable internet connection
- Basic familiarity with the command line

---

## Step 1: Install Go

Go version 1.20 or later is required for building and running the project components.

### Installation

Follow the official installation guide for your operating system:

**[📚 Official Go Installation Guide](https://golang.org/doc/install)**

### Verify Installation

After installation, verify Go is correctly installed and configure your PATH:

```bash
# Check Go version
go version

# Add Go bin to your PATH
echo 'export PATH=$PATH:$(go env GOPATH)/bin' >> ~/.bashrc
source ~/.bashrc
```

:::tip PATH Configuration
The Go bin directory (`$(go env GOPATH)/bin`) must be in your PATH to run Go-installed binaries like the FireFly CLI.
:::

### Configure GOPATH

Ensure the `GOPATH` environment variable is set in your shell configuration:

```bash
# Add to ~/.bashrc or ~/.zshrc
export GOPATH=$(go env GOPATH)

# Apply changes
source ~/.bashrc
```

---

## Step 2: Install Node.js

Node.js is required for developing and running JavaScript/TypeScript-based chaincode. We recommend using Node.js version 24.11.0 for compatibility with the project.

### Installation Options

You can install Node.js using one of the following methods:

#### Option 1: Using Node Version Manager (nvm) - Recommended

nvm allows you to install and manage multiple Node.js versions easily.

**Install nvm:**
```bash
# Download and install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Load nvm into your current shell session
source ~/.bashrc
```

**Install Node.js 24.11.0:**
```bash
# Install the recommended version
nvm install 24.11.0

# Set it as the default version
nvm use 24.11.0
nvm alias default 24.11.0
```

:::tip Why nvm?
Using nvm allows you to switch between different Node.js versions for different projects. This is particularly useful if you work on multiple blockchain or JavaScript projects.
:::

#### Option 2: Using Official Installer

Download and install Node.js directly from the official website:

**[📚 Official Node.js Downloads](https://nodejs.org/)**

Select version 24.11.0 from the downloads page for your operating system.

#### Option 3: Using Package Manager

**Ubuntu/Debian:**
```bash
# Install Node.js 24.x using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**macOS (using Homebrew):**
```bash
brew install node@24
```

### Verify Installation

After installation, verify Node.js and npm are correctly installed:

```bash
# Check Node.js version
node --version
# Should output: v24.11.0 (or similar)

# Check npm version
npm --version
```

:::note npm Included
npm (Node Package Manager) is automatically installed with Node.js. You'll use it to manage chaincode dependencies.
:::

---

## Step 3: Install Docker and Docker Compose

Docker and Docker Compose are essential for running Hyperledger Fabric and FireFly containers.

### Installation

Follow the official Docker installation guide for your platform:

**[📚 Docker Installation Guides](https://docs.docker.com/engine/install/)**

**Quick links for common platforms:**
- [Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Debian](https://docs.docker.com/engine/install/debian/)
- [Fedora](https://docs.docker.com/engine/install/fedora/)
- [WSL2](https://docs.docker.com/desktop/wsl/)
- [macOS](https://docs.docker.com/desktop/install/mac-install/)

### Post-Installation Setup

Configure Docker to run without sudo:

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Apply the new group membership
newgrp docker
```

:::note Group Changes
You may need to log out and log back in for the group changes to take effect.
:::

### Verify Installation

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker compose version

# Test Docker installation
docker run hello-world
```

If the hello-world container runs successfully, Docker is properly configured.

---

## Step 4: Install Supporting Tools

The project requires jq (JSON processor) and OpenSSL for various operations.

### jq - JSON Processor

jq is used for parsing and manipulating JSON data in scripts.

**Installation:** Use your system's package manager

```bash
# Ubuntu/Debian
sudo apt-get install jq

# Fedora
sudo dnf install jq

# macOS
brew install jq
```

**[📚 jq Download Guide](https://stedolan.github.io/jq/download/)**

**Verify:**
```bash
jq --version
```

### OpenSSL - Cryptographic Operations

OpenSSL handles cryptographic operations and certificate generation.

**Installation:** Usually pre-installed on Unix-like systems. If needed:

```bash
# Ubuntu/Debian
sudo apt-get install openssl

# Fedora
sudo dnf install openssl

# macOS (via Homebrew)
brew install openssl
```

**Verify:**
```bash
openssl version
```

---

## Step 5: Install Hyperledger FireFly CLI

The FireFly CLI manages the FireFly blockchain orchestration layer.

### Installation

```bash
# Install using Go
go install github.com/hyperledger/firefly-cli/ff@latest

# Reload your shell configuration
source ~/.bashrc

# Verify installation
ff version
```

### Troubleshooting

If `ff version` returns "command not found":

```bash
# Check if Go bin is in your PATH
echo $PATH | grep "$(go env GOPATH)/bin"

# If not present, add it again
echo 'export PATH=$PATH:$(go env GOPATH)/bin' >> ~/.bashrc
source ~/.bashrc
```

**[📚 FireFly CLI Repository](https://github.com/hyperledger/firefly-cli)**

---

## Step 6: Clone the Project Repository

Clone the project and navigate to the project directory:

```bash
git clone https://github.com/Fraktal-PM3/fraktal.git
cd fraktal
```

---

## Step 7: Install Hyperledger Fabric

This step installs the Hyperledger Fabric binaries and Docker images required for the blockchain network.

:::info What Gets Installed
The installation script downloads:
- Fabric peer, orderer, and CA binaries
- Fabric Docker images (peer, orderer, CA, tools)
- Fabric samples and test network
:::

### Run Installation Script

The official Hyperledger Fabric documentation recommends installing fabric-samples in the Go workspace directory.

```bash
./install-fabric.sh
```

:::tip Version Selection
By default, this installs the latest stable version. To install a specific version:

```bash
./install-fabric.sh --fabric-version 2.5.0
```
:::

### Configure Fabric Binary Path

Make Fabric binaries accessible system-wide:

```bash
# Copy binaries to GOPATH
sudo cp -r fabric-samples/bin/* $GOPATH/bin

# Verify the peer binary is accessible
which peer
```

**Expected output:** `/home/youruser/go/bin/peer` or similar

:::caution Permission Required
The `sudo` command is required to copy binaries to the Go bin directory. Ensure you have appropriate permissions.
:::

---

## Verify Your Installation

Run these commands to verify all components are installed correctly:

```bash
# Go
go version

# Node.js
node --version

# npm
npm --version

# Docker
docker --version
docker compose version

# jq
jq --version

# OpenSSL
openssl version

# FireFly CLI
ff version

# Hyperledger Fabric
peer version
```

All commands should return version information without errors.

---

## Next Steps

🎉 Congratulations! You've successfully set up the development environment for the distributed hash ledger project.

You can now proceed to:
- Configure your first blockchain network
- Deploy chaincode to the network
- Explore the sample applications

Check the next sections in the documentation for detailed instructions on these topics.

---

## Troubleshooting

<details>
<summary>Common Issues and Solutions</summary>

### Docker permission denied

**Problem:** `permission denied while trying to connect to the Docker daemon socket`

**Solution:**
```bash
sudo usermod -aG docker $USER
newgrp docker
```
Log out and back in if the error persists.

### Go command not found

**Problem:** `go: command not found` after installation

**Solution:**
```bash
# Check Go is installed
ls -la /usr/local/go/bin/go

# Add to PATH
export PATH=$PATH:/usr/local/go/bin
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
```

### FireFly CLI not found

**Problem:** `ff: command not found` after installation

**Solution:**
```bash
# Ensure GOPATH bin is in PATH
export PATH=$PATH:$(go env GOPATH)/bin
echo 'export PATH=$PATH:$(go env GOPATH)/bin' >> ~/.bashrc
source ~/.bashrc
```

### Node.js version mismatch

**Problem:** Wrong Node.js version installed or `node: command not found`

**Solution:**
```bash
# If using nvm
nvm install 24.11.0
nvm use 24.11.0
nvm alias default 24.11.0

# Verify version
node --version

# If nvm not installed, install it first
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
```

### npm permission errors

**Problem:** Permission errors when installing global npm packages

**Solution:**
```bash
# Configure npm to use a custom global directory
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

</details>

---

## Additional Resources

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Hyperledger FireFly Documentation](https://hyperledger.github.io/firefly/)
- [Go Documentation](https://golang.org/doc/)
- [Docker Documentation](https://docs.docker.com/)