# Deploy (Kubernetes)

This folder contains Helm charts and deployment configurations for running Fraktal components in Kubernetes.

## Structure

```
deploy/
├── README.md          # This file
└── helm/
    └── fabconnect/    # FabConnect Helm chart
        ├── Chart.yaml
        ├── README.md  # Detailed deployment guide
        ├── values.yaml
        ├── values-dev.yaml
        └── templates/
            ├── configmap.yaml
            ├── deployment.yaml
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

## Components

### FabConnect

A REST API gateway for Hyperledger Fabric, providing HTTP endpoints for interacting with the blockchain network.

- **Chart location:** `helm/fabconnect/`
- **Documentation:** [helm/fabconnect/README.md](helm/fabconnect/README.md)
- **Default port:** 3000
- **Image:** `ghcr.io/hyperledger/firefly-fabconnect:latest`

## Notes

- This deployment uses minikube with Docker-based Fabric network
- Connection to Fabric uses `host.minikube.internal` for Kubernetes-to-Docker communication
- Admin credentials are embedded in the connection profile
- All persistent data (receipts, events, wallet) uses emptyDir volumes
