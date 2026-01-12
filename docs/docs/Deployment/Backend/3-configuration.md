---
sidebar_position: 4
sidebar_label: 3. Configuration
title: Configuration Files
description: Create and customize deployment configuration files.
---

# Step 3: Configuration

This guide covers creating and customizing all configuration files needed for deployment.

## Configure Kubernetes Config File

Edit the `build/config` file to update paths and IP addresses.

Open `build/config` and modify the following:

1. Update all certificate paths from `/path/to/your/` to your local path
2. Update the server IP from `https://YOUR_PUBLIC_IP:18443` to your public IP with port 18443

Example config structure:

```yaml
apiVersion: v1
clusters:
- cluster:
    certificate-authority: /path/to/your/bevel-fixes/build/ca.crt
    server: https://YOUR_PUBLIC_IP:18443
  name: minikube
contexts:
- context:
    cluster: minikube
    namespace: default
    user: minikube
  name: minikube
current-context: minikube
kind: Config
preferences: {}
users:
- name: minikube
  user:
    client-certificate: /path/to/your/bevel-fixes/build/client.crt
    client-key: /path/to/your/bevel-fixes/build/client.key
```

## Create Network Configuration

Create the main network configuration file at `build/network.yaml`.

:::tip
This file defines the entire Hyperledger Fabric network topology, organizations, peers, orderers, channels, and chaincode configurations.
:::

### Full network.yaml Template

Create `build/network.yaml` with the following complete template. Make sure to replace all placeholder values with your actual configuration.

