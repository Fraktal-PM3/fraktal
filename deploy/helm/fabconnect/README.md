# FabConnect Helm Chart

Helm chart to deploy FabConnect (Hyperledger Fabric REST API connector) to Kubernetes.

## Prerequisites

- Kubernetes cluster (tested with minikube)
- Helm 3.x
- Docker (for running Fabric test-network)
- Hyperledger Fabric test-network running and accessible from Kubernetes

## Quick Start

### 1. Start the Fabric Network

The FabConnect deployment requires a running Hyperledger Fabric network. Start the Docker-based test-network:

```bash
./dev.sh up fabric
```

This will start:
- Certificate Authorities (CAs) for both organizations
- Peer nodes (peer0.org1, peer0.org2)
- Orderer node
- Creates the `pm3` channel

### 2. Configure Connection Profile

The connection profile at `fabric/connection-org1.json` is already configured to connect from Kubernetes to the Docker-based Fabric network using `host.minikube.internal`.

Key configuration points:
- **Peer URL**: `grpcs://host.minikube.internal:9051` (Org2 peer)
- **CA URL**: `https://host.minikube.internal:7054` (Org1 CA)
- **Admin credentials**: Embedded in the connection profile under `users.admin`
- **CryptoPath**: `/tmp/fabconnect/wallet` for identity storage

### 3. Create Kubernetes Secrets

Create the required secrets for FabConnect:

```bash
# Connection profile secret
kubectl create secret generic fabconnect-conn \
  --from-file=connection.json=fabric/connection-org1.json

# Admin credentials secret
kubectl create secret generic fabconnect-admin \
  --from-file=cert.pem=fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/signcerts/cert.pem \
  --from-file=key.pem=fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/keystore/c7b16c015b14d557328e6cd1fd769fbc3962a8084ad40b4a4a139491cf5db497_sk
```

**Note**: The private key filename may differ in your installation. Check the `keystore` directory and use the actual filename.

### 4. Install the Helm Chart

Install FabConnect using the development values:

```bash
helm install fabconnect deploy/helm/fabconnect -f deploy/helm/fabconnect/values-dev.yaml
```

Or upgrade if already installed:

```bash
helm upgrade fabconnect deploy/helm/fabconnect -f deploy/helm/fabconnect/values-dev.yaml
```

### 5. Verify the Deployment

Check that the pod is running:

```bash
kubectl get pods
```

You should see:
```
NAME                                    READY   STATUS    RESTARTS   AGE
fabconnect-fabconnect-xxxxxxxxxx-xxxxx   1/1     Running   0          30s
```

Check the logs:

```bash
kubectl logs -l app=fabconnect
```

You should see:
```
[2025-11-13T12:11:47.328Z]  INFO HTTP server listening on 0.0.0.0:3000
```

### 6. Access FabConnect

Forward the service port to your local machine:

```bash
kubectl port-forward svc/fabconnect-fabconnect 3000:3000
```

**Note**: This command will stay running to keep the connection open. Press Ctrl+C to stop it.

Now you can access FabConnect at `http://localhost:3000`

Test the connection:

```bash
# In a new terminal
curl http://localhost:3000
```

## Configuration

### Values File

The main configuration is in `values-dev.yaml`:

```yaml
image:
  repository: ghcr.io/hyperledger/firefly-fabconnect
  tag: latest
  pullPolicy: IfNotPresent

replicaCount: 1

connectionSecret: fabconnect-conn   # Name of secret containing connection.json
adminSecret: fabconnect-admin        # Name of secret containing cert.pem and key.pem

service:
  type: ClusterIP
  port: 3000
```

### FabConnect Configuration

The FabConnect application configuration is managed via ConfigMap (see `templates/configmap.yaml`):

- **maxInFlight**: 10 - Maximum concurrent transactions
- **maxTXWaitTime**: 60 - Maximum seconds to wait for transaction
- **sendConcurrency**: 25 - Concurrent sends to Fabric
- **receipts**: LevelDB-backed receipt store at `/fabconnect/receipts`
- **events**: LevelDB-backed event store at `/fabconnect/events`
- **http.port**: 3000 - REST API port
- **rpc.configPath**: `/etc/fabconnect-certs/connection.json` - Connection profile location

## Troubleshooting

### Pod in CrashLoopBackOff

Check the logs:

```bash
kubectl logs -l app=fabconnect
```

Common issues:

1. **"Identity manager creation failed"**: Missing or incorrect connection profile
2. **"MountVolume.SetUp failed"**: Secret keys don't match deployment configuration
3. **Connection timeout**: Fabric network not accessible from Kubernetes

### Clean Restart

If you need to completely restart:

```bash
# Delete all old replicasets
kubectl delete replicaset -l app=fabconnect

# Scale down and up
kubectl scale deployment fabconnect-fabconnect --replicas=0
kubectl scale deployment fabconnect-fabconnect --replicas=1
```

### Update Secrets

If you need to update the connection profile or certificates:

```bash
# Update connection profile
kubectl delete secret fabconnect-conn
kubectl create secret generic fabconnect-conn \
  --from-file=connection.json=fabric/connection-org1.json

# Restart the deployment
kubectl rollout restart deployment fabconnect-fabconnect
```

### Verify Fabric Network Connectivity

Test connectivity from within the Kubernetes cluster:

```bash
# Start a test pod
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -- bash

# Inside the pod, test connectivity
curl -k https://host.minikube.internal:7054/cainfo
```

## Architecture

```
┌─────────────────────────────────────┐
│         Kubernetes Cluster          │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   FabConnect Pod             │  │
│  │                              │  │
│  │   - REST API (port 3000)     │  │
│  │   - Receipt Store (LevelDB)  │  │
│  │   - Event Store (LevelDB)    │  │
│  │   - Wallet (emptyDir)        │  │
│  └──────────────┬───────────────┘  │
│                 │                   │
│  ┌──────────────▼───────────────┐  │
│  │   ConfigMap & Secrets        │  │
│  │   - config.json              │  │
│  │   - connection.json          │  │
│  │   - admin cert & key         │  │
│  └──────────────────────────────┘  │
└─────────────────┼───────────────────┘
                  │
                  │ host.minikube.internal
                  │
┌─────────────────▼───────────────────┐
│         Docker Network              │
│   (fabric_test)                     │
│                                     │
│  ┌────────────┐  ┌────────────┐    │
│  │ peer0.org1 │  │ peer0.org2 │    │
│  │   :7051    │  │   :9051    │    │
│  └────────────┘  └────────────┘    │
│                                     │
│  ┌────────────┐  ┌────────────┐    │
│  │  ca-org1   │  │  ca-org2   │    │
│  │   :7054    │  │   :8054    │    │
│  └────────────┘  └────────────┘    │
│                                     │
│  ┌────────────┐                     │
│  │  orderer   │                     │
│  │   :7050    │                     │
│  └────────────┘                     │
└─────────────────────────────────────┘
```

## Uninstall

To remove the FabConnect deployment:

```bash
# Uninstall Helm release
helm uninstall fabconnect

# Remove secrets
kubectl delete secret fabconnect-conn fabconnect-admin

# Stop Fabric network
./dev.sh down
```

## License

Apache License, Version 2.0
