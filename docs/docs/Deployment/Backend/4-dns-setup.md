---
sidebar_position: 5
sidebar_label: 4. DNS Setup
title: DNS Configuration
description: Configure External DNS with Cloudflare for automatic DNS management.
---

# Step 4: DNS Setup

This guide covers configuring Cloudflare DNS credentials for automatic DNS record creation.

## Overview

The deployment uses External DNS with Cloudflare to automatically create DNS records for all Fabric nodes and FireFly services.

## Generate Cloudflare API Token

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use the **Edit zone DNS** template or create a custom token with the following permissions:
   - **Zone** → **Zone** → **Read**
   - **Zone** → **DNS** → **Edit**
5. Set the **Zone Resources** to include your domain
6. Create the token and copy it securely

:::warning Required Permissions
The Cloudflare API token must have:
- **Zone.Zone:Read** - To read zone information
- **Zone.DNS:Edit** - To create, read, and delete DNS records

The deployment will fail without these permissions.
:::

## How DNS Setup Works

During deployment, the `run.sh` script calls `setup-external-dns.sh`, which will:

1. Detect that Cloudflare is configured in `network.yaml`
2. Check if credentials already exist in Kubernetes
3. Prompt you for your Cloudflare API token if not found
4. Create a Kubernetes secret with your credentials
5. Deploy External DNS to automatically manage DNS records

## Pre-configure Credentials (Optional)

You can set up credentials in advance by running:

```bash
export CLOUDFLARE_API_TOKEN="your-token-here"
cd ~/bevel-fixes
./setup-external-dns.sh
```

This will create the Kubernetes secret without waiting for the deployment script to prompt you.

### DNS Records Created

External DNS will automatically create records for:

- **Orderer nodes**: `orderer1.pm3org-net.YOUR_DOMAIN`, etc.
- **Peer nodes**: `peer0.transporter1-net.YOUR_DOMAIN`, etc.
- **CA services**: `ca.pm3org-net.YOUR_DOMAIN`, etc.
- **FireFly UIs**: `firefly.pm3org-net.YOUR_DOMAIN/ui`, etc.

All records will point to your server's public IP address.

### Verification

After credentials are configured, you can verify the External DNS pod:

```bash
# Check External DNS pod
kubectl get pods -n kube-system -l app=external-dns

# Watch External DNS logs
kubectl logs -n kube-system -l app=external-dns -f
```

## Next Steps

Once DNS credentials are prepared, proceed to [Deployment](./5-deployment.md) to execute the deployment scripts.