```yaml
##############################################################################################
#  Copyright Accenture. All Rights Reserved.
#
#  SPDX-License-Identifier: Apache-2.0
##############################################################################################

---
network:
  type: fabric
  version: 2.5.4

  # Environment configuration
  env:
    type: "local"
    proxy: haproxy
    proxy_external_ip: "YOUR_PUBLIC_IP"
    retry_count: 50
    external_dns: enabled
    external_dns_provider: cloudflare
    external_dns_policy: sync
    cloudflare_proxied: "false"
    annotations:
      service:
        - example1: example2
      deployment: {}
      pvc: {}

  docker:
    url: "ghcr.io/hyperledger"

  # RAFT consensus configuration
  consensus:
    name: raft

  orderers:
    - orderer:
      type: orderer
      name: orderer1
      org_name: pm3org
      uri: orderer1.pm3org-net.YOUR_DOMAIN:443
    - orderer:
      type: orderer
      name: orderer2
      org_name: pm3org
      uri: orderer2.pm3org-net.YOUR_DOMAIN:443
    - orderer:
      type: orderer
      name: orderer3
      org_name: pm3org
      uri: orderer3.pm3org-net.YOUR_DOMAIN:443

  # Channel configuration
  channels:
    - channel:
      consortium: PM3Consortium
      channel_name: pm3
      channel_status: new
      osn_creator_org:
        name: pm3org
      chaincodes:
        - "firefly-go"
        - "pm3package"
      orderers:
        - pm3org
      participants:
        - organization:
          name: transporter1
          type: creator
          org_status: new
          peers:
            - peer:
              name: peer0
              gossipAddress: peer0.transporter1-net.YOUR_DOMAIN:443
              peerAddress: peer0.transporter1-net.YOUR_DOMAIN:443
          ordererAddress: orderer1.pm3org-net.YOUR_DOMAIN:443
        - organization:
          name: pm3org
          type: joiner
          org_status: new
          peers:
            - peer:
              name: peer0
              gossipAddress: peer0.pm3org-net.YOUR_DOMAIN:443
              peerAddress: peer0.pm3org-net.YOUR_DOMAIN:443
          ordererAddress: orderer1.pm3org-net.YOUR_DOMAIN:443
        - organization:
          name: ombud1
          type: joiner
          org_status: new
          peers:
            - peer:
              name: peer0
              gossipAddress: peer0.ombud1-net.YOUR_DOMAIN:443
              peerAddress: peer0.ombud1-net.YOUR_DOMAIN:443
          ordererAddress: orderer1.pm3org-net.YOUR_DOMAIN:443
        - organization:
          name: ombud2
          type: joiner
          org_status: new
          peers:
            - peer:
              name: peer0
              gossipAddress: peer0.ombud2-net.YOUR_DOMAIN:443
              peerAddress: peer0.ombud2-net.YOUR_DOMAIN:443
          ordererAddress: orderer1.pm3org-net.YOUR_DOMAIN:443
      endorsers:
        - organization:
          name: transporter1
          peers:
            - peer:
              name: peer0
              corepeerAddress: peer0.transporter1-net.YOUR_DOMAIN:443
              certificate: "/path/to/your/bevel-fixes/build/transporter1/server.crt"
        - organization:
          name: ombud1
          peers:
            - peer:
              name: peer0
              corepeerAddress: peer0.ombud1-net.YOUR_DOMAIN:443
              certificate: "/path/to/your/bevel-fixes/build/ombud1/server.crt"
        - organization:
          name: ombud2
          peers:
            - peer:
              name: peer0
              corepeerAddress: peer0.ombud2-net.YOUR_DOMAIN:443
              certificate: "/path/to/your/bevel-fixes/build/ombud2/server.crt"
        - organization:
          name: pm3org
          peers:
            - peer:
              name: peer0
              corepeerAddress: peer0.pm3org-net.YOUR_DOMAIN:443
              certificate: "/path/to/your/bevel-fixes/build/pm3org/server.crt"

  # Organizations configuration
  organizations:
    # PM3 Organization (Orderer)
    - organization:
      name: pm3org
      country: SE
      state: YourState
      location: YourCity
      subject: "O=Orderer,L=YourCity,C=SE"
      external_url_suffix: YOUR_DOMAIN
      org_status: new
      fabric_console: enabled
      ca_data:
        certificate: /path/to/your/bevel-fixes/build/pm3org/server.crt

      cloud_provider: minikube

      k8s:
        context: "minikube"
        config_file: "/path/to/your/bevel-fixes/build/config"

      vault:
        url: "http://192.168.49.1:8200"
        root_token: "mydevroot"
        secret_path: "secretsv2"

      gitops:
        git_protocol: "https"
        git_url: "https://github.com/Fraktal-PM3/bevel-fixes.git"
        branch: "deployment"
        release_dir: "platforms/hyperledger-fabric/releases/dev"
        component_dir: "platforms/hyperledger-fabric/releases/k8sComponent"
        chart_source: "platforms/hyperledger-fabric/charts"
        git_repo: "github.com/Fraktal-PM3/bevel-fixes.git"
        username: "YOUR_GITHUB_USERNAME"
        password: "YOUR_GITHUB_TOKEN"
        email: "your-email@example.com"
        private_key: "path_to_private_key"

      services:
        ca:
          name: ca
          subject: "/C=SE/ST=YourState/L=YourCity/O=Orderer/CN=ca.pm3org-net"
          type: ca
          grpc:
            port: 7054

        consensus:
          name: raft

        orderers:
          - orderer:
            name: orderer1
            type: orderer
            consensus: raft
            grpc:
              port: 7050
            metrics:
              enabled: false
              port: 9443
            ordererAddress: orderer1.pm3org-net.YOUR_DOMAIN:443
          - orderer:
            name: orderer2
            type: orderer
            consensus: raft
            grpc:
              port: 7050
            metrics:
              enabled: false
              port: 9443
            ordererAddress: orderer2.pm3org-net.YOUR_DOMAIN:443
          - orderer:
            name: orderer3
            type: orderer
            consensus: raft
            grpc:
              port: 7050
            metrics:
              enabled: false
              port: 9443
            ordererAddress: orderer3.pm3org-net.YOUR_DOMAIN:443

        peers:
          - peer:
            name: peer0
            type: anchor
            gossippeeraddress: peer0.pm3org-net.YOUR_DOMAIN:443
            peerAddress: peer0.pm3org-net.YOUR_DOMAIN:443
            cli: enabled
            cactus_connector: disabled
            grpc:
              port: 7051
            events:
              port: 7053
            couchdb:
              port: 5984
            restserver:
              targetPort: 20001
              port: 20001
            expressapi:
              targetPort: 3000
              port: 3000
            metrics:
              enabled: false
              port: 9443
            chaincodes:
              - name: "firefly-go"
                version: "1"
                sequence: "1"
                maindirectory: "firefly_main"
                lang: "golang"
                private_registry: false
                repository:
                  username: "YOUR_GITHUB_USERNAME"
                  password: "YOUR_GITHUB_TOKEN"
                  url: "github.com/Fraktal-PM3/firefly.git"
                  branch: main
                  path: "smart_contracts/fabric/firefly-go/"
                arguments: ""
                endorsements: ""
              - name: "pm3package"
                version: "1"
                sequence: "1"
                maindirectory: "."
                lang: "node"
                private_registry: false
                repository:
                  username: "YOUR_GITHUB_USERNAME"
                  password: "YOUR_GITHUB_TOKEN"
                  url: "github.com/Fraktal-PM3/fraktal.git"
                  branch: chaincode-discovery-simplification
                  path: "chaincodes/package/"
                arguments: ""
                endorsements: ""

      firefly_config:
        enabled: true
        fabconnect_chaincode: "firefly-go"
        fabconnect_signer: "admin"
        fabconnect_retry: true
        multiparty_enabled: true
        dataexchange_enabled: true
        postgres_automigrate: true
        sandbox_enabled: true
        ipfs_enabled: true
        ipfs_swarm_key: |
          /key/swarm/psk/1.0.0/
          /base16/
          YOUR_IPFS_SWARM_KEY_HERE
        external_dns_target: "YOUR_PUBLIC_IP"

    # Transporter1 Organization
    - organization:
      name: transporter1
      country: SE
      state: YourState
      location: YourCity
      subject: "O=Transporter1,OU=Transporter1,L=YourCity,C=SE"
      external_url_suffix: YOUR_DOMAIN
      org_status: new
      orderer_org: pm3org
      ca_data:
        certificate: /path/to/your/bevel-fixes/build/transporter1/server.crt

      cloud_provider: minikube

      k8s:
        context: "minikube"
        config_file: "/path/to/your/bevel-fixes/build/config"

      vault:
        url: "http://192.168.49.1:8200"
        root_token: "mydevroot"
        secret_path: "secretsv2"

      gitops:
        git_protocol: "https"
        git_url: "https://github.com/Fraktal-PM3/bevel-fixes.git"
        branch: "deployment"
        release_dir: "platforms/hyperledger-fabric/releases/dev"
        component_dir: "platforms/hyperledger-fabric/releases/k8sComponent"
        chart_source: "platforms/hyperledger-fabric/charts"
        git_repo: "github.com/Fraktal-PM3/bevel-fixes.git"
        username: "YOUR_GITHUB_USERNAME"
        password: "YOUR_GITHUB_TOKEN"
        email: "your-email@example.com"
        private_key: "path_to_private_key"

      users:
        - user:
          identity: user1
          attributes:
            - key: "hf.Revoker"
              value: "true"

      services:
        ca:
          name: ca
          subject: "/C=SE/ST=YourState/L=YourCity/O=Transporter1/CN=ca.transporter1-net"
          type: ca
          grpc:
            port: 7054
        peers:
          - peer:
            name: peer0
            type: anchor
            gossippeeraddress: peer0.transporter1-net.YOUR_DOMAIN:443
            peerAddress: peer0.transporter1-net.YOUR_DOMAIN:443
            cli: enabled
            cactus_connector: disabled
            grpc:
              port: 7051
            events:
              port: 7053
            couchdb:
              port: 5984
            restserver:
              targetPort: 20001
              port: 20001
            expressapi:
              targetPort: 3000
              port: 3000
            metrics:
              enabled: false
              port: 9443
            chaincodes:
              - name: "firefly-go"
                version: "1"
                sequence: "1"
                maindirectory: "firefly_main"
                lang: "golang"
                private_registry: false
                repository:
                  username: "YOUR_GITHUB_USERNAME"
                  password: "YOUR_GITHUB_TOKEN"
                  url: "github.com/Fraktal-PM3/firefly.git"
                  branch: main
                  path: "smart_contracts/fabric/firefly-go/"
                arguments: ""
                endorsements: ""
              - name: "pm3package"
                version: "1"
                sequence: "1"
                maindirectory: "."
                lang: "node"
                private_registry: false
                repository:
                  username: "YOUR_GITHUB_USERNAME"
                  password: "YOUR_GITHUB_TOKEN"
                  url: "github.com/Fraktal-PM3/fraktal.git"
                  branch: chaincode-discovery-simplification
                  path: "chaincodes/package/"
                arguments: ""
                endorsements: ""

      firefly_config:
        enabled: true
        fabconnect_chaincode: "firefly-go"
        fabconnect_signer: "admin"
        fabconnect_retry: true
        multiparty_enabled: true
        dataexchange_enabled: true
        postgres_automigrate: true
        sandbox_enabled: true
        ipfs_enabled: true
        ipfs_swarm_key: |
          /key/swarm/psk/1.0.0/
          /base16/
          YOUR_IPFS_SWARM_KEY_HERE
        external_dns_target: "YOUR_PUBLIC_IP"

    # Ombud1 Organization
    - organization:
      name: ombud1
      country: SE
      state: YourState
      location: YourCity
      subject: "O=Ombud1,OU=Ombud1,L=YourCity,C=SE"
      external_url_suffix: YOUR_DOMAIN
      org_status: new
      orderer_org: pm3org
      ca_data:
        certificate: /path/to/your/bevel-fixes/build/ombud1/server.crt

      cloud_provider: minikube

      k8s:
        context: "minikube"
        config_file: "/path/to/your/bevel-fixes/build/config"

      vault:
        url: "http://192.168.49.1:8200"
        root_token: "mydevroot"
        secret_path: "secretsv2"

      gitops:
        git_protocol: "https"
        git_url: "https://github.com/Fraktal-PM3/bevel-fixes.git"
        branch: "deployment"
        release_dir: "platforms/hyperledger-fabric/releases/dev"
        component_dir: "platforms/hyperledger-fabric/releases/k8sComponent"
        chart_source: "platforms/hyperledger-fabric/charts"
        git_repo: "github.com/Fraktal-PM3/bevel-fixes.git"
        username: "YOUR_GITHUB_USERNAME"
        password: "YOUR_GITHUB_TOKEN"
        email: "your-email@example.com"
        private_key: "path_to_private_key"

      users:
        - user:
          identity: user1
          attributes:
            - key: "hf.Revoker"
              value: "true"

      services:
        ca:
          name: ca
          subject: "/C=SE/ST=YourState/L=YourCity/O=Ombud1/CN=ca.ombud1-net"
          type: ca
          grpc:
            port: 7054
        peers:
          - peer:
            name: peer0
            type: anchor
            gossippeeraddress: peer0.ombud1-net.YOUR_DOMAIN:443
            peerAddress: peer0.ombud1-net.YOUR_DOMAIN:443
            cli: disabled
            cactus_connector: disabled
            grpc:
              port: 7051
            events:
              port: 7053
            couchdb:
              port: 5984
            restserver:
              targetPort: 20001
              port: 20001
            expressapi:
              targetPort: 3000
              port: 3000
            metrics:
              enabled: false
              port: 9443
            chaincodes:
              - name: "firefly-go"
                version: "1"
                sequence: "1"
                maindirectory: "firefly_main"
                lang: "golang"
                private_registry: false
                repository:
                  username: "YOUR_GITHUB_USERNAME"
                  password: "YOUR_GITHUB_TOKEN"
                  url: "github.com/Fraktal-PM3/firefly.git"
                  branch: main
                  path: "smart_contracts/fabric/firefly-go/"
                arguments: ""
                endorsements: ""
              - name: "pm3package"
                version: "1"
                sequence: "1"
                maindirectory: "."
                lang: "node"
                private_registry: false
                repository:
                  username: "YOUR_GITHUB_USERNAME"
                  password: "YOUR_GITHUB_TOKEN"
                  url: "github.com/Fraktal-PM3/fraktal.git"
                  branch: chaincode-discovery-simplification
                  path: "chaincodes/package/"
                arguments: ""
                endorsements: ""

      firefly_config:
        enabled: true
        fabconnect_chaincode: "firefly-go"
        fabconnect_signer: "admin"
        fabconnect_retry: true
        multiparty_enabled: true
        dataexchange_enabled: true
        postgres_automigrate: true
        sandbox_enabled: true
        ipfs_enabled: true
        ipfs_swarm_key: |
          /key/swarm/psk/1.0.0/
          /base16/
          YOUR_IPFS_SWARM_KEY_HERE
        external_dns_target: "YOUR_PUBLIC_IP"

    # Ombud2 Organization
    - organization:
      name: ombud2
      country: SE
      state: YourState
      location: YourCity
      subject: "O=Ombud2,OU=Ombud2,L=YourCity,C=SE"
      external_url_suffix: YOUR_DOMAIN
      org_status: new
      orderer_org: pm3org
      ca_data:
        certificate: /path/to/your/bevel-fixes/build/ombud2/server.crt

      cloud_provider: minikube

      k8s:
        context: "minikube"
        config_file: "/path/to/your/bevel-fixes/build/config"

      vault:
        url: "http://192.168.49.1:8200"
        root_token: "mydevroot"
        secret_path: "secretsv2"

      gitops:
        git_protocol: "https"
        git_url: "https://github.com/Fraktal-PM3/bevel-fixes.git"
        branch: "deployment"
        release_dir: "platforms/hyperledger-fabric/releases/dev"
        component_dir: "platforms/hyperledger-fabric/releases/k8sComponent"
        chart_source: "platforms/hyperledger-fabric/charts"
        git_repo: "github.com/Fraktal-PM3/bevel-fixes.git"
        username: "YOUR_GITHUB_USERNAME"
        password: "YOUR_GITHUB_TOKEN"
        email: "your-email@example.com"
        private_key: "path_to_private_key"

      users:
        - user:
          identity: user1
          attributes:
            - key: "hf.Revoker"
              value: "true"

      services:
        ca:
          name: ca
          subject: "/C=SE/ST=YourState/L=YourCity/O=Ombud2/CN=ca.ombud2-net"
          type: ca
          grpc:
            port: 7054
        peers:
          - peer:
            name: peer0
            type: anchor
            gossippeeraddress: peer0.ombud2-net.YOUR_DOMAIN:443
            peerAddress: peer0.ombud2-net.YOUR_DOMAIN:443
            cli: disabled
            cactus_connector: disabled
            grpc:
              port: 7051
            events:
              port: 7053
            couchdb:
              port: 5984
            restserver:
              targetPort: 20001
              port: 20001
            expressapi:
              targetPort: 3000
              port: 3000
            metrics:
              enabled: false
              port: 9443
            chaincodes:
              - name: "firefly-go"
                version: "1"
                sequence: "1"
                maindirectory: "firefly_main"
                lang: "golang"
                private_registry: false
                repository:
                  username: "YOUR_GITHUB_USERNAME"
                  password: "YOUR_GITHUB_TOKEN"
                  url: "github.com/Fraktal-PM3/firefly.git"
                  branch: main
                  path: "smart_contracts/fabric/firefly-go/"
                arguments: ""
                endorsements: ""
              - name: "pm3package"
                version: "1"
                sequence: "1"
                maindirectory: "."
                lang: "node"
                private_registry: false
                repository:
                  username: "YOUR_GITHUB_USERNAME"
                  password: "YOUR_GITHUB_TOKEN"
                  url: "github.com/Fraktal-PM3/fraktal.git"
                  branch: chaincode-discovery-simplification
                  path: "chaincodes/package/"
                arguments: ""
                endorsements: ""

      firefly_config:
        enabled: true
        fabconnect_chaincode: "firefly-go"
        fabconnect_signer: "admin"
        fabconnect_retry: true
        multiparty_enabled: true
        dataexchange_enabled: true
        postgres_automigrate: true
        sandbox_enabled: true
        ipfs_enabled: true
        ipfs_swarm_key: |
          /key/swarm/psk/1.0.0/
          /base16/
          YOUR_IPFS_SWARM_KEY_HERE
        external_dns_target: "YOUR_PUBLIC_IP"
```

