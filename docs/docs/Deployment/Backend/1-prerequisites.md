---
sidebar_position: 2
sidebar_label: 1. Prerequisites
title: Prerequisites - Infrastructure Setup
description: Set up Minikube, HashiCorp Vault, and required infrastructure.
---

# Step 1: Prerequisites

:::danger Development Only - Not Production Ready
This setup is intended for **development and testing purposes only** and is **NOT production ready**.

**Important considerations:**
- Some values are hardcoded for this specific use case
- Only **Hyperledger Fabric** has been tested with this configuration
- This guide is based on a fork of Hyperledger Bevel with custom modifications

**Expected Ansible Errors:** As noted in the [official Bevel documentation](https://hyperledger-bevel.readthedocs.io/en/latest/tutorials/bevel-minikube-setup/#execute-provisioning-script):
> "There will be errors in Ansible playbook, but if they are ignored, then that is expected behaviour."

Do not use this configuration in a production environment without proper security hardening and review.
:::

This guide covers setting up the foundational infrastructure components required for the PM3 deployment.

## Hardware Requirements

This guide was tested on a system with the following specifications:

- **RAM**: 16GB available
- **CPU**: 8 cores
- **Disk**: 50GB free space
- **Platform**: Linux (Ubuntu)
- **Access**: Root or sudo privileges
- **Network**: Public IP address

---

## Install Node.js and ajv-cli

Node.js is required for running the `ajv-cli` tool, which validates the network configuration file. Follow the official installation guide for your operating system:

- **Official Installation Guide**: https://nodejs.org/en/download/

After installing Node.js, install the ajv-cli package globally:

```bash
npm install -g ajv-cli
```

Verify the installations:

```bash
node --version
ajv --version
```

---

## Install Python3

Python3 is required for Ansible and other deployment tools. Follow the official installation guide for your operating system:

- **Official Installation Guide**: https://www.python.org/downloads/

Verify the installation:

```bash
python3 --version
```

---

## Install Ansible

Ansible is required for running the deployment playbooks. Follow the official installation guide for your operating system:

- **Official Installation Guide**: https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html

After installation, verify Ansible is installed correctly:

```bash
ansible --version
```

After installing Ansible, install the required Python libraries:

```bash
pip3 install kubernetes openshift
```

---

## Install Unzip

The `unzip` utility is required by Ansible to extract archives during deployment.

```bash
apt install -y unzip
```

Verify the installation:

```bash
unzip -v
```

---

## Install Docker

Docker is required for running containers and is used by Minikube. Follow the official installation guide for your operating system:

- **Official Installation Guide**: https://docs.docker.com/engine/install/

After installation, verify Docker is installed correctly:

```bash
docker --version
```

## Install Minikube

Before proceeding, you need to have Minikube installed on your machine. Follow the official installation guide for your operating system:

- **Official Installation Guide**: https://minikube.sigs.k8s.io/docs/start/

After installation, verify Minikube is installed correctly:

```bash
minikube version
```

## Setup Minikube

Start Minikube with the required resources and Kubernetes version:

```bash
minikube start --memory 12000 --cpus 6 --kubernetes-version=1.28 --apiserver-ips=<YOUR_PUBLIC_IP>
```

Replace `<YOUR_PUBLIC_IP>` with your server's public IP address.

### Setup HAProxy Nginx Proxy

Run the following command to enable external access to the Minikube API server:

```bash
docker run -d --network minikube -p 18443:18443 chevdor/nginx-minikube-proxy
```

This proxy allows external connections to reach the Minikube cluster on port 18443.

:::tip Kubernetes Dashboard Access
If you want to access the Kubernetes dashboard remotely, run the following commands in two separate terminal windows:

**Terminal 1:**
```bash
minikube kubectl -- proxy --address='0.0.0.0' --port=8001 --accept-hosts='.*'
```

**Terminal 2:**
```bash
minikube tunnel
```

The dashboard will be accessible at:
```
http://<YOUR_PUBLIC_IP>:8001/api/v1/namespaces/kubernetes-dashboard/services/http:kubernetes-dashboard:/proxy/#/workloads?namespace=_all
```
:::

## Setup HashiCorp Vault

Create a development Vault instance using Docker Compose for secrets management.

### Install Vault CLI

The Vault CLI is required to configure the Vault server. Follow the official installation guide for your operating system:

- **Official Installation Guide**: https://developer.hashicorp.com/vault/install

After installation, verify Vault CLI is installed correctly:

```bash
vault version
```

### Create Vault Directory

```bash
mkdir -p ~/vault
cd ~/vault
```

### Create compose.yml

Create a file at `~/vault/compose.yml` with the following content:

```yaml title="~/vault/compose.yml"
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

### Connect Vault to Minikube Network

Vault uses Kubernetes authentication to validate service account JWT tokens. This requires Vault to communicate with the Kubernetes API server. Since both Vault and minikube run in separate Docker networks, you must connect them:

```bash
docker network connect minikube vault-dev
```

#### Why This Is Needed

| Component | Docker Network | IP Range |
|-----------|----------------|----------|
| Vault | vault_default | 172.18.0.0/16 |
| Minikube | minikube | 192.168.49.0/24 |

Without connecting the networks, Vault cannot reach the Kubernetes API at `https://192.168.49.2:8443` to validate JWT tokens during the Kubernetes auth flow.

#### Verify Connectivity

After connecting the networks, verify Vault can reach the Kubernetes API:

```bash
docker exec vault-dev wget -q -O - --no-check-certificate \
  https://192.168.49.2:8443/version
```

You should see the Kubernetes version JSON response.

### Configure Vault

:::warning Development Only
This is a development-only configuration. For production deployments, use a properly configured and sealed Vault instance with secure authentication.
:::

After starting Vault, configure it to enable the secrets engine:

```bash
# Export Vault address (replace with your Vault's local IP address)
export VAULT_ADDR='http://<YOUR_VAULT_IP>:8200'

# Export Vault token (should match VAULT_DEV_ROOT_TOKEN_ID from compose.yml)
export VAULT_TOKEN="mydevroot"

# Enable Secrets v2 at the secretsv2 path
vault secrets enable -version=2 -path=secretsv2 kv

# Verify the secrets engine is enabled
vault secrets list
```

You should see `secretsv2/` in the output:

```
Path          Type         Accessor              Description
----          ----         --------              -----------
cubbyhole/    cubbyhole    cubbyhole_xxxxxxxx    per-token private secret storage
identity/     identity     identity_xxxxxxxx     identity store
secret/       kv           kv_xxxxxxxx           key/value secret storage
secretsv2/    kv           kv_xxxxxxxx           n/a
sys/          system       system_xxxxxxxx       system endpoints used for control, policy and debugging
```


#### Verify Vault Network Configuration

Check which networks Vault is connected to:

```bash
docker inspect vault-dev --format '{{json .NetworkSettings.Networks}}' | jq
```

Vault should be connected to both `vault_default` and `minikube` networks.

#### Check Vault Kubernetes Auth Configuration

Verify the Kubernetes auth method is properly configured:

```bash
# List auth methods
curl -s -H "X-Vault-Token: mydevroot" \
  http://192.168.49.1:8200/v1/sys/auth | jq
```

The `kubernetes_host` should point to `https://192.168.49.2:8443`.


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
curl $VAULT_ADDR/v1/sys/health
```

You should receive a JSON response indicating the health status of the Vault server.

### Check Nginx Proxy

```bash
# Verify the proxy is running
docker ps | grep nginx-minikube-proxy
```

## Next Steps

Once your infrastructure is set up and verified, proceed to [Repository Setup](./2-repository-setup.md) to clone and configure the Bevel repository.
