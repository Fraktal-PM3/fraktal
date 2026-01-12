---
sidebar_position: 3
sidebar_label: 2. Repository Setup
title: Repository Setup
description: Clone and configure the Bevel repository for deployment.
---

# Step 2: Repository Setup

This guide covers cloning the PM3 fork of Hyperledger Bevel and setting up the build directory structure.

## Configure Git

First, ensure your Git configuration is set up:

```bash
# Configure your Git identity
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

## Clone Bevel Repository

Clone the [PM3 fork of Hyperledger Bevel](https://github.com/Fraktal-PM3/bevel-fixes) and set up a local branch for deployment.

```bash
cd ~
git clone https://github.com/Fraktal-PM3/bevel-fixes.git
cd bevel-fixes

# Get the latest code from main branch
git checkout main
git pull

# Create a local deployment branch
git checkout -b local

# Push the local branch to remote
git push --set-upstream origin local
```

:::tip Why Use a Local Branch?
Using a separate `local` branch allows you to:
- Keep your deployment configurations separate from the main branch
- Track your custom changes without affecting the upstream repository
- Easily reset or update your deployment configuration
:::

## Create Build Directory Structure

Create the build directory inside the cloned repository. This directory will contain all configuration files:

```bash
# Make sure you're in the bevel-fixes repository directory
cd ~/bevel-fixes

# Create the build directory
mkdir -p build
cd build
```

## Copy Minikube Certificates

Copy the required Kubernetes certificates to the build directory:

```bash
cp ~/.minikube/ca.crt .
cp ~/.minikube/profiles/minikube/client.key .
cp ~/.minikube/profiles/minikube/client.crt .
```

## Copy Kubernetes Config

```bash
cp ~/.kube/config .
```

## Verify Files

Check that all required files are in the build directory:

```bash
ls -la ~/bevel-fixes/build/
```

You should see:
- `ca.crt`
- `client.key`
- `client.crt`
- `config`

## Directory Structure

After this step, your directory structure should look like:

```
~/bevel-fixes/
├── build/
│   ├── ca.crt
│   ├── client.crt
│   ├── client.key
│   └── config
├── platforms/
│   ├── hyperledger-fabric/
│   ├── firefly/
│   └── shared/
├── run.sh
├── create-channels.sh
├── install-chaincode.sh
├── deploy-firefly.sh
└── reset.sh
```

## Next Steps

Now that the repository is set up, proceed to [Configuration](./3-configuration.md) to create and customize your deployment configuration files.