### Required Replacements

Replace these placeholders throughout the network.yaml file:

- `YOUR_PUBLIC_IP` → Your server's public IP address
- `YOUR_DOMAIN` → Your domain name (e.g., pm3fraktal.se)
- `/path/to/your/` → Absolute path to your bevel-fixes directory
- `YOUR_GITHUB_USERNAME` → Your GitHub username
- `YOUR_GITHUB_TOKEN` → Your GitHub personal access token
- `your-email@example.com` → Your email address
- `YOUR_IPFS_SWARM_KEY_HERE` → Generate using `openssl rand -hex 32`
- `YourState` and `YourCity` → Your location details

## Update Ansible Inventory

Create the Ansible inventory file:

```bash
mkdir -p ~/bevel-fixes/platforms/shared/inventory
```

Create the file at `platforms/shared/inventory/ansible_provisioners`:

```ini
[ansible_provisioners:children]
local

[local]
localhost ansible_connection=local
```

## Prepare Deployment Scripts

Update all deployment scripts with your local paths. Replace `/path/to/your/` with your absolute path.

### Update run.sh

Edit `~/bevel-fixes/run.sh`:

```bash
#!/bin/bash
set -e

echo "Starting build process..."

echo "Adding env variables..."
export PATH=/root/bin:$PATH

# Update this path
export KUBECONFIG=/path/to/your/bevel-fixes/build/config

echo "Validating network yaml"
ajv validate -s /path/to/your/bevel-fixes/platforms/network-schema.json \
  -d /path/to/your/bevel-fixes/build/network.yaml

echo "Setting up External DNS credentials..."
bash /path/to/your/bevel-fixes/setup-external-dns.sh

echo "Running the playbook..."
exec ansible-playbook -vv /path/to/your/bevel-fixes/platforms/shared/configuration/site.yaml \
  --inventory-file=/path/to/your/bevel-fixes/platforms/shared/inventory/ \
  -e "@/path/to/your/bevel-fixes/build/network.yaml" \
  -e 'ansible_python_interpreter=/usr/bin/python3'
```

