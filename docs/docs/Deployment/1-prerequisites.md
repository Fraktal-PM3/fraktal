---
sidebar_position: 2
sidebar_label: 1. Prerequisites
title: Prerequisites - Infrastructure Setup
description: Set up Minikube, HashiCorp Vault, and required infrastructure.
---

# Step 1: Prerequisites

This guide covers setting up the foundational infrastructure components required for the PM3 deployment.

## Hardware Requirements

Ensure your system meets these minimum requirements:

- **RAM**: Minimum 12GB available
- **CPU**: 4 cores minimum
- **Disk**: 50GB free space
- **Platform**: Linux (tested on Ubuntu)
- **Access**: Root or sudo privileges
- **Network**: Public IP address

## Setup Minikube

Start Minikube with the required resources and Kubernetes version:

```bash
minikube start --memory 12000 --cpus 4 --kubernetes-version=1.23.1 --apiserver-ips=<YOUR_PUBLIC_IP>
```

Replace `<YOUR_PUBLIC_IP>` with your server's public IP address.

### Setup HAProxy Nginx Proxy

Run the following command to enable external access to the Minikube API server:

```bash
docker run -d --network minikube -p 18443:18443 chevdor/nginx-minikube-proxy
```

This proxy allows external connections to reach the Minikube cluster on port 18443.

## Setup HashiCorp Vault

Create a development Vault instance using Docker Compose for secrets management.

### Create Vault Directory

```bash
mkdir -p ~/vault
cd ~/vault
```

### Create docker-compose.yml

Create a file at `~/vault/docker-compose.yml` with the following content:

```yaml
version: "3.8"

services:
  vault:
    image: hashicorp/vault:1.15.2
    container_name: vault-dev
    ports:
      - "8200:8200" # Vault UI/API
      - "8201:8201" # Vault Raft cluster port
    environment:
      - "VAULT_DEV_ROOT_TOKEN_ID=mydevroot"
      - "VAULT_ADDR=http://0.0.0.0:8200"
    cap_add:
      - IPC_LOCK
    command: vault server -dev -dev-listen-address="0.0.0.0:8200"
```

### Start Vault

```bash
docker-compose up -d
```

### Configure Vault

After starting Vault, configure it to enable the secrets engine:

```bash
# Export Vault address (replace with your Vault's local IP address)
export VAULT_ADDR='http://<YOUR_VAULT_IP>:8200'

# Export Vault token (should match VAULT_DEV_ROOT_TOKEN_ID from docker-compose.yml)
export VAULT_TOKEN="mydevroot"

# Enable Secrets v2 at the secretsv2 path
vault secrets enable -version=2 -path=secretsv2 kv
```


:::warning Development Only
This is a development-only configuration. For production deployments, use a properly configured and sealed Vault instance with secure authentication.
:::

## Verify Infrastructure

### Check Minikube

```bash
# Check cluster status
minikube status

# Verify kubectl connectivity
kubectl cluster-info
kubectl get nodes
```

### Check Vault

```bash
# Verify Vault is accessible
curl http://<YOUR_VAULT_IP>:8200/v1/sys/health

# Check secrets engine
vault secrets list
```

You should see `secretsv2/` in the list of enabled secrets engines.

### Check Nginx Proxy

```bash
# Verify the proxy is running
docker ps | grep nginx-minikube-proxy
```

## Next Steps

Once your infrastructure is set up and verified, proceed to [Repository Setup](./2-repository-setup.md) to clone and configure the Bevel repository.
