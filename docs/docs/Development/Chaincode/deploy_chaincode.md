---
sidebar_position: 3
sidebar_label: Deployment
title: Chaincode Deployment Guide
description: Learn how to package, deploy, and register chaincode on your FireFly stack
---

# Chaincode Deployment Guide

This guide walks you through the complete process of deploying chaincode to your FireFly stack, from packaging to registration and testing.

:::info Prerequisites
Before proceeding, ensure you have:
- Completed the [Chaincode Development Setup](./development_env)
- A running FireFly stack (see [FireFly Stack Setup](./create_firefly_stack))
- Node.js and npm installed for chaincode dependencies
:::

---

## Overview

The deployment process consists of four main steps:

1. **Package** - Bundle your chaincode into a deployable format
2. **Deploy** - Upload the package to the Fabric network
3. **Define Interface** - Create a contract interface in FireFly
4. **Register API** - Register the chaincode as a callable API

---

## Step 1: Package the Chaincode

### Navigate to the Chaincode Directory

First, navigate to the package chaincode directory:

```bash
cd chaincodes/package
```

### Create Core Configuration File

Create an empty `core.yaml` file:

```bash
touch core.yaml
```

:::note Why an Empty core.yaml?
FireFly requires this file for the packaging process to work correctly with the Hyperledger Fabric peer CLI. For more details, see the [FireFly Documentation](https://hyperledger.github.io/firefly/latest/).
:::

### Install Dependencies and Package

Install the chaincode dependencies and create the package:

```bash
# Install npm dependencies
npm install

# Build chaincode
npm run package

# Package the chaincode
peer lifecycle chaincode package \
  --lang node \
  -p . \
  --label pm3package_X.Y \
  ./pm3package.zip
```

Replace `X.Y` with your desired version number (e.g., `1.0`, `1.1`, `2.0`).

**Example for version 1.0:**
```bash
peer lifecycle chaincode package \
  --lang node \
  -p . \
  --label pm3package_1.0 \
  ./pm3package.zip
```

:::tip Version Numbering
Use semantic versioning (MAJOR.MINOR) for your chaincode:
- **MAJOR**: Incompatible API changes
- **MINOR**: Backward-compatible functionality additions

Example: `1.0`, `1.1`, `2.0`, `2.1`
:::

### Verify Package Creation

Check that the package was created successfully:

```bash
ls -lh pm3package.zip
```

You should see the `pm3package.zip` file in your current directory.

---

## Step 2: Deploy to FireFly Network

Deploy the packaged chaincode to your FireFly stack using the FireFly CLI:

```bash
ff deploy fabric dev ./pm3package.zip firefly pm3package X.Y
```

**Parameters explained:**
- `dev` - Your stack name
- `pm3package.zip` - The package file you created
- `firefly` - The channel name
- `pm3package` - The chaincode name
- `X.Y` - The version number (must match the version used in packaging)

**Example for version 1.0:**
```bash
ff deploy fabric dev pm3package.zip firefly pm3package 1.0
```

:::caution Version Consistency
Ensure the version number (`X.Y`) matches exactly what you used when packaging the chaincode in Step 1.
:::

### Verify Deployment

The deployment process will:
1. Install the chaincode on all peer nodes
2. Approve the chaincode for all organizations
3. Commit the chaincode definition to the channel

Watch the output for any errors. A successful deployment will show approval and commitment messages for all organizations.

---

## Step 3: Define Contract Interface

Now you need to define the contract interface in FireFly so it knows how to interact with your chaincode.

### Get the Interface Definition

1. Navigate to the interface definition file:
   - **Repository:** [fraktal-lib/src/lib/services/package/interface.json](https://github.com/Fraktal-PM3/fraktal-lib/blob/main/src/lib/services/package/interface.json)
2. Copy the entire JSON content

### Upload to FireFly

#### Option 1: Using the Sandbox UI

1. Open the FireFly Sandbox for any node:
   - Organization 1: [http://127.0.0.1:5108/home?action=contracts.interface](http://127.0.0.1:5108/home?action=contracts.interface)
   - Organization 2: [http://127.0.0.1:5208/home?action=contracts.interface](http://127.0.0.1:5208/home?action=contracts.interface)

2. Navigate to **Contracts** → **Define a Contract Interface**

3. Paste the interface JSON content into the editor

4. **Update the version** in the interface to match your deployed version (e.g., `1.0`)

5. Click **Run** to create the interface

:::warning Version Match
Ensure the version in the interface definition matches the version you deployed in Step 2. Mismatched versions will cause invocation errors.
:::

<!-- #### Option 2: Using the API

You can also define the interface programmatically using the FireFly API:

```bash
curl -X POST http://127.0.0.1:5000/api/v1/namespaces/default/contracts/interfaces \
  -H "Content-Type: application/json" \
  -d @interface.json
``` -->

---

## Step 4: Register Contract API

The final step is to register your chaincode as a callable API in FireFly.

### Access the Registration Form

1. Open the FireFly Sandbox:
   - Organization 1: [http://127.0.0.1:5108](http://127.0.0.1:5108)
   - Organization 2: [http://127.0.0.1:5208](http://127.0.0.1:5208)

2. Navigate to **Contracts** → **Register Contract API**

   Or use direct link: [http://127.0.0.1:5108/home?action=contracts.api](http://127.0.0.1:5108/home?action=contracts.api)

### Fill in the Registration Form

Provide the following information:

| Field | Value | Example |
|-------|-------|---------|
| **Contract Interface** | Select from dropdown | The interface you defined in Step 3 |
| **Name** | `packagename_X.Y` | `pm3package_1.0` |
| **Chaincode** | Same as Name | `pm3package_1.0` |
| **Channel** | Channel name | `firefly` |

:::tip Naming Convention
Use the format `packagename_X.Y` where:
- `packagename` is your chaincode name (e.g., `pm3package`)
- `X.Y` is your version number (e.g., `1.0`)

This keeps your registrations organized and version-aware.
:::

### Complete Registration

Click **Register** to complete the process.

Upon successful registration, your chaincode API will be available for invocation through FireFly's API endpoints and UI.

---

## Verify Your Deployment

### Check Contract APIs

1. In the FireFly Sandbox, navigate to **Contracts** → **Contract APIs**
2. You should see your newly registered API listed
3. Click on it to view available methods

### Test Invocation

Try invoking a method to verify everything is working:

1. Go to **Contracts** → **Invoke Method**
2. Select your contract API
3. Choose a method to test
4. Provide required parameters
5. Click **Run**

:::tip Sandbox Testing
The Sandbox provides an excellent environment for testing your chaincode methods before integrating them into your application.
:::

---

## Deployment Checklist

Use this checklist to ensure you've completed all steps correctly:

- [ ] Navigated to `chaincodes/package` directory
- [ ] Created empty `core.yaml` file
- [ ] Installed npm dependencies with `npm install`
- [ ] Packaged chaincode with consistent version number
- [ ] Deployed package to FireFly network
- [ ] Retrieved interface definition from GitHub
- [ ] Defined contract interface in FireFly
- [ ] Verified interface version matches deployment
- [ ] Registered contract API with correct parameters
- [ ] Verified API appears in Contract APIs list
- [ ] Tested at least one method invocation

---

## Updating Chaincode

When you need to update your chaincode:

### Update Process

1. **Increment the version number** (e.g., from `1.0` to `1.1` or `2.0`)
2. **Repeat the packaging process** with the new version
3. **Deploy the new version** to the network
4. **Update the interface** with the new version
5. **Register the new API** with the updated version number

### Version Strategy

```bash
# Bug fixes and minor changes
pm3package_1.0 → pm3package_1.1

# Breaking changes or major features
pm3package_1.0 → pm3package_2.0
```

:::note Side-by-Side Versions
FireFly allows multiple versions of the same chaincode to coexist on the network, enabling gradual migration strategies.
:::

---

## Troubleshooting

<details>
<summary>Package Creation Fails</summary>

**Problem:** Error during `peer lifecycle chaincode package`

**Solutions:**
```bash
# Ensure peer binary is accessible
which peer

# Verify you're in the correct directory
pwd  # Should show .../chaincodes/package

# Check core.yaml exists
ls -la core.yaml

# Verify npm dependencies are installed
ls -la node_modules
```

</details>

<details>
<summary>Deployment Fails</summary>

**Problem:** `ff deploy` command fails or hangs

**Solutions:**
```bash
# Stop the running firefly stack
ff stop dev

# Remove the stopped firefly stack
ff rm dev

```

Then recreate the stack and follow the same steps again according to the documentation. You can find the initalization step [here](./create_firefly_stack).

</details>




---

## Next Steps

🎉 Congratulations! Your chaincode is now deployed and ready to use.

### What's Next?

- **Integrate with Applications:** Use the FireFly API to call your chaincode from applications
- **Explore APIs:** Review the [FireFly API Documentation](https://hyperledger.github.io/firefly/latest/reference/api.html)
- **Monitor Transactions:** Use the FireFly UI to monitor blockchain transactions
- **Develop More Chaincodes:** Apply this process to deploy additional smart contracts

### Related Documentation

- [FireFly Contract Interface Guide](https://hyperledger.github.io/firefly/latest/tutorials/custom_contracts/)
- [Hyperledger Fabric Chaincode Lifecycle](https://hyperledger-fabric.readthedocs.io/en/latest/chaincode_lifecycle.html)
- [FireFly API Reference](https://hyperledger.github.io/firefly/latest/reference/api.html)

---

## Additional Resources

- [Hyperledger FireFly Documentation](https://hyperledger.github.io/firefly/)
- [Fabric Chaincode Best Practices](https://hyperledger-fabric.readthedocs.io/en/latest/chaincode4ade.html)
- [FireFly GitHub Repository](https://github.com/hyperledger/firefly)
- [Fraktal Project Repository](https://github.com/Fraktal-PM3/fraktal)
