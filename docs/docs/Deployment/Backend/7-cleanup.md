---
sidebar_position: 9
sidebar_label: 7. Cleanup
title: Cleanup and Teardown
description: Remove the PM3 deployment and infrastructure.
---

# Step 7: Cleanup

This guide covers removing the PM3 deployment and tearing down the infrastructure.

## Cleanup Methods

There are two ways to clean up the deployment: automated cleanup using the reset script, or manual cleanup.

## Option 1: Automated Cleanup (Recommended)

The repository includes a `reset.sh` script that handles the complete cleanup process.

### Update reset.sh

First, update the script with your local paths. Edit `~/bevel-fixes/reset.sh`:

```bash title="reset.sh"
#!/bin/bash
set -e

echo "=========================================="
echo "Starting Network Reset Process"
echo "=========================================="

echo "Adding env variables..."
export PATH=/root/bin:$PATH

# Update this path
export KUBECONFIG=/path/to/your/bevel-fixes/build/config

# Cleanup FireFly deployments first (if they exist)
echo "=========================================="
echo "Cleaning up FireFly deployments..."
echo "=========================================="

if [ -f "/path/to/your/bevel-fixes/platforms/firefly/configuration/cleanup-firefly.yaml" ]; then
  ansible-playbook -vv /path/to/your/bevel-fixes/platforms/firefly/configuration/cleanup-firefly.yaml \
    --inventory-file=/path/to/your/bevel-fixes/platforms/shared/inventory/ \
    -e "@/path/to/your/bevel-fixes/build/network.yaml" \
    -e 'ansible_python_interpreter=/usr/bin/python3' || true

  echo "FireFly cleanup completed"
else
  echo "FireFly cleanup playbook not found, skipping..."
fi

echo "=========================================="
echo "Resetting Fabric Network..."
echo "=========================================="

exec ansible-playbook -vv /path/to/your/bevel-fixes/platforms/shared/configuration/site.yaml \
  --inventory-file=/path/to/your/bevel-fixes/platforms/shared/inventory/ \
  -e "@/path/to/your/bevel-fixes/build/network.yaml" \
  -e 'ansible_python_interpreter=/usr/bin/python3' \
  -e "reset='true'"
```

### Make Executable and Run

```bash
# Make the script executable
chmod +x ~/bevel-fixes/reset.sh

# Run the reset script
cd ~/bevel-fixes
./reset.sh
```

### What the Script Does

This script will:
1. Clean up all FireFly deployments (PostgreSQL, IPFS, FabConnect, FireFly Core)
2. Reset the Hyperledger Fabric network (peers, orderers, CAs)
3. Remove all Kubernetes resources created by Bevel

:::info Infrastructure Remains Running
The reset script will leave Minikube running along with the nginx-minikube-proxy container. This allows you to quickly redeploy if needed.
:::

## Complete Infrastructure Cleanup

After running the reset script, you need to manually clean up the infrastructure components:

### Stop Nginx Proxy

```bash
# Find and stop the nginx-minikube-proxy container
docker ps | grep nginx-minikube-proxy
docker stop <container-id>
docker rm <container-id>

# Or stop all nginx-minikube-proxy containers
docker stop $(docker ps -q --filter ancestor=chevdor/nginx-minikube-proxy)
docker rm $(docker ps -aq --filter ancestor=chevdor/nginx-minikube-proxy)
```

### Stop Minikube

```bash
# Stop Minikube
minikube stop

# Delete Minikube cluster (optional - removes everything)
minikube delete
```

### Stop Vault

```bash
cd ~/vault
docker-compose down
```

## Option 2: Manual Cleanup

If you prefer manual cleanup or if the reset script encounters issues:

```bash
# Delete all organization namespaces
kubectl delete namespace pm3org-net
kubectl delete namespace transporter1-net
kubectl delete namespace ombud1-net
kubectl delete namespace ombud2-net

# Delete any remaining resources
kubectl delete all --all -A

# Stop the nginx-minikube-proxy container
docker stop $(docker ps -q --filter ancestor=chevdor/nginx-minikube-proxy)
docker rm $(docker ps -aq --filter ancestor=chevdor/nginx-minikube-proxy)

# Stop Minikube
minikube stop

# Delete Minikube cluster
minikube delete

# Stop Vault
cd ~/vault
docker-compose down
```

:::warning Manual Cleanup Limitations
The manual cleanup option may leave some resources behind. The automated reset script is recommended for a complete cleanup.
:::

## Clean Up DNS Records

The External DNS will automatically remove DNS records when the deployment is cleaned up. However, you may want to verify:

1. Log in to your Cloudflare Dashboard
2. Navigate to your domain's DNS settings
3. Manually remove any leftover PM3-related DNS records if they exist

## Clean Up Local Files (Optional)

If you want to completely remove the deployment files:

```bash
# Remove the bevel-fixes repository
rm -rf ~/bevel-fixes

# Remove Vault directory
rm -rf ~/vault
```

:::danger Data Loss
This will permanently delete all configuration files. Make sure to back up any custom configurations before running these commands.
:::

## Repository Notes

### About Untested Code

:::warning Repository Contains Untested Code

The [bevel-fixes repository](https://github.com/Fraktal-PM3/bevel-fixes/) is a fork of the original Hyperledger Bevel project, which supports multiple blockchain platforms (Fabric, Corda, Quorum, Besu, Indy, and Substrate).

**Important caveats:**

- **Only Hyperledger Fabric has been tested** with the PM3 project modifications
- The repository contains **code and configurations for other blockchain platforms** (Corda, Quorum, Besu, Indy, Substrate) that are **not needed** for PM3 deployment
- Our fork includes **updated and customized code specifically for Fabric and FireFly** that has **not been ported or tested** with the other blockchain platforms
- These other platform directories exist from the original Bevel fork but should be **ignored for PM3 deployments**

**Only use the Hyperledger Fabric and FireFly configurations as documented in this guide.** Using other blockchain platform configurations may result in unexpected behavior or deployment failures.

:::

## Next Steps

After cleanup:
- You can redeploy by starting from [Prerequisites](./1-prerequisites.md) again
- Or modify your configuration and redeploy
- The configuration files in your `build/` directory are preserved unless you delete them

## Additional Resources

- [Hyperledger Bevel Documentation](https://hyperledger-bevel.readthedocs.io/)
- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Hyperledger FireFly Documentation](https://hyperledger.github.io/firefly/)
- [Bevel Fixes Repository](https://github.com/Fraktal-PM3/bevel-fixes/)