### Update create-channels.sh

Edit `~/bevel-fixes/create-channels.sh`:

```bash
#!/bin/bash
set -e

echo "Starting channel creation and join process..."

echo "Adding env variables..."
export PATH=/root/bin:$PATH

# Update this path
export KUBECONFIG=/path/to/your/bevel-fixes/build/config

echo "Validating network yaml"
ajv validate -s /path/to/your/bevel-fixes/platforms/network-schema.json \
  -d /path/to/your/bevel-fixes/build/network.yaml

echo "Running create-join-channel playbook..."
exec ansible-playbook -vv /path/to/your/bevel-fixes/platforms/hyperledger-fabric/configuration/create-join-channel.yaml \
  --inventory-file=/path/to/your/bevel-fixes/platforms/shared/inventory/ \
  -e "@/path/to/your/bevel-fixes/build/network.yaml" \
  -e 'ansible_python_interpreter=/usr/bin/python3'
```

### Update install-chaincode.sh

Edit `~/bevel-fixes/install-chaincode.sh`:

```bash
#!/bin/bash
set -e

echo "Starting chaincode installation process..."

echo "Adding env variables..."
export PATH=/root/bin:$PATH

# Update this path
export KUBECONFIG=/path/to/your/bevel-fixes/build/config

echo "Validating network yaml"
ajv validate -s /path/to/your/bevel-fixes/platforms/network-schema.json \
  -d /path/to/your/bevel-fixes/build/network.yaml

echo "Running chaincode operations playbook..."
exec ansible-playbook -vv /path/to/your/bevel-fixes/platforms/hyperledger-fabric/configuration/chaincode-ops.yaml \
  --inventory-file=/path/to/your/bevel-fixes/platforms/shared/inventory/ \
  -e "@/path/to/your/bevel-fixes/build/network.yaml" \
  -e "add_new_org='false'" \
  -e 'ansible_python_interpreter=/usr/bin/python3'
```

