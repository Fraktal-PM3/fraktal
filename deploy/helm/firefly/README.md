# Hyperledger FireFly Helm Chart - Implementation Plan

Helm chart to deploy Hyperledger FireFly Core with Fabric blockchain support, integrating with the existing FabConnect deployment.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │                 FireFly Core                        │    │
│  │  - REST API (port 5000)                            │    │
│  │  - Admin API (port 5001)                           │    │
│  │  - Blockchain Plugin: Fabric                       │    │
│  │  - Database Plugin: PostgreSQL                     │    │
│  │  - SharedStorage: IPFS (optional)                  │    │
│  │  - DataExchange: FFDX (optional)                   │    │
│  └────────────┬───────────────────────┬────────────────┘    │
│               │                       │                      │
│               │                       │                      │
│  ┌────────────▼──────┐   ┌───────────▼─────────┐           │
│  │   PostgreSQL      │   │   FabConnect        │           │
│  │   - Database      │   │   (existing)        │           │
│  │   - Port 5432     │   │   - Port 3000       │           │
│  └───────────────────┘   └──────────┬──────────┘           │
│                                      │                      │
└──────────────────────────────────────┼──────────────────────┘
                                       │
                   ┌───────────────────▼───────────────────┐
                   │     Fabric Network (Docker)           │
                   │  - peer0.org2.example.com:9051        │
                   │  - orderer.example.com:7050           │
                   │  - ca-org1:7054, ca-org2:8054         │
                   └───────────────────────────────────────┘
```

## Components

### 1. FireFly Core
- **Image**: `ghcr.io/hyperledger/firefly:v1.4.0`
- **Purpose**: Main API server and orchestration engine
- **Features**:
  - Multi-party messaging and data exchange
  - Smart contract lifecycle management
  - Event streaming and aggregation
  - Identity and organization management

### 2. PostgreSQL Database
- **Image**: `postgres:16-alpine`
- **Purpose**: Persistent storage for FireFly
- **Stores**:
  - Messages and batches
  - Blockchain events
  - Tokens and NFTs
  - Organization/identity data

### 3. FabConnect (Existing)
- **Status**: Already deployed
- **Purpose**: Blockchain connector for Hyperledger Fabric
- **Integration**: FireFly will connect to existing service

### 4. Optional Components
- **IPFS**: Distributed file storage (can be added later)
- **DataExchange**: Peer-to-peer messaging (for multi-org setups)

## Configuration Analysis

Based on FireFly CLI-generated config, here's what we need:

### FireFly Core Configuration

```yaml
# Key configuration from generated stack
plugins:
  database:
    - type: postgres
      url: postgres://postgres:f1refly@postgres:5432/firefly?sslmode=disable
      migrations:
        auto: true

  blockchain:
    - type: fabric
      fabric:
        fabconnect:
          url: http://fabconnect-fabconnect:3000
          channel: pm3
          chaincode: firefly
          topic: "0"
          signer: org1

  # Optional plugins
  sharedstorage:
    - type: ipfs  # Can be disabled initially

  dataexchange:
    - type: ffdx   # Can be disabled initially
```

### Environment Variables Needed

```bash
# Database
DATABASE_URL="postgres://postgres:f1refly@postgres:5432/firefly?sslmode=disable"
DATABASE_AUTOMIGRATE="true"

# Fabric/FabConnect
FABCONNECT_URL="http://fabconnect-fabconnect:3000"
FABRIC_CHANNEL="pm3"
FABRIC_CHAINCODE="firefly"
FABRIC_SIGNER="org1"

# FireFly Core
HTTP_PORT="5000"
ADMIN_PORT="5001"
LOG_LEVEL="debug"
```

## Implementation Steps

### Phase 1: Core Setup (Minimal Viable Deployment)
**Goal**: Get FireFly Core running with PostgreSQL and FabConnect

1. ✅ **Chart Structure Created**
   - Chart.yaml
   - values.yaml
   - _helpers.tpl

2. **Create Kubernetes Manifests** (Next Steps):
   - [ ] `configmap.yaml` - FireFly configuration
   - [ ] `postgres-deployment.yaml` - PostgreSQL database
   - [ ] `postgres-service.yaml` - PostgreSQL service
   - [ ] `deployment.yaml` - FireFly Core
   - [ ] `service.yaml` - FireFly services

3. **Deploy and Test**:
   ```bash
   # Install chart
   helm install firefly deploy/helm/firefly

   # Verify
   kubectl get pods
   kubectl logs -l app=firefly

   # Test API
   kubectl port-forward svc/firefly 5000:5000
   curl http://localhost:5000/api/v1/status
   ```

### Phase 2: Integration Verification
**Goal**: Verify FireFly can interact with Fabric via FabConnect

1. **Verify Blockchain Connection**:
   ```bash
   # Check FireFly can reach FabConnect
   curl http://localhost:5000/api/v1/namespaces/default/apis

   # Check Fabric events
   curl http://localhost:5000/api/v1/namespaces/default/events
   ```

2. **Test Smart Contract Interaction**:
   - Deploy a simple contract via FireFly
   - Invoke contract methods
   - Listen for blockchain events

### Phase 3: Optional Components (Future)
**Goal**: Add advanced features as needed

1. **IPFS Integration**:
   - Deploy IPFS node
   - Configure FireFly sharedstorage plugin
   - Test file upload/download

2. **DataExchange Integration**:
   - Deploy DataExchange service
   - Configure peer connections
   - Test multi-party messaging

3. **Additional Organizations**:
   - Deploy FireFly instance for Org2
   - Configure multi-party mode
   - Test cross-org messaging

## Configuration Options

### values.yaml Structure

```yaml
# Organization identity
organizationName: org1
nodeName: node1

