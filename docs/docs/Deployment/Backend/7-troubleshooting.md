---
sidebar_position: 8
sidebar_label: 7. Troubleshooting
title: Troubleshooting Guide
description: Common issues and solutions for PM3 deployment.
---

# Step 7: Troubleshooting

This guide covers common issues you may encounter during deployment and their solutions.

## Pods Not Starting

### Check Pod Status

```bash
kubectl get pods -A
```

Look for pods in `Pending`, `CrashLoopBackOff`, or `Error` states.

### View Pod Logs

```bash
kubectl logs -n <namespace> <pod-name>

# For pods with multiple containers
kubectl logs -n <namespace> <pod-name> -c <container-name>

# Follow logs in real-time
kubectl logs -n <namespace> <pod-name> -f
```

### Describe Pod for Events

```bash
kubectl describe pod -n <namespace> <pod-name>
```

Look at the `Events` section at the bottom for error messages.

### Common Causes

**Insufficient Resources**:
- Minikube doesn't have enough memory/CPU
- Solution: Increase Minikube resources or reduce number of organizations

**Image Pull Errors**:
- Cannot pull Docker images
- Solution: Check internet connectivity and Docker registry access

**Volume Mount Issues**:
- PersistentVolumes not available
- Solution: Check storage configuration in Minikube

## Vault Connection Issues

### Verify Vault is Accessible

```bash
curl http://<YOUR_VAULT_IP>:8200/v1/sys/health
```

Expected response: JSON with vault health status

### Common Issues

**Wrong Vault IP**:
- `network.yaml` has incorrect Vault URL
- Solution: Update `vault.url` to correct IP (usually `192.168.49.1:8200` for Minikube)

**Vault Not Running**:
```bash
cd ~/vault
docker-compose ps
```
- Solution: Restart Vault with `docker-compose up -d`

**Secrets Engine Not Enabled**:
```bash
vault secrets list
```
- Solution: Re-run `vault secrets enable -version=2 -path=secretsv2 kv`

## DNS Issues

### External DNS Not Creating Records

Check External DNS logs:
```bash
kubectl logs -n kube-system -l app=external-dns -f
```

### Common Issues

**Invalid Cloudflare Token**:
- Token doesn't have correct permissions
- Solution: Recreate token with Zone.Zone:Read and Zone.DNS:Edit permissions

**Token Not Configured**:
```bash
kubectl get secret cloudflare-api-token -n kube-system
```
- Solution: Run `./setup-external-dns.sh` again

**DNS Provider Not Set**:
- Check `network.yaml` has `external_dns_provider: cloudflare`
- Solution: Update network.yaml and redeploy

### Verify DNS Records

Log in to Cloudflare Dashboard and check DNS records manually. Records should point to your public IP.

## Chaincode Installation Failures

### Check Installation Jobs

```bash
kubectl get jobs -A
```

Look for jobs with `0/1` completions or error status.

### View Job Logs

```bash
kubectl logs -n <namespace> job/<job-name>
```

### Common Issues

**Git Credentials Invalid**:
- GitHub token in `network.yaml` is incorrect or expired
- Solution: Update GitHub token and re-run `install-chaincode.sh`

**Chaincode Build Errors**:
- Chaincode dependencies cannot be resolved
- Solution: Check chaincode repository and dependencies

**Endorsement Policy Errors**:
- Not enough endorsements for chaincode commit
- Solution: Ensure all organizations have approved the chaincode

## Network Connectivity Issues

### Peers Cannot Reach Orderers

Check that DNS names resolve correctly:
```bash
kubectl exec -n transporter1-net -it cli-transporter1-peer0 -- nslookup orderer1.pm3org-net.YOUR_DOMAIN
```

### Gossip Issues

Check peer logs for gossip errors:
```bash
kubectl logs -n transporter1-net peer0-transporter1 | grep gossip
```

## FireFly Issues

### FireFly Pod Not Starting

Check FireFly logs:
```bash
kubectl logs -n pm3org-net firefly-pm3org
```

### Database Connection Issues

Check PostgreSQL is running:
```bash
kubectl get pods -n pm3org-net | grep postgres
```

Check FireFly database connection:
```bash
kubectl logs -n pm3org-net firefly-pm3org | grep -i postgres
```

### FabConnect Issues

Check FabConnect logs:
```bash
kubectl logs -n pm3org-net fabconnect-pm3org
```

Common issue: Cannot connect to Fabric peer
- Solution: Verify peer is running and accessible

## HAProxy/Ingress Issues

### Services Not Accessible

Check ingress status:
```bash
kubectl get ingress -A
kubectl describe ingress -n pm3org-net
```

Check HAProxy logs:
```bash
kubectl logs -n pm3org-net -l app=haproxy
```

### Certificate Issues

The deployment uses self-signed certificates. Your browser will show warnings - this is expected in development.

To access services, you may need to:
1. Accept the certificate warning in your browser
2. Or use `curl -k` to skip certificate verification

## General Debugging Commands

### Check All Resources in a Namespace

```bash
kubectl get all -n pm3org-net
```

### Check Events

```bash
kubectl get events -n pm3org-net --sort-by='.lastTimestamp'
```

### Check Node Resources

```bash
kubectl top nodes
kubectl top pods -A
```

### Restart a Deployment

```bash
kubectl rollout restart deployment/<deployment-name> -n <namespace>
```

## Getting More Help

If you cannot resolve the issue:

1. Check the Ansible playbook logs for detailed error messages
2. Review the [Hyperledger Bevel Documentation](https://hyperledger-bevel.readthedocs.io/)
3. Check the [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
4. Review the [Hyperledger FireFly Documentation](https://hyperledger.github.io/firefly/)

## Next Steps

Once issues are resolved:
- Return to [Deployment](./5-deployment.md) to continue
- Or proceed to [Verification](./6-verification.md) to verify the fix
