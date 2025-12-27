---
sidebar_position: 1
sidebar_label: Deployment
title: PM3 Kubernetes Deployment Guide
description: Overview and guide for deploying the PM3 project on Kubernetes with Bevel.
---

# PM3 Kubernetes Deployment Guide

:::danger Development Only - Not Production Ready

**This deployment configuration is intended for development and testing purposes only.** It was used by the PM3 project team to deploy multiple Hyperledger Fabric and FireFly nodes in a development environment.

**This is NOT production-ready and should NOT be used in production without significant modifications:**

- Contains hardcoded credentials and development tokens
- Uses development-mode HashiCorp Vault (unsealed, insecure)
- Lacks proper security hardening and access controls
- Uses self-signed certificates
- Missing backup, disaster recovery, and monitoring
- Not thoroughly vetted for security vulnerabilities
- Single-cluster deployment without high availability

**This guide can serve as a starting point for production deployment**, but requires:
- Complete security audit and vulnerability assessment
- Replacement of all credentials and secrets with secure alternatives
- Implementation of production-grade Vault configuration
- Proper SSL/TLS certificate management
- Network security policies and firewall rules
- Monitoring, alerting, and logging infrastructure
- Backup and disaster recovery procedures
- High availability and fault tolerance configurations

**Use at your own risk in development environments only.**

:::

## Overview

This guide walks through deploying the PM3 Hyperledger Fabric network on Kubernetes using a forked version of Hyperledger Bevel. The deployment process is broken down into manageable sections to help you set up and deploy the complete PM3 infrastructure.

:::note Reference Documentation
This deployment guide is based on the [Hyperledger Bevel Minikube Setup](https://hyperledger-bevel.readthedocs.io/en/latest/tutorials/bevel-minikube-setup/) tutorial, with modifications specific to the PM3 project requirements.
:::

## Technology Stack

The deployment uses:
- **Kubernetes**: Container orchestration (tested with Minikube)
- **Hyperledger Bevel**: Automated blockchain deployment framework
- **HashiCorp Vault**: Secrets management
- **HAProxy**: Load balancing and ingress
- **Ansible**: Deployment automation
- **Hyperledger Fabric**: Blockchain platform
- **Hyperledger FireFly**: Web3 gateway and orchestration layer
- **External DNS**: Automatic DNS record management (Cloudflare)

## Deployment Guide Structure

The deployment process is divided into the following sections. Follow them in order:

### 1. [Prerequisites](./1-prerequisites.md)
Set up the foundational infrastructure components:
- Minikube cluster setup with proper resources
- HashiCorp Vault installation and configuration
- Required tools and dependencies

### 2. [Repository Setup](./2-repository-setup.md)
Clone and configure the Bevel repository:
- Git configuration
- Repository cloning and branch setup
- Build directory structure

### 3. [Configuration](./3-configuration.md)
Create and customize the deployment configuration files:
- Kubernetes config file setup
- Network configuration (network.yaml)
- Ansible inventory setup
- Deployment script preparation

### 4. [DNS Setup](./4-dns-setup.md)
Configure External DNS with Cloudflare:
- Cloudflare API token generation
- DNS credential configuration
- Understanding the DNS automation process

### 5. [Deployment](./5-complete-reference.md)
Execute the deployment scripts:
- Deploy base Fabric infrastructure
- Create and join channels
- Install chaincodes
- Deploy FireFly stack

### 6. [Verification](./6-verification.md)
Verify the deployment and access services:
- Check deployment status
- Access FireFly UIs
- Validate network connectivity

### 7. [Troubleshooting](./7-troubleshooting.md)
Common issues and solutions:
- Pod startup issues
- Vault connection problems
- DNS and networking issues
- Chaincode installation failures

### 8. [Cleanup](./8-cleanup.md)
Remove the deployment:
- Automated cleanup with reset.sh
- Manual cleanup procedures
- Infrastructure teardown

## Prerequisites Summary

Before starting, ensure you have:

- **Hardware**:
  - Minimum 12GB RAM available
  - 4 CPU cores
  - 50GB disk space

- **Access**:
  - Root/sudo access to a Linux VM or server
  - Public IP address for external access
  - Domain name with Cloudflare DNS management

- **Tools** (will be installed during setup):
  - Docker
  - Minikube
  - kubectl
  - Ansible
  - HashiCorp Vault CLI
  - Git

## Network Architecture

The deployed network includes:

### Organizations
1. **pm3org** - Orderer organization with 3 RAFT orderer nodes
2. **transporter1** - Peer organization
3. **ombud1** - Peer organization
4. **ombud2** - Peer organization

### Components per Organization
- Certificate Authority (CA)
- Peer node(s)
- CouchDB (state database)
- FireFly stack:
  - FireFly Core
  - FabConnect
  - PostgreSQL
  - IPFS
  - Data Exchange

### Chaincodes
- **firefly-go** - FireFly blockchain connector chaincode
- **pm3package** - PM3 business logic chaincode

## Important Notes

:::warning Repository Contains Untested Code

The [bevel-fixes repository](https://github.com/Fraktal-PM3/bevel-fixes/) is a fork of the original Hyperledger Bevel project. **Only Hyperledger Fabric and FireFly have been tested** with the PM3 modifications. The repository contains code for other blockchain platforms (Corda, Quorum, Besu, Indy, Substrate) that should be ignored.

See the [Cleanup Guide](./8-cleanup.md#repository-notes) for more details.
:::

## Getting Help

- [Hyperledger Bevel Documentation](https://hyperledger-bevel.readthedocs.io/)
- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Hyperledger FireFly Documentation](https://hyperledger.github.io/firefly/)
- [Bevel Fixes Repository](https://github.com/Fraktal-PM3/bevel-fixes/)

## Next Steps

Start with the [Prerequisites](./1-prerequisites.md) guide to set up your infrastructure.
