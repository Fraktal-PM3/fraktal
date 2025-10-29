---
sidebar_position: 2
sidebar_label: FireFly Stack Setup
title: FireFly Stack Setup
description: Learn how to create and manage a FireFly stack for the Fraktal project
---

# FireFly Stack Setup

This guide walks you through creating and managing a FireFly stack for the Fraktal project. A FireFly stack provides the orchestration layer for your Hyperledger Fabric blockchain network.

:::info Prerequisites
Before proceeding, ensure you have completed the [Chaincode Development Setup](./development_env) guide and have all required dependencies installed.
:::

---

## Creating Your FireFly Stack

### Initialize the Stack

Create a new FireFly stack named 'dev' using the following command:

```bash
ff init fabric --prompt-names dev
```

:::caution macOS Users
The above command will not work on macOS due to port conflicts with some ports used by FireFly. Instead, use:

```bash
ff init fabric --prompt-names dev -p 8000
```

This starts the ports at 8000 to avoid conflicts with macOS system services.
:::

### Configure Organizations

The initialization command will prompt you to configure your network organizations. You'll need to provide:

1. **Number of Organizations** - How many organizations will participate in the network
2. **Organization Names** - Unique identifiers for each organization
3. **Node Names** - Names for each organization's nodes

#### Example Configuration

For this documentation, we'll use the following setup:

| Setting | Value |
|---------|-------|
| Number of Organizations | 2 |
| Organization 1 Name | `org1` |
| Organization 1 Node Name | `org1_node_0` |
| Organization 2 Name | `org2` |
| Organization 2 Node Name | `org2_node_0` |

:::tip Customization
Choose the number and names of organizations based on your project requirements. You can create as many organizations as needed for your use case.
:::

---

## Starting the Stack

Once initialization is complete, start the stack:

```bash
ff start dev
```

### What Happens During Startup

The startup process will:
- Download necessary Docker images (first run only)
- Configure the Fabric network components
- Start all containers and services
- Set up the FireFly orchestration layer

:::note First Run
The first time you run this command, it may take several minutes as Docker downloads the required images. Subsequent starts will be much faster.
:::

### Verify Startup

When the startup completes successfully, you should see output similar to:

```bash
Web UI for member '0': http://127.0.0.1:5000/ui
Swagger API UI for member '0': http://127.0.0.1:5000/api
Sandbox UI for member '0': http://127.0.0.1:5108

Web UI for member '1': http://127.0.0.1:5001/ui
Swagger API UI for member '1': http://127.0.0.1:5001/api
Sandbox UI for member '1': http://127.0.0.1:5208

To see logs for your stack run:
  ff logs dev
```

### Access Your Stack

You now have access to several interfaces for each organization:

**Organization 1 (member '0'):**
- **Web UI:** [http://127.0.0.1:5000/ui](http://127.0.0.1:5000/ui) - Main FireFly interface
- **Swagger API:** [http://127.0.0.1:5000/api](http://127.0.0.1:5000/api) - API documentation and testing
- **Sandbox:** [http://127.0.0.1:5108](http://127.0.0.1:5108) - Interactive testing environment

**Organization 2 (member '1'):**
- **Web UI:** [http://127.0.0.1:5001/ui](http://127.0.0.1:5001/ui)
- **Swagger API:** [http://127.0.0.1:5001/api](http://127.0.0.1:5001/api)
- **Sandbox:** [http://127.0.0.1:5208](http://127.0.0.1:5208)

:::tip Testing the Setup
Open the Web UI in your browser to explore the FireFly interface and verify everything is running correctly.
:::

---

## Managing Your Stack

### View Logs

Monitor your stack's activity by viewing the logs:

```bash
ff logs dev
```

This command displays real-time logs from all containers in your stack. Press `Ctrl+C` to exit the log view.

### Stop the Stack

To stop all stack services without removing data:

```bash
ff stop dev
```

This command:
- Stops all running containers
- Preserves all data and configuration
- Allows you to restart the stack later with `ff start dev`

### Remove the Stack

To completely remove the stack and all associated data:

```bash
# First, stop the stack
ff stop dev

# Then, remove it completely
ff remove dev
```

:::danger Data Loss Warning
The `ff remove` command permanently deletes all stack data, including:
- Blockchain ledger data
- Container configurations
- Network settings

Only use this command when you're sure you want to start fresh.
:::

---

## Common FireFly CLI Commands

Here are some useful commands for managing your FireFly stack:

| Command | Description |
|---------|-------------|
| `ff init fabric --prompt-names <name>` | Initialize a new Fabric stack |
| `ff start <stack-name>` | Start a stopped stack |
| `ff stop <stack-name>` | Stop a running stack |
| `ff remove <stack-name>` | Remove a stack completely |
| `ff logs <stack-name>` | View stack logs |
| `ff info <stack-name>` | Display stack information |
| `ff accounts list <stack-name>` | List blockchain accounts |

For a complete list of available commands, refer to the [FireFly CLI Documentation](https://hyperledger.github.io/firefly/latest/).

---

## Troubleshooting

<details>
<summary>Port Conflicts</summary>

**Problem:** Error about ports already in use

**Solution:**
```bash
# Check what's using the port (example for port 5000)
sudo lsof -i :5000

# Option 1: Stop the conflicting service
# Option 2: Use a different port base
ff init fabric --prompt-names dev -p 8000
```

</details>

<details>
<summary>Docker Issues</summary>

**Problem:** Docker-related errors during stack startup

**Solution:**
```bash
# Check Docker is running
docker ps

# Restart Docker service
sudo systemctl restart docker

# Clean up old containers
docker system prune -a
```

</details>

<details>
<summary>Stack Won't Start</summary>

**Problem:** Stack fails to start or hangs

**Solution:**
```bash
# Stop any running stack
ff stop dev

# Remove and recreate
ff remove dev
ff init fabric --prompt-names dev
ff start dev

# Check logs for specific errors
ff logs dev
```

</details>

---

## Next Steps

🎉 Your FireFly stack is now running! You're ready to deploy and interact with chaincode.

**Continue to:** [Chaincode Deployment Guide](./deploy_chaincode)

In the next guide, you'll learn how to:
- Package your chaincode
- Deploy it to the Fabric network
- Invoke chaincode functions
- Query the blockchain ledger

---

## Additional Resources

- [Hyperledger FireFly Documentation](https://hyperledger.github.io/firefly/)
- [FireFly CLI Reference](https://hyperledger.github.io/firefly/latest/reference/firefly_cli.html)
- [Hyperledger Fabric Concepts](https://hyperledger-fabric.readthedocs.io/en/latest/key_concepts.html)
- [FireFly GitHub Repository](https://github.com/hyperledger/firefly)