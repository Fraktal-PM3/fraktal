---
sidebar_position: 1
sidebar_label: Development Setup
title: Chaincode Development Setup
description: Complete guide to setting up your development environment for the distributed hash ledger project and deploy chaincode.
---

# Chaincode Development Setup

This guide provides comprehensive instructions for configuring your development environment for the distributed hash ledger project. The installation process typically requires 20-30 minutes to complete.

## Installation Overview

Upon completion of this guide, your development environment will include:

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

### Prerequisites

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

**[Official Go Installation Guide](https://golang.org/doc/install)**

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

Install nvm by following the instructions from the official repository: 
**[Official nvm Repository](https://github.com/nvm-sh/nvm)**


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

**[Official Node.js Downloads](https://nodejs.org/)**

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

**[Docker Installation Guides](https://docs.docker.com/engine/install/)**

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

**[jq Download Guide](https://stedolan.github.io/jq/download/)**

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

**[FireFly CLI Repository](https://github.com/hyperledger/firefly-cli)**

---

## Step 6: Clone the Project Repository

Clone the project and navigate to the project directory:

```bash
git clone https://github.com/Fraktal-PM3/fraktal.git
cd fraktal
```

### Initialize Project Dependencies

For the project to work correctly, install the necessary submodules:

```bash
git submodule update --init --recursive
```


---

## Step 7: Install Hyperledger Fabric Binaries and Docker Images

This step installs the Hyperledger Fabric binaries and Docker images required for the blockchain network.

:::info What Gets Installed
The installation script downloads:
- Fabric peer, orderer, and CA binaries
- Fabric Docker images (peer, orderer, CA, tools)
- Fabric samples and test network
:::

### Run Installation Script

The official Hyperledger Fabric documentation recommends installing fabric-samples in the Go workspace directory. However, for this project, we install it directly in the cloned repository using the provided 'dev.sh' script.

```bash
./dev.sh install
```

### Configure Fabric Binary Path

Make Fabric binaries accessible system-wide:

```bash
# Copy binaries to GOPATH
sudo cp -r fabric-samples/bin/* $GOPATH/bin

# Verify the peer binary is accessible
which peer
```

**Expected output:** `.../bin/peer` or similar

:::caution Permission Required
The `sudo` command is required to copy binaries to the Go bin directory. Ensure you have appropriate permissions.
:::

## Step 8: Create and Start the FireFly Stack

To run and manage a FireFly and Hyperledger Fabric stack for development, follow these steps:

### Start the Stack

To start and initialize a FireFly stack with Hyperledger Fabric, run the following command in the project root directory:

```bash
./dev.sh up
```

This command will setup two organizations with one node each by default, build and deploy the necessary chaincode, and install the custom chaincode located in 'chaincodes/package'. The custom chaincode is automatically instantiated on the network during this process and contains the necessary smart contract logic for managing packages in the distributed hash ledger.

:::info Chaincode Deployment
The `dev.sh up` script handles the deployment of the custom chaincode to the Fabric network as part of the stack initialization. It ensures that the chaincode is properly installed and instantiated on the peers of both organizations.
:::

---

### Stop the Stack

:::warning Data Persistence
Stopping the stack with `dev.sh down` will remove all running containers, networks, and volumes associated with the stack. Any data stored in the blockchain network will be lost.
:::

To stop and remove the FireFly and Hyperledger Fabric stack, run:

```bash
./dev.sh down
```

:::tip Restarting the Stack
Always run `./dev.sh down` before `./dev.sh up` to ensure a clean state when restarting the stack.
:::

---

### Accessing FireFly Services

Once the stack is running, you can access various FireFly and Fabric services through the following URLs:

#### FireFly Dashboard
The FireFly UI provides a web interface for interacting with the blockchain network:
- **Organization 1:** http://localhost:8000/ui
- **Organization 2:** http://localhost:8001/ui

The port increments by one for each additional organization.

#### FabConnect API
The FabConnect REST API provides endpoints for Hyperledger Fabric operations:
- **Organization 1:** http://localhost:5102/api
- **Organization 2:** http://localhost:5202/api

The port increments by 100 for each additional organization.

#### FireFly Sandbox
The FireFly Sandbox provides an interactive environment for testing:
- **Organization 1:** http://127.0.0.1:5108
- **Organization 2:** http://127.0.0.1:5208

The port increments by 100 for each additional organization.

#### FireFly API Documentation
The FireFly API documentation is available through the Swagger UI:
- **Organization 1:** http://localhost:8000/api
- **Organization 2:** http://localhost:8001/api

The port increments by one for each additional organization.

:::note Service Availability
All services will be available once the stack has fully initialized. This may take a few moments after running `./dev.sh up`.
:::

---

## Next Steps

You have successfully completed the development environment setup for the distributed hash ledger project.

You can now proceed to:
- Explore the FireFly applications
- Use the custom FireFly sdk to run blockchain opertations in a custom developed app

Refer to the subsequent sections in the documentation for detailed instructions on these topics.

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

<details>
<summary>Line Endings Issue</summary>
**Problem:** Errors related to unexpected tokens or carriage return characters when running `dev.sh`
```bash
./dev.sh: line 12: $'\r': command not found
./dev.sh: line 13: syntax error near unexpected token `$'in\r''
'/dev.sh: line 13: `case "${CC_LANG}" in
```

**Solution:** Convert the line endings of `dev.sh` from Windows (CRLF) to Unix (LF) format using the following command:

```bash
dos2unix dev.sh 2>&1 || sed -i 's/\r$//' dev.sh
```
</details>


---

## Additional Resources

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Hyperledger FireFly Documentation](https://hyperledger.github.io/firefly/)
- [Go Documentation](https://golang.org/doc/)
- [Docker Documentation](https://docs.docker.com/)