# Production Kubernetes Setup - Complete Guide

This document describes the complete production setup for a multi-organizational Hyperledger Fabric network with Hyperledger FireFly integration on Kubernetes.

> **⭐ IMPORTANT UPDATE (2025-11-05)**
>
> **FireFly Identity Registration Fixed!** 
>
> FireFly now automatically registers organizations and nodes, matching the behavior of `firefly-cli`. 
> The setup now includes automatic identity registration via Kubernetes Jobs.
>
> **Key Changes**:
> - ✅ Fixed FireFly configuration (correct org keys, DataExchange type, endpoints)
> - ✅ Automatic identity registration (mimics firefly-cli's behavior)
> - ✅ Organizations now auto-discover each other on the blockchain
> - ✅ Messages and blockchain events flow correctly
>
> **Quick start**: `just setup-complete` (includes automatic registration!)

## Overview

The production setup includes:

1. **Hyperledger Fabric Network** - Multi-org blockchain with consensus and ordering
   - Orderer Organization (org0): Runs the orderer for consensus
   - Peer Organizations (org1, org2): Run peers and validate transactions
   - Private data collections for sensitive information

2. **Chaincodes** - Smart contracts deployed to the network
   - **PM3 Package Chaincode** (Node.js): Package management with private data
   - **FireFly Go Chaincode** (Go): Enables FireFly integration

3. **Hyperledger FireFly** - REST API and blockchain abstraction layer
   - FabConnect: Fabric connector for FireFly
   - REST API: Unified blockchain interface
   - PostgreSQL: State persistence
   - Per-organization deployment for multi-party coordination

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    KIND Kubernetes Cluster                  │
├──────────────────────┬──────────────────────┬───────────────┤
│                      │                      │               │
│       ORG0           │       ORG1           │     ORG2      │
│   (Orderer Org)      │   (Peer Org 1)       │  (Peer Org 2) │
│                      │                      │               │
│ ┌────────────────┐   │ ┌────────────────┐   │┌───────────────┐
│ │  CA            │   │ │  CA            │   ││  CA           │
│ └────────────────┘   │ └────────────────┘   │└───────────────┘
│                      │                      │               │
│ ┌────────────────┐   │ ┌────────────────┐   │┌───────────────┐
│ │  Orderer       │   │ │  Peer1         │   ││  Peer1        │
│ │  (consensus)   │   │ │  Peer2         │   ││  Peer2        │
│ └────────────────┘   │ │  Gateway SVC   │   ││  Gateway SVC  │
│                      │ └────────────────┘   │└───────────────┘
│                      │                      │               │
├──────────────────────┼──────────────────────┼───────────────┤
│                      │      FIREFLY         │               │
│                      │  (per-organization)  │               │
│                      │                      │               │
│                      │ ┌────────────────┐   │┌───────────────┐
│                      │ │  PostgreSQL    │   ││  PostgreSQL   │
│                      │ │  FabConnect    │   ││  FabConnect   │
│                      │ │  FireFly Core  │   ││  FireFly Core │
│                      │ └────────────────┘   │└───────────────┘
└──────────────────────┴──────────────────────┴───────────────┘
```

## Prerequisites

### System Requirements

- **Docker**: 20.10+ with 4GB+ RAM allocated
- **Kubernetes**: KIND cluster or existing K8s (1.24+)
- **Go**: 1.21+ (for chaincode compilation)
- **Node.js**: 20+ (for TypeScript chaincode)
- **Tools**:
  - `just` - Task runner
  - `kubectl` - Kubernetes CLI
  - `kind` - Local K8s cluster creation
  - `peer` - Hyperledger Fabric CLI

### Dependency Check

```bash
./scripts/check.sh
```

## Quick Start

### Complete Setup (Recommended)

For a complete end-to-end setup with **automatic FireFly identity registration**:

```bash
# Clean up any existing setup
just destroy

# Setup everything (network + chaincode + firefly + registration)
just setup-complete
```

This single command:
1. Creates a KIND cluster
2. Starts all organizations (CA, peers, orderer)
3. Enrolls users at each CA
4. Builds the consortium and creates the channel
5. Joins all orgs to the channel
6. Builds both chaincodes
7. Installs chaincodes on all peers
8. Deploys FireFly stack for each organization
9. **Automatically registers organizations and nodes** ✨

**Estimated time**: 5-10 minutes

### Verify Setup

```bash
# Check all pods are running
kubectl get pods -n org1
kubectl get pods -n org2

# Verify FireFly can see both organizations
kubectl exec -n org1 deployment/firefly-org1 -- \
  curl -s http://localhost:5000/api/v1/network/organizations | jq .

# Access FireFly UIs
open https://firefly-org1.localho.st
open https://firefly-org2.localho.st
```

## Step-by-Step Setup

If you prefer to execute each step individually:

### Step 1: Create Kubernetes Cluster

```bash
just kind
```

Creates a local KIND cluster with nginx ingress controller.

### Step 2: Start Fabric Network

Start each organization in separate terminals (or use background jobs):

```bash
# Terminal 1 - Orderer Organization
just start org0
just enroll org0

# Terminal 2 - Peer Organization 1
just start org1
just enroll org1

# Terminal 3 - Peer Organization 2
just start org2
just enroll org2
```

### Step 3: Verify Network Health

```bash
just check-network
```

### Step 4: Build Consortium and Create Channel

```bash
# In one terminal, gather MSP certificates from all orgs
just export-msp org0
just export-msp org1
just export-msp org2

# Create the genesis block
just create-genesis-block

# Inspect the genesis block (optional)
just inspect-genesis-block

# Join organizations to the channel
just join org0
just join org1
just join org2
```

### Step 5: Build and Install Chaincodes (CCAAS - Chaincode as a Service)

This setup uses **Chaincode as a Service (CCAAS)**, the recommended approach for Kubernetes deployments. Instead of building chaincode inside peer containers (which fails with "docker build is disabled"), chaincodes run as external services in separate Kubernetes pods.

#### Deploy Chaincodes (Complete Process)

```bash
# One command that does everything:
just setup-chaincode

# Or step-by-step:

# Step A: Build CCAAS packages (with metadata.json and connection.json)
just build-all-cc

# Step B: Build and load Docker images into kind
just load-cc-images

# Step C: Deploy chaincode services to Kubernetes
just deploy-cc-services

# Step D: Install packages on peers
just install-all-cc
```

#### Individual Chaincode Operations

```bash
# Build only specific chaincodes
just build-pm3-cc        # PM3 only
just build-firefly-cc    # FireFly only

# Build Docker images
just build-all-cc-images      # Both
just build-pm3-cc-image       # PM3 only
just build-firefly-cc-image   # FireFly only

# Deploy services
just deploy-pm3-cc-service      # PM3 only (includes load-cc-images)
just deploy-firefly-cc-service  # FireFly only (includes load-cc-images)

# Monitor services
just status-cc-services    # Check service status
just stop-cc-services      # Stop services (doesn't remove channel installation)
```

### Step 6: Start FireFly Overlay

FireFly must be deployed **after** chaincodes are installed.

```bash
# Deploy FireFly for both organizations
just setup-firefly

# Or individually:
just setup-firefly-org1  # Deploys for Org1
just setup-firefly-org2  # Deploys for Org2
```

This deploys:
- PostgreSQL (state persistence)
- DataExchange (P2P messaging between orgs)
- IPFS (shared storage)
- FabConnect (Fabric connector for FireFly)
- FireFly Core (REST API and blockchain abstraction)

### Step 7: Register FireFly Identities (NEW!)

After FireFly is deployed, automatically register organizations and nodes:

```bash
# This is now included in setup-complete, but can be run manually:
just register-firefly-identities
```

This command:
1. Waits for FireFly pods to be ready
2. Creates Kubernetes Jobs that register each organization
3. Registers nodes for each organization
4. Enables automatic peer discovery

**What happens during registration:**
- Calls `POST /api/v1/network/organizations/self?confirm=true`
- Calls `POST /api/v1/network/nodes/self?confirm=true`
- Organizations become visible to each other on the blockchain
- Messages can now flow between organizations

**Verify registration:**
```bash
# Check registration job logs
kubectl logs -n org1 job/firefly-init-org1
kubectl logs -n org2 job/firefly-init-org2

# Verify organizations are registered
kubectl exec -n org1 deployment/firefly-org1 -- \
  curl -s http://localhost:5000/api/v1/network/organizations | jq .

# You should see both org1 and org2!
```

**Note**: This mimics the behavior of `firefly-cli`, which automatically registers identities during first-time setup. See the [firefly-cli source code](https://github.com/hyperledger/firefly-cli/blob/main/internal/stacks/firefly_identity.go) for reference.

## Chaincode Deployment: CCAAS Model

### What is CCAAS (Chaincode as a Service)?

Hyperledger Fabric v2.0+ supports running chaincode as external services rather than as containers built and managed by peers. This is the recommended approach for Kubernetes deployments because:

1. **Solves Docker-in-Docker Problem** - Eliminates the "docker build is disabled" error
2. **Cloud-Native Architecture** - Chaincodes run in separate Kubernetes pods
3. **Independent Scaling** - Each chaincode service scales independently from peers
4. **Better Fault Isolation** - Chaincode failures don't affect peer stability
5. **Simpler Debugging** - Logs are separate from peer logs

### How CCAAS Works in This Setup

```
┌─────────────────────────────────────────────────────────────┐
│                    KIND Kubernetes Cluster                   │
├──────────────────────────┬──────────────────────────────────┤
│   Fabric Network         │  Chaincode Services Namespace    │
│   (org0, org1, org2)     │  (chaincodes)                    │
│                          │                                  │
│  ┌────────────────────┐  │  ┌──────────────────────────────┐│
│  │ Org1 Peer1         │  │  │ pm3package Service           ││
│  │ Org1 Peer2   ──────┼──┼→ │ (Node.js, port 9001)         ││
│  │ Org2 Peer1         │  │  │                              ││
│  │ Org2 Peer2   ──────┼──┼→ │ firefly-go Service           ││
│  │                    │  │  │ (Go, port 9002)              ││
│  └────────────────────┘  │  └──────────────────────────────┘│
│                          │                                  │
└──────────────────────────┴──────────────────────────────────┘

Peers connect to chaincode services via Kubernetes DNS:
  - pm3package.chaincodes.svc.cluster.local:9001
  - firefly-go.chaincodes.svc.cluster.local:9002
```

### CCAAS Package Format

Each CCAAS package contains:

```
pm3package-1.0.tar.gz
├── metadata.json          # Identifies as external type
└── code.tar.gz
    └── connection.json    # Tells peers where to find the service
        {
          "address": "pm3package.chaincodes.svc.cluster.local:9001",
          "dial_timeout": "10s",
          "tls_required": false
        }
```

When a peer installs the package:
1. It extracts and reads the metadata (type: "external")
2. It notes the connection endpoint from connection.json
3. It registers the chaincode but **doesn't build a Docker image**
4. When endorsing transactions, peers connect to the external service

### Deployment Process

Traditional (broken in K8s):
```
Build CCAAS Package → Install on Peers → Peers build Docker → FAILS: docker build disabled
```

CCAAS (correct approach):
```
Build CCAAS Package → Deploy Services → Install on Peers → Peers connect to services
```

## Chaincode Details

### PM3 Package Chaincode

**Location**: `../chaincodes/package/`
**Language**: TypeScript (transpiled to Node.js)
**Version**: 1.0 (customizable with `PM3_VERSION` env var)
**Features**:
- Package creation and management
- Private data in implicit collections per org
- Deterministic hashing for data integrity
- Role-based access control
- Package transfer with conditions

**Key Functions**:
- `CreatePackage(externalId, salt)` - Create new package
- `UpdatePackageStatus(externalId, newStatus)` - Update status
- `TransferPackage(externalId, transferTerms)` - Initiate transfer
- `GetPackageDetails(externalId)` - Query package (private data)
- `QueryAllPackages()` - List all packages

### FireFly Go Chaincode

**Location**: `../firefly/smart_contracts/fabric/firefly-go/`
**Language**: Go
**Version**: 1.0 (customizable with `FIREFLY_VERSION` env var)
**Purpose**: Enables FireFly blockchain abstraction and event handling
**Features**:
- BatchPin smart contract for event anchoring
- Token contract integration
- FireFly blockchain subscription support

## FireFly Integration

### What is FireFly?

Hyperledger FireFly is an open-source blockchain abstraction and API layer that:

1. **Provides REST API** - Unified HTTP/JSON interface to blockchain operations
2. **Handles multi-party communication** - Coordination between organizations
3. **Manages events** - Blockchain event subscriptions and distribution
4. **Abstracts blockchain details** - Same API works across different blockchains (Ethereum, Fabric, etc.)
5. **Stores state** - PostgreSQL database for off-chain state

### FireFly Architecture in this Setup

For each organization:

1. **PostgreSQL Database** - Persistent state storage
   - Org1: Port 5432
   - Org2: Port 5433
   - Volume-backed for data persistence

2. **FabConnect** - Fabric blockchain connector
   - Org1: Port 6000
   - Org2: Port 6001
   - Translates FireFly operations to Fabric transactions

3. **FireFly Core** - Main REST API and engine
   - Org1: Port 5000 (http://localhost:5000/api/v1)
   - Org2: Port 5002 (http://localhost:5002/api/v1)
   - Handles business logic and coordination

### FireFly Configuration

Configurations are generated automatically in:
- `organizations/org1/firefly/docker-compose.yml`
- `organizations/org2/firefly/docker-compose.yml`

Each organization has:
- Independent PostgreSQL instance
- Independent FabConnect instance
- Independent FireFly Core instance

This allows each org to operate autonomously while remaining part of the same network.

### Connecting to FireFly

Once running, interact with FireFly via REST API:

```bash
# Check FireFly status
curl http://localhost:5000/api/v1/status

# List namespaces
curl http://localhost:5000/api/v1/namespaces

# Access FireFly Sandbox UI (if available)
# http://localhost:5001 (Org1)
# http://localhost:5003 (Org2)
```

## Building Custom Chaincodes

To build additional chaincodes and install them:

```bash
# Build a specific chaincode
./scripts/build_chaincodes.sh pm3      # PM3 only
./scripts/build_chaincodes.sh firefly  # FireFly only
./scripts/build_chaincodes.sh all      # Both

# Install custom chaincode
just install-cc org1 /path/to/chaincode.tar.gz
just install-cc org2 /path/to/chaincode.tar.gz
```

**Build Script Details**:
- Compiles TypeScript to JavaScript (Node.js chaincodes)
- Vendors Go dependencies (Go chaincodes)
- Uses `peer lifecycle chaincode package` for proper Fabric packaging
- Outputs to `./build/` directory

## Network Management

### Stop Services

```bash
# Stop just FireFly
just firefly-stop-org1
just firefly-stop-org2

# Stop Fabric network
just down

# Full teardown
just destroy
```

### View Logs

```bash
# Fabric pod logs
kubectl logs -n org1 -f -l app=peer

# FireFly logs (from docker-compose)
cd organizations/org1/firefly && docker-compose logs -f

# Specific service logs
docker -a logs org1_firefly
docker logs org1_fabconnect
docker logs org1_postgres
```

### Restart Services

```bash
# Restart Fabric network
just restart

# Restart FireFly
just firefly-stop-org1
just firefly-start-org1

# Full network restart
just down
just up
```

## Peer CLI Access

Access Fabric peer CLI for manual operations:

```bash
# Set up environment for org1 peer1
export ORG=org1
export MSP_ID=Org1MSP
export $(just show-context $MSP_ID $ORG peer1)

# Query chaincode
peer chaincode query \
  -n pm3package \
  -C mychannel \
  -c '{"Args":["QueryAllPackages"]}'

# Invoke chaincode (requires endorsement)
peer chaincode invoke \
  -n pm3package \
  -C mychannel \
  -c '{"Args":["CreatePackage","pkg123","salt123"]}' \
  --transient '{"pii":...}' \
  --transient '{"packageDetails":...}'
```

## Troubleshooting

### FireFly Identity Registration Issues

**Problem**: Organizations can't see each other, or messages aren't flowing

**Solution**:
1. Check registration job status:
   ```bash
   kubectl get jobs -n org1
   kubectl get jobs -n org2
   kubectl logs -n org1 job/firefly-init-org1
   kubectl logs -n org2 job/firefly-init-org2
   ```

2. Verify FireFly pods are ready:
   ```bash
   kubectl get pods -n org1 -l app=firefly
   kubectl get pods -n org2 -l app=firefly
   ```

3. Check FireFly configuration:
   ```bash
   kubectl get configmap firefly-org1-config -n org1 -o yaml
   ```
   
   Verify the org key is set correctly (should be `org1user` not `0x${ORG}`):
   ```yaml
   org:
     name: "org1"
     key: "org1user"  # ✅ Correct - matches Fabric identity
   ```

4. Manual registration (if job fails):
   ```bash
   # For Org1
   kubectl exec -n org1 deployment/firefly-org1 -- curl -X POST \
     http://localhost:5000/api/v1/network/organizations/self?confirm=true \
     -H "Content-Type: application/json" -d '{}'
   
   kubectl exec -n org1 deployment/firefly-org1 -- curl -X POST \
     http://localhost:5000/api/v1/network/nodes/self?confirm=true \
     -H "Content-Type: application/json" -d '{}'
   ```

5. Delete and retry registration:
   ```bash
   kubectl delete job firefly-init-org1 -n org1
   kubectl delete job firefly-init-org2 -n org2
   just register-firefly-identities
   ```

**Expected behavior**: After successful registration, both organizations should appear when querying `/api/v1/network/organizations` from either org.

### FireFly Not Starting

**Problem**: FireFly pods fail to start or are in CrashLoopBackOff

**Solution**:
1. Check FireFly pod logs:
   ```bash
   kubectl logs -n org1 deployment/firefly-org1 --tail=50
   ```

2. Verify FabConnect is running:
   ```bash
   kubectl get pods -n org1 -l app=fabconnect
   kubectl logs -n org1 deployment/fabconnect-org1 --tail=50
   ```

3. Check PostgreSQL connectivity:
   ```bash
   kubectl get pods -n org1 -l app=postgres
   kubectl logs -n org1 deployment/postgres --tail=50
   ```

4. Verify chaincode is installed:
   ```bash
   kubectl exec -n org1 deployment/org1-peer-gateway -- \
     peer chaincode query -C pm3 -n firefly-go -c '{"Args":["ping"]}'
   ```

5. Common issues:
   - **Database connection refused**: PostgreSQL not running
   - **FabConnect timeout**: Chaincode not installed or peer not accessible
   - **Config error**: Check ConfigMap for correct values

### Messages Not Flowing Between Organizations

**Problem**: Can send messages but they don't appear on other org

**Solution**:
1. Check DataExchange connectivity:
   ```bash
   kubectl logs -n org1 -l app=dataexchange --tail=50
   kubectl logs -n org2 -l app=dataexchange --tail=50
   ```

2. Verify DataExchange endpoints are accessible:
   ```bash
   curl https://dataexchange-org1.localho.st/api/v1/status
   curl https://dataexchange-org2.localho.st/api/v1/status
   ```

3. Check FireFly DataExchange configuration:
   ```bash
   kubectl exec -n org1 deployment/firefly-org1 -- \
     curl -s http://localhost:5000/api/v1/status | jq '.plugins.dataexchange'
   ```
   
   Should show `"type": "ffdx"` (not `"https"`).

4. Test basic messaging:
   ```bash
   # Send broadcast from Org1
   kubectl exec -n org1 deployment/firefly-org1 -- curl -X POST \
     http://localhost:5000/api/v1/namespaces/default/messages/broadcast \
     -H "Content-Type: application/json" \
     -d '{"data": [{"value": "Test message"}]}'
   
   # Check on Org2
   kubectl exec -n org2 deployment/firefly-org2 -- \
     curl -s http://localhost:5000/api/v1/namespaces/default/messages | jq .
   ```

### CCAAS Chaincode Services Not Starting

**Problem**: `just deploy-cc-services` succeeds but pods fail to start

**Solution**:
1. Check deployment status:
   ```bash
   kubectl get deployments -n chaincodes
   kubectl describe deployment pm3package -n chaincodes
   ```

2. Check pod logs:
   ```bash
   kubectl logs -n chaincodes -l app=pm3package
   kubectl logs -n chaincodes -l app=firefly-go
   ```

3. Verify Docker images exist locally:
   ```bash
   docker images | grep -E "pm3package|firefly-go"
   ```

4. If images missing, rebuild and load:
   ```bash
   just build-all-cc-images
   just load-cc-images
   just deploy-cc-services
   ```

### Peers Can't Connect to Chaincode Services

**Problem**: Peers installed chaincode but get "connection refused" errors

**Solution**:
1. Verify services are running in chaincodes namespace:
   ```bash
   kubectl get all -n chaincodes
   kubectl get svc -n chaincodes
   ```

2. Verify DNS resolution from peer pod:
   ```bash
   kubectl exec -it <peer-pod> -n org1 -- bash
   # Inside pod:
   nslookup pm3package.chaincodes.svc.cluster.local
   ```

3. Check that connection.json has correct addresses:
   ```bash
   tar -tzf build/pm3package-1.0.tar.gz code.tar.gz
   tar -xzf build/pm3package-1.0.tar.gz code.tar.gz
   tar -xzf code.tar.gz connection.json
   cat connection.json
   ```

4. Expected address format:
   ```json
   {
     "address": "pm3package.chaincodes.svc.cluster.local:9001",
     "dial_timeout": "10s",
     "tls_required": false
   }
   ```

### Chaincodes Not Installing

**Problem**: `install_chaincode.sh` fails with "package not found" or installation error

**Solution**:
1. Ensure you built the CCAAS packages: `just build-all-cc`
2. Check that `build/` directory exists with `.tar.gz` files
3. Verify peer is running: `kubectl get pods -n org1`
4. Check peer logs for detailed error messages:
   ```bash
   kubectl logs -n org1 -l app=peer | grep chaincode
   ```
5. If services weren't deployed, run:
   ```bash
   just deploy-cc-services
   ```

### FireFly Not Starting

**Problem**: FireFly services fail to start

**Solution**:
1. Check Docker is running and has 4GB+ RAM allocated
2. Verify Fabric network is healthy: `just check-network`
3. Ensure chaincodes are installed before starting FireFly
4. Check logs: `cd organizations/org1/firefly && docker-compose logs`

### Network Connectivity Issues

**Problem**: Peers/orderers can't communicate

**Solution**:
1. Check pod status: `kubectl get pods -A`
2. Verify services: `kubectl get svc -n org1`
3. Check ingress: `kubectl get ingress -A`
4. Review pod logs: `kubectl logs -n org1 -l app=peer`

### Database Errors

**Problem**: PostgreSQL connection refused

**Solution**:
1. Verify PostgreSQL pod is running: `kubectl get pods -n org1 -l app=postgres`
2. Check persistent volume: `kubectl get pvc -n org1`
3. Restart PostgreSQL: `kubectl delete pod -n org1 -l app=postgres`

## Advanced Configuration

### CCAAS Service Configuration

Modify Kubernetes manifests for custom service configurations:

- **PM3 Service**: `kind/chaincodes/pm3package.yaml`
- **FireFly Service**: `kind/chaincodes/firefly-go.yaml`

Common customizations:

```yaml
# Change resource limits
resources:
  requests:
    memory: "512Mi"      # Increase if out of memory
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"

# Scale to multiple replicas
replicas: 3

# Add environment variables
env:
- name: DEBUG
  value: "true"
- name: LOG_LEVEL
  value: "debug"
```

Redeploy services after changes:
```bash
just deploy-cc-services
```

### Custom Chaincode Versions

```bash
# Build specific versions
PM3_VERSION=2.0 PM3_LABEL=pm3package_v2 just build-pm3-cc
FIREFLY_VERSION=2.0 FIREFLY_LABEL=firefly-go_v2 just build-firefly-cc

# Build and deploy together
PM3_VERSION=2.0 just setup-chaincode
```

### Custom FireFly Ports

```bash
# Override default ports for org1
FIREFLY_PORT=5010 FABCONNECT_PORT=6010 DB_PORT=5440 \
  just firefly-start-org1
```

### Enable Debug Logging

```bash
# In organizations/org1/firefly/docker-compose.yml, set:
FF_LOG_LEVEL: debug
```

Then restart: `just firefly-stop-org1 && just firefly-start-org1`

## References

### Hyperledger Fabric & Chaincode

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Fabric: Running Chaincode as an External Service](https://hyperledger-fabric.readthedocs.io/en/release-2.5/cc_service.html) - CCAAS reference
- [Fabric Contract API (Node.js)](https://github.com/hyperledger/fabric-chaincode-node)
- [Fabric Contract API (Go)](https://github.com/hyperledger/fabric-contract-api-go)

### Hyperledger FireFly

- [Hyperledger FireFly Documentation](https://hyperledger.github.io/firefly/)
- [FireFly Helm Charts](https://github.com/hyperledger/firefly-helm-charts)
- [Fraktal FireFly Fork](https://github.com/Fraktal-PM3/firefly)

### Kubernetes & Operators

- [Fabric Operator (fabric-operator)](https://github.com/hyperledger-labs/fabric-operator)
- [KIND Documentation](https://kind.sigs.k8s.io/)
- [Kubernetes Service Discovery](https://kubernetes.io/docs/concepts/services-networking/service/)
- [Kubernetes Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)

## Support

For issues or questions:
1. Check logs as described in Troubleshooting section
2. Review the main [README.md](./README.md) for basic network setup
3. Consult official Hyperledger documentation
4. File issues in the repository
