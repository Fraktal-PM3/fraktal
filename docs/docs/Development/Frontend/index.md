---
sidebar_position: 2
sidebar_label: Web Application
title: PM3 Web Application Development Guide
description: Complete guide to setting up and running the PM3 frontend application for local development.
---

# PM3 Web Application Development Guide

This guide provides comprehensive instructions for setting up and running the PM3 frontend application for local development. The application is a Next.js-based web interface that enables senders and transporters to interact with the PM3 blockchain network.

## Overview

The PM3 application provides two primary user interfaces:

- **Sender Interface**: Create packages, announce to the network, manage transporter proposals, and track shipments in real-time
- **Transporter Interface**: Browse package announcements, submit delivery offers, and execute deliveries.

The application uses real-time synchronization via Server-Sent Events (SSE) to provide instant UI updates when blockchain state changes occur.

---

## Prerequisites

Before setting up the application, ensure you have the following components installed and running:

### Required Services

1. **Hyperledger FireFly Node**
   - A running FireFly instance with the `pm3package` smart contract deployed
   - See the [Chaincode Development Setup](../Chaincode/index.md) guide for instructions

2. **Fraktal Blockchain Platform**
   - Complete Hyperledger Fabric infrastructure with the test network running


4. **Convex Account**
   - Free tier available at [convex.dev](https://convex.dev)
   - Used for real-time data persistence and synchronization

### Software Requirements

- **Node.js**: Version 18+ (version 20+ recommended)
- **npm** or **bun**: Package manager for dependencies
- **Git**: For cloning the repository

:::tip Recommended Versions
We recommend using Node.js v20.x for the best compatibility with the application dependencies.
:::

---

## Installation

### Step 1: Clone the Repository

Clone the application repository and navigate to the project directory:

```bash
git clone https://github.com/Fraktal-PM3/app.git
cd app
```

### Step 2: Install Dependencies

Install all required Node.js dependencies:

```bash
npm install
```

Or if using bun:

```bash
bun install
```

:::info Dependency Installation
The installation process will download all necessary packages including Next.js, React, Convex, and other dependencies. This may take a few minutes.
:::

### Step 3: Configure Environment Variables

Create a `.env.local` file in the project root directory with the required configuration:

```bash
# Convex Configuration
CONVEX_URL=http://localhost:3220
NEXT_PUBLIC_CONVEX_URL=http://localhost:3220

# Application Mode (TRUE for transporter, FALSE for sender)
NEXT_PUBLIC_TRANSPORTER=TRUE

# FireFly Configuration
FIREFLY_HOST=http://localhost:8000
FIREFLY_NAMESPACE=default

# Optional: Custom Port
PORT=3000
```

#### Environment Variable Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CONVEX_URL` | Convex backend URL | `http://localhost:3220` | Yes |
| `NEXT_PUBLIC_CONVEX_URL` | Public Convex URL for client | Same as `CONVEX_URL` | Yes |
| `NEXT_PUBLIC_TRANSPORTER` | Application mode (TRUE/FALSE) | `FALSE` | Yes |
| `FIREFLY_HOST` | FireFly instance URL | `http://localhost:8000` | Yes |
| `FIREFLY_NAMESPACE` | FireFly namespace | `default` | Yes |
| `PORT` | Application port | `3000` | No |

:::warning Port Configuration
- **Transporter mode**: Use port `3220` for Convex URL and port `3000` for the app
- **Sender mode**: Use port `3210` for Convex URL and port `3001` for the app

This allows running both interfaces simultaneously for testing.
:::


### Step 4: Initialize Convex

Navigate to the Convex directory and initialize the backend:

```bash
cd convex
npx convex dev --once
```

This command initializes the Convex backend configuration. After initialization, start the Convex development server:

```bash
npx convex dev
```

:::info Convex Development Server
Keep the Convex dev server running in a separate terminal window. It provides real-time data synchronization between the blockchain and the frontend.
:::

### Step 5: Verify FireFly Connection

Before running the application, verify that your FireFly instance is accessible:

```bash
curl http://localhost:8000/api/v1/status
```

Expected response: JSON object with FireFly status information.


---

## Running the Application

The application can be run in several modes depending on your development needs.

### Development Mode

#### Run as Transporter

Start the application in transporter mode (port 3000):

```bash
npm run transporter
```

Access the transporter interface at: **http://localhost:3000**

#### Run as Sender

Start the application in sender mode (port 3001):

```bash
npm run sender
```

Access the sender interface at: **http://localhost:3001**

#### Run with Custom Configuration

Use the standard development command to run with your `.env.local` settings:

```bash
npm run dev
```

The application will start on the port specified in your `.env.local` file or default to port 3000.

### Running Both Interfaces Simultaneously

For testing interactions between senders and transporters, you can run both interfaces at the same time:

**Terminal 1** - Start the transporter interface:
```bash
npm run transporter
```

**Terminal 2** - Start the sender interface (in a new terminal window):
```bash
npm run sender
```

:::info Simultaneous Interfaces
Ensure that two separate convex dev servers are running on different ports (3210 for sender, 3220 for transporter) to avoid conflicts.
:::

:::tip Development Workflow
Running both interfaces simultaneously allows you to test the complete package lifecycle:
1. Create a package in the sender interface
2. View the announcement in the transporter interface
3. Submit an offer from the transporter
4. Accept the offer in the sender interface
5. Execute delivery in the transporter interface
:::

---

## Production Builds

### Build the Application

Create an optimized production build:

```bash
npm run build
```

This command:
1. Compiles TypeScript to JavaScript
2. Optimizes and minifies code
3. Generates static assets
4. Creates production-ready bundles

### Run Production Server

After building, start the production server:

```bash
npm run start
```

Or start with specific configurations:

```bash
# Start as transporter (port 3000)
npm run start:transporter

# Start as sender (port 3001)
npm run start:sender
```


---

## Testing and Quality Assurance

### Run Tests

Execute the test suite:

```bash
npm test
```

### Run Tests with Coverage

Generate a coverage report:

```bash
npm test -- --coverage
```

Coverage reports will be generated in the `coverage/` directory.

### Linting

Run the linter to check for code quality issues:

```bash
npm run lint
```


### Fix Linting Issues Automatically

Attempt to automatically fix linting issues:

```bash
npm run lint -- --fix
```

---

## Application Features

### Sender Features

- **Package Creation**: Create new packages with detailed information (size, weight, urgency, destination)
- **Network Announcements**: Broadcast package availability to all transporters on the network
- **Proposal Management**: Review and compare offers from multiple transporters
- **Offer Acceptance**: Select and accept the best transporter offer
- **Real-time Tracking**: Monitor package status and location throughout the delivery journey
- **Delivery Confirmation**: Confirm successful delivery

### Transporter Features

- **Browse Announcements**: View all available package delivery opportunities
- **Submit Offers**: Create and submit competitive delivery proposals
- **Delivery Execution**: Accept packages and execute deliveries
- **Status Updates**: Update package status and location in real-time

### Technical Features

- **Real-time Synchronization**: Uses Server-Sent Events (SSE) for instant UI updates
- **Blockchain Integration**: Direct integration with Hyperledger FireFly and Fabric
- **Responsive Design**: Works across desktop and mobile devices
- **Type Safety**: Full TypeScript support for development safety

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev/)
- [Hyperledger FireFly Documentation](https://hyperledger.github.io/firefly/)
- [PM3 SDK Reference](../SDK/README.md)
- [Chaincode Development Guide](../Chaincode/index.md)
- [Application Repository](https://github.com/Fraktal-PM3/app)
