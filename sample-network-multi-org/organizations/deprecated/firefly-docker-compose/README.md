# Deprecated: FireFly Docker Compose Deployment

This directory contains the old Docker Compose-based FireFly deployment scripts. These are **no longer recommended** and are kept only for reference.

## Why Deprecated?

The Docker Compose approach had several issues when used with Kubernetes-based Fabric networks:

1. **Architecture Mismatch**: Fabric ran in Kubernetes while FireFly ran in Docker Compose on the host
2. **Certificate Issues**: Peer certificates were stored in Kubernetes secrets, not the local filesystem
3. **Network Connectivity**: Docker Compose containers couldn't reach Kubernetes internal DNS names
4. **No Native Kubernetes Features**: Missing health checks, resource limits, orchestration, etc.

## New Approach (Recommended)

Use the **Kubernetes-native deployment** with Helm charts:

```bash
just setup-firefly
```

See: `sample-network-multi-org/K8S_FIREFLY_SETUP.md`

## Old Files

- `firefly_start.sh` - Start FireFly with Docker Compose (deprecated)
- `firefly_stop.sh` - Stop FireFly Docker Compose (deprecated)

## Legacy Just Commands (Still Available)

The old Docker Compose approach can still be used via these just targets:

```bash
just firefly-start-org1  # Old Docker Compose approach
just firefly-start-org2
just firefly-stop-org1
just firefly-stop-org2
```

However, these will fail on Kubernetes-based Fabric networks due to missing certificates.

---

**Migration Path**: Copy the simplified `setup-firefly-org1/org2/all` targets to your workflow for the new Kubernetes-native approach.