# FireFly Core
image:
  repository: ghcr.io/hyperledger/firefly
  tag: v1.4.0

# Blockchain configuration
fabconnect:
  url: "http://fabconnect-fabconnect:3000"
  channel: "pm3"
  chaincode: "firefly"
  signer: "org1"

# Database
postgresql:
  enabled: true
  database: firefly
  username: postgres
  password: f1refly  # CHANGE IN PRODUCTION

# Optional components
dataexchange:
  enabled: false

ipfs:
  enabled: false
```

### Customization for Production

**Security Considerations**:
1. Use Kubernetes secrets for database credentials
2. Enable TLS for all services
3. Implement network policies
4. Use private container registries
5. Enable authentication/authorization

**Scaling Considerations**:
1. PostgreSQL: Use external managed database (RDS, CloudSQL)
2. IPFS: Use IPFS cluster or external provider
3. FireFly: Can run multiple replicas with load balancer

## Dependencies

### Existing Infrastructure
- ✅ Fabric network running in Docker
- ✅ FabConnect deployed in Kubernetes
- ✅ Fabric chaincode deployed (`firefly`)
- ✅ Channel created (`pm3`)

### New Requirements
- [ ] PostgreSQL database for FireFly
- [ ] FireFly Core configuration
- [ ] Kubernetes secrets for credentials

## Key Decisions Made

1. **Minimal First Deployment**: Start with just FireFly Core + PostgreSQL
   - Rationale: Simplify initial setup, add complexity incrementally
   - Impact: No IPFS or DataExchange initially

2. **Use Existing FabConnect**: Reuse the deployed service
   - Rationale: Avoid duplication, proven working setup
   - Impact: Single point of Fabric connectivity

3. **Single Organization Mode**: Disable multiparty initially
   - Rationale: Simpler configuration, easier debugging
   - Impact: Can enable later when adding more orgs

4. **PostgreSQL in Kubernetes**: Deploy database in cluster
   - Rationale: Quick setup, good for development
   - Impact: Should migrate to managed DB for production

## Testing Strategy

### 1. Deployment Health
```bash
# Pod status
kubectl get pods -l app=firefly

# Logs
kubectl logs -l app=firefly -f

# Database connectivity
kubectl exec -it <firefly-pod> -- wget -O- http://postgres:5432
```

### 2. API Functionality
```bash
# Status endpoint
curl http://localhost:5000/api/v1/status

# Organization info
curl http://localhost:5000/api/v1/network/organizations

# Blockchain status
curl http://localhost:5000/api/v1/namespaces/default/apis
```

### 3. Fabric Integration
```bash
# Query chaincode via FireFly
curl -X POST http://localhost:5000/api/v1/namespaces/default/contracts/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "channel": "pm3",
      "chaincode": "firefly"
    },
    "method": {
      "name": "your_method"
    }
  }'
```

## Troubleshooting

### Common Issues

**1. FireFly can't connect to PostgreSQL**
```bash
# Check PostgreSQL is running
kubectl get pods -l app=postgres

# Check connection from FireFly pod
kubectl exec -it <firefly-pod> -- ping postgres

# Verify credentials in ConfigMap
kubectl get configmap firefly-config -o yaml
```

**2. FireFly can't reach FabConnect**
```bash
# Check FabConnect service
kubectl get svc fabconnect-fabconnect

# Test from FireFly pod
kubectl exec -it <firefly-pod> -- wget -O- http://fabconnect-fabconnect:3000/status
```

**3. Firefly chaincode not found**
```bash
# Verify chaincode is deployed
docker exec peer0.org2.example.com peer lifecycle chaincode queryinstalled

# Check channel configuration
docker exec peer0.org2.example.com peer lifecycle chaincode querycommitted -C pm3
```

## Next Steps

1. **Review this plan** and approve the approach
2. **Create remaining Kubernetes manifests**:
   - ConfigMap for FireFly configuration
   - PostgreSQL deployment and service
   - FireFly deployment and service
3. **Deploy to Kubernetes** and verify
4. **Test end-to-end** integration
5. **Document** any issues and solutions
6. **Iterate** to add optional components

## References

- [FireFly Documentation](https://hyperledger.github.io/firefly/)
- [FireFly Helm Charts (Official)](https://github.com/hyperledger/firefly-helm-charts)
- [FireFly Fabric Connector](https://github.com/hyperledger/firefly-fabconnect)
- [Your existing FabConnect README](../fabconnect/README.md)

## Questions to Consider

Before proceeding with implementation:

1. **Database**: Keep PostgreSQL in Kubernetes or use external managed service?
2. **Multiparty**: Do you need multiple FireFly nodes (for multiple orgs)?
3. **Storage**: Will you need IPFS for large file transfers?
4. **Scope**: Start minimal and iterate, or full deployment upfront?

---

**Status**: Architecture and plan documented. Ready for implementation approval.