### Update deploy-firefly.sh

Edit `~/bevel-fixes/deploy-firefly.sh`:

```bash
#!/bin/bash
set -e

echo "=========================================="
echo "Starting FireFly Deployment Process"
echo "=========================================="

echo "Adding environment variables..."
export PATH=/root/bin:$PATH

# Update this path
export KUBECONFIG=/path/to/your/bevel-fixes/build/config

echo "Validating network.yaml..."
ajv validate -s /path/to/your/bevel-fixes/platforms/network-schema.json \
  -d /path/to/your/bevel-fixes/build/network.yaml

if [ $? -ne 0 ]; then
  echo "ERROR: network.yaml validation failed"
  exit 1
fi

echo "Setting up External DNS credentials..."
if [ -f /path/to/your/bevel-fixes/setup-external-dns.sh ]; then
  bash /path/to/your/bevel-fixes/setup-external-dns.sh
fi

echo "=========================================="
echo "Running FireFly Deployment Playbook"
echo "=========================================="

exec ansible-playbook -vv /path/to/your/bevel-fixes/platforms/firefly/configuration/deploy-firefly.yaml \
  --inventory-file=/path/to/your/bevel-fixes/platforms/shared/inventory/ \
  -e "@/path/to/your/bevel-fixes/build/network.yaml" \
  -e 'ansible_python_interpreter=/usr/bin/python3'
```

## Make Scripts Executable

```bash
chmod +x ~/bevel-fixes/run.sh
chmod +x ~/bevel-fixes/create-channels.sh
chmod +x ~/bevel-fixes/install-chaincode.sh
chmod +x ~/bevel-fixes/deploy-firefly.sh
```

## Verification Checklist

Before proceeding, verify:

- [ ] `build/config` updated with correct paths and IP
- [ ] `build/network.yaml` created and customized
- [ ] All placeholder values replaced
- [ ] Ansible inventory file created
- [ ] All deployment scripts updated with correct paths
- [ ] All scripts are executable

## Next Steps

Once all configuration files are prepared, proceed to [DNS Setup](./4-dns-setup.md) to configure Cloudflare credentials.
