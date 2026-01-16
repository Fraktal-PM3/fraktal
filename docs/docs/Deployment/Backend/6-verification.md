---
sidebar_position: 7
sidebar_label: 6. Verification
title: Verify Deployment
description: Verify the deployment and access PM3 services.
---

# Step 6: Verification

This guide covers verifying that your PM3 deployment is working correctly and accessing the services.

## Check Deployment Status

### Verify All Pods Are Running

```bash
# Check all pods across all namespaces
kubectl get pods -A

# Filter for Running status
kubectl get pods -A | grep Running
```

All pods should be in `Running` status with `READY` showing the expected number of containers (e.g., `1/1` or `2/2`).

### Check Services

```bash
kubectl get svc -A
```

Verify that services are created for:
- CAs (port 7054)
- Orderers (port 7050)
- Peers (port 7051)
- FireFly (various ports)

### Check Ingress Routes

```bash
kubectl get ingress -A
```

You should see ingress routes for all organizations pointing to your domain.

## Verify External DNS

Check that DNS records have been created in Cloudflare:

1. Log in to your Cloudflare Dashboard
2. Navigate to your domain
3. Go to **DNS** → **Records**
4. Verify records exist for:
   - `orderer1.pm3org-net.YOUR_DOMAIN`
   - `orderer2.pm3org-net.YOUR_DOMAIN`
   - `orderer3.pm3org-net.YOUR_DOMAIN`
   - `peer0.pm3org-net.YOUR_DOMAIN`
   - `peer0.transporter1-net.YOUR_DOMAIN`
   - `peer0.ombud1-net.YOUR_DOMAIN`
   - `peer0.ombud2-net.YOUR_DOMAIN`
   - `firefly.pm3org-net.YOUR_DOMAIN`
   - `firefly.transporter1-net.YOUR_DOMAIN`
   - `firefly.ombud1-net.YOUR_DOMAIN`
   - `firefly.ombud2-net.YOUR_DOMAIN`

All records should point to your server's public IP.

## Access FireFly UIs

If external DNS is configured correctly, you can access the FireFly UIs at:

- **PM3 Org**: `https://firefly.pm3org-net.YOUR_DOMAIN/ui`
- **Transporter1**: `https://firefly.transporter1-net.YOUR_DOMAIN/ui`
- **Ombud1**: `https://firefly.ombud1-net.YOUR_DOMAIN/ui`
- **Ombud2**: `https://firefly.ombud2-net.YOUR_DOMAIN/ui`

Replace `YOUR_DOMAIN` with your actual domain name.

:::note SSL Certificates
The deployment uses self-signed certificates, so you may need to accept certificate warnings in your browser.
:::

## Test Fabric Network

### Test Peer Connectivity

You can test connectivity to a peer using kubectl exec:

```bash
# Access the peer0 CLI pod for transporter1
kubectl exec -n transporter1-net -it cli-transporter1-peer0 -- bash

# Inside the pod, test peer connectivity
peer channel list
```

This should list the `pm3` channel.

### Test Chaincode

```bash
# Query installed chaincodes
peer lifecycle chaincode queryinstalled

# Query committed chaincodes
peer lifecycle chaincode querycommitted -C pm3
```

You should see both `firefly-go` and `pm3package` chaincodes.

## Test FireFly API

You can test the FireFly API using curl:

```bash
# Test PM3 Org FireFly API
curl https://firefly.pm3org-net.YOUR_DOMAIN/api/v1/status
```

You should receive a JSON response with FireFly status information.

## Verify IPFS Nodes

Check that IPFS nodes are running:

```bash
# Check IPFS pods
kubectl get pods -A | grep ipfs
```

Each organization should have an IPFS pod running.

## Verify Database Connections

Check that PostgreSQL databases are running for FireFly:

```bash
# Check postgres pods
kubectl get pods -A | grep postgres
```

Each organization should have a PostgreSQL pod running.

## Health Check Checklist

Verify all components are healthy:

- [ ] All pods in `Running` status
- [ ] All services created and accessible
- [ ] Ingress routes configured
- [ ] DNS records created in Cloudflare
- [ ] FireFly UIs accessible
- [ ] Fabric channels created and peers joined
- [ ] Chaincodes installed and committed
- [ ] IPFS nodes running
- [ ] PostgreSQL databases running

## Next Steps

If everything is verified and working:
- Your PM3 network is ready to use
- You can interact with the network through FireFly UIs
- You can develop and deploy additional chaincodes

If you encounter issues, see the troubleshooting sections in each guide.

When you're done and want to tear down the deployment, see [Cleanup](./7-cleanup.md).
