# Deploy (Kubernetes)

This folder contains Helm charts and deployment configurations for running Fraktal components in Kubernetes.

## Structure

```
deploy/
├── README.md          # This file
├── port-forward.sh    # Script to manage port-forwards using tmux
├── test-deployment.sh # Script to test all deployments
└── helm/
    ├── fabconnect/    # FabConnect Helm chart
    │   ├── Chart.yaml
    │   ├── README.md  # Detailed deployment guide
    │   ├── values.yaml
    │   ├── values-dev.yaml
    │   └── templates/
    │       ├── configmap.yaml
    │       ├── deployment.yaml
    │       └── service.yaml
    └── firefly/       # Firefly Core Helm chart
        ├── Chart.yaml
        ├── README.md
        ├── values.yaml
        └── templates/
            ├── configmap.yaml
            ├── deployment.yaml
            ├── postgres-deployment.yaml
            ├── postgres-service.yaml
            └── service.yaml
```

## Quick Start

### Prerequisites

- Kubernetes cluster (tested with minikube)
- Helm 3.x installed
- Docker with Hyperledger Fabric test-network running

### Deploy FabConnect

1. **Start the Fabric network:**

   ```bash
   ./dev.sh up fabric
   ```

2. **Create Kubernetes secrets:**

   ```bash
   kubectl create secret generic fabconnect-conn \
     --from-file=connection.json=fabric/connection-org1.json

   kubectl create secret generic fabconnect-admin \
     --from-file=cert.pem=fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/signcerts/cert.pem \
     --from-file=key.pem=fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/keystore/[KEY_FILE]
   ```

3. **Install the Helm chart:**

   ```bash
   helm install fabconnect deploy/helm/fabconnect -f deploy/helm/fabconnect/values-dev.yaml
   ```

4. **Access the service:**
   ```bash
   kubectl port-forward svc/fabconnect-fabconnect 3000:3000
   ```

For detailed instructions, troubleshooting, and configuration options, see [helm/fabconnect/README.md](helm/fabconnect/README.md).

### Deploy Firefly Core

1. **Install the Firefly Helm chart:**

   ```bash
   helm install firefly deploy/helm/firefly
   ```

   This will deploy:

   - PostgreSQL database for Firefly
   - Firefly Core configured to connect to FabConnect

2. **Verify the deployment:**
   ```bash
   kubectl get pods
   kubectl logs -f deployment/firefly
   ```

### Port Forwarding

Use the provided script to set up persistent port-forwards:

```bash
bash deploy/port-forward.sh
```

This will start port-forwards in detached tmux sessions:

- **FabConnect:** http://localhost:5000
- **Firefly API:** http://localhost:5100
- **Firefly Admin:** http://localhost:5101

The port-forwards will continue running in the background even after closing terminals.

**Manage port-forwards:**

```bash
# Check status
tmux list-sessions

# Restart port-forwards
bash deploy/port-forward.sh

# Stop port-forwards
tmux kill-session -t fabconnect-pf
tmux kill-session -t firefly-pf
```

### Test Deployment

Run the test script to verify all services are working:

```bash
bash deploy/test-deployment.sh
```

## Components

### FabConnect

A REST API gateway for Hyperledger Fabric, providing HTTP endpoints for interacting with the blockchain network.

- **Chart location:** `helm/fabconnect/`
- **Documentation:** [helm/fabconnect/README.md](helm/fabconnect/README.md)
- **Default port:** 3000
- **Image:** `ghcr.io/hyperledger/firefly-fabconnect:latest`

### Firefly Core

A complete Web3 data orchestration layer for managing blockchain operations, events, and data.

- **Chart location:** `helm/firefly/`
- **Documentation:** [helm/firefly/README.md](helm/firefly/README.md)
- **API port:** 5100
- **Admin port:** 5101
- **Image:** `ghcr.io/hyperledger/firefly:latest`
- **Database:** PostgreSQL 14

### PostgreSQL

Database for Firefly Core to store blockchain data, events, and transactions.

- **Deployed with:** Firefly Helm chart
- **Version:** 14
- **Port:** 5432 (internal only)

## Notes

- This deployment uses minikube with Docker-based Fabric network
- Connection to Fabric uses `host.minikube.internal` for Kubernetes-to-Docker communication
- Admin credentials are embedded in the connection profile
- All persistent data (receipts, events, wallet) uses emptyDir volumes
