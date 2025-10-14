---
sidebar_position: 1
sidebar_label: Installation
authors: [hedlund01]
---

# Installation Guide

This guide will help you set up the development environment for our distributed hash ledger project. Follow these steps carefully to ensure a proper installation.

## Prerequisites

:::warning Supported Platforms
This installation guide has been tested and verified on **Ubuntu** and **WSL2 with Ubuntu**. macOS support is not yet tested.
:::

Before starting, ensure you have a Unix-like environment (Linux or WSL2 on Windows with Ubuntu).

## Step 1: Install Go Language

For detailed installation instructions, visit the [official Go installation guide](https://golang.org/doc/install).

## Step 2: Install jq (JSON processor)

For more installation options, see the [jq documentation](https://stedolan.github.io/jq/download/).

```bash
sudo apt update
sudo apt install jq -y

# Verify installation
jq --version
```

## Step 3: Install OpenSSL

OpenSSL is usually pre-installed on Ubuntu. For more information, visit the [OpenSSL documentation](https://www.openssl.org/source/).

```bash
sudo apt update
sudo apt install openssl -y

# Verify installation
openssl version
```

## Step 4: Install Docker and Docker Compose

:::warning
Docker is required to run the Hyperledger Fabric network and FireFly containers.
:::

Please follow the official Docker installation guide for your platform:

- **Ubuntu/Debian**: [Docker Engine installation for Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- **WSL2**: [Docker Desktop WSL2 backend](https://docs.docker.com/desktop/wsl/)

After installation, make sure to:

1. Add your user to the docker group: `sudo usermod -aG docker $USER`
2. Log out and back in (or run `newgrp docker`)
3. Verify installation:

```bash
# Verify Docker installation
docker --version
docker compose version

# Test Docker (should run without sudo)
docker run hello-world
```

## Step 5: Install Hyperledger FireFly CLI

For more information, visit the [FireFly CLI repository](https://github.com/hyperledger/firefly-cli).

```bash
# Install firefly-cli using Go
go install github.com/hyperledger/firefly-cli/ff@latest
```

## Step 6: Add Go bin to PATH

The Go bin directory needs to be in your PATH to run the `ff` command:

```bash
# Add Go bin to PATH (if not already done in Step 1)
echo 'export PATH=$PATH:$(go env GOPATH)/bin' >> ~/.bashrc

# Reload your shell configuration
source ~/.bashrc

# Verify firefly-cli is accessible
ff version
```

## Step 7: Install Project Prerequisites

Navigate to the project directory and run the installation script:

```bash
# Navigate to project directory (adjust path to your project location)
cd $HOME/code/fraktal

# Make the script executable
chmod +x dev.sh

# Run the installation
./dev.sh install
```

## Step 8: Start the Development Environment

After successful installation, start the development environment:

```bash
# Start both Fabric network and FireFly containers
./dev.sh up

# Or start them separately:
./dev.sh up fabric     # Start only Fabric network
./dev.sh up firefly    # Start only FireFly containers
```

## Common Commands

```bash
# Deploy chaincode
./dev.sh deploycc

# Stop everything
./dev.sh down

# Restart network
./dev.sh restart

# Get help
./dev.sh --help
```

## Next Steps

Once installation is complete, you can:

- Access the FireFly UI at `http://localhost:8000/ui`
- Deploy and test chaincodes using `./dev.sh deploycc`
- Explore the API documentation
- Start developing your distributed applications

For development workflows and API usage, see the main project documentation.


# Troubleshooting Common Installation Issues
## Troubleshooting Tips

1. **Ensure Docker is running** before starting the network - this is critical!
2. **Always run `./dev.sh down` before `./dev.sh up`** if you encounter certificate-related errors
3. **Check container health** - make sure all the containers are running and don't have any errors
4. **Clean restart**: If things get stuck, run `./dev.sh down`, wait a moment, then `./dev.sh up`
5. **Docker permissions**: If you get permission errors, ensure your user is in the docker group and restart your terminal

## Issue: Peer cannot init crypto - MSP path does not exist

If you encounter this error:

```bash
Cannot run peer because cannot init crypto, specified path "$HOME/code/fraktal/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" does not exist or cannot be accessed
```

**Solution:**

```bash
# Navigate to the test network directory
cd fabric-samples/test-network

# Clean up existing certificates and network state
./network.sh down

# Remove certificate directories (they will be regenerated)
rm -rf organizations/peerOrganizations organizations/ordererOrganizations

# Start fresh with certificate generation
./network.sh up createChannel -ca

./network.sh down

# Go back to project root
cd ../..

# Now try starting the development environment
./dev.sh up
```

:::info Why this happens
This error occurs because certificate directories need to be empty when starting fresh. The scripts generate new certificates for peer organizations and orderer organizations, but sometimes old certificate remnants can cause conflicts.
:::