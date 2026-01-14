---
sidebar_position: 6
sidebar_label: 5. Deployment
title: Execute Deployment
description: Run the deployment scripts to deploy the PM3 network.
---

# Step 5: Deployment

This guide covers executing the deployment scripts in the correct order to deploy the complete PM3 network.

## Deployment Overview

The deployment process consists of four main phases:
1. Deploy base Fabric infrastructure (CAs, orderers, peers)
2. Create and join channels
3. Install and instantiate chaincodes
4. Deploy FireFly stack

## Phase 1: Deploy Base Infrastructure

```bash
cd ~/bevel-fixes
./run.sh
```

**When prompted by `setup-external-dns.sh`**, enter your Cloudflare API token.

This script will:
- Set up External DNS with Cloudflare credentials
- Deploy Certificate Authorities (CAs) for each organization
- Deploy 3 RAFT orderer nodes for pm3org
- Deploy peer nodes for all organizations (pm3org, transporter1, ombud1, ombud2)
- Configure CouchDB state databases
- Set up HAProxy ingress
- Automatically create DNS records for all services

:::tip Monitoring Progress
The deployment uses Ansible playbooks and Kubernetes. You can monitor progress in another terminal:

```bash
# Watch pods being created
watch kubectl get pods -A

# Check specific namespace
kubectl get pods -n pm3org-net

# Monitor External DNS
kubectl logs -n kube-system -l app=external-dns -f
```
:::

:::warning Be Patient
This step involves deploying multiple components and waiting for Kubernetes resources to become ready. The process is automated but may take time.
:::

## Phase 2: Create and Join Channels

```bash
./create-channels.sh
```

This script will:
- Create the `pm3` channel
- Join all peer nodes to the channel
- Update anchor peers for each organization

You should see output indicating successful channel creation and peer joins.

## Phase 3: Install Chaincode

```bash
./install-chaincode.sh
```

This script will:
- Install the `firefly-go` chaincode on all peer nodes
- Install the `pm3package` chaincode on all peer nodes
- Approve chaincodes for each organization
- Commit chaincodes to the channel

:::warning Wait for Jobs to Complete
Before proceeding to FireFly deployment, ensure all chaincode installation jobs have completed:

```bash
kubectl get jobs -A
```

Look for jobs named similar to `commitcc-*` and ensure they show `1/1` completions.
:::

## Phase 4: Deploy FireFly

After all chaincode installation jobs have completed successfully:

```bash
./deploy-firefly.sh
```

This script will deploy the FireFly stack for each organization:
- FireFly Core
- FabConnect (Fabric connector)
- PostgreSQL database
- IPFS node
- Data Exchange service

## Monitoring Deployment

### Check All Pods

```bash
kubectl get pods -A
```

All pods should eventually reach `Running` status.

### Check Services

```bash
kubectl get svc -A
```

### Check Ingress Routes

```bash
kubectl get ingress -A
```

### Check Specific Namespaces

```bash
# Check pm3org
kubectl get all -n pm3org-net

# Check transporter1
kubectl get all -n transporter1-net

# Check ombud1
kubectl get all -n ombud1-net

# Check ombud2
kubectl get all -n ombud2-net
```

## Troubleshooting During Deployment

If you encounter issues during deployment:

1. **Check pod status**: `kubectl get pods -A`
2. **View pod logs**: `kubectl logs -n <namespace> <pod-name>`
3. **Check events**: `kubectl get events -n <namespace> --sort-by='.lastTimestamp'`
4. **Verify Vault connectivity**: `curl http://<YOUR_VAULT_IP>:8200/v1/sys/health`

See the troubleshooting sections in each guide for detailed solutions to common issues.

## Next Steps

Once all pods are running, proceed to [Verification](./6-verification.md) to verify the deployment and access the FireFly UIs.
