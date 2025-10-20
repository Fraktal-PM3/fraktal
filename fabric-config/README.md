# Fabric Network Configuration

Go-based Fabric network configuration tool for creating and managing a Hyperledger Fabric network with dynamic peer and orderer deployment.

Inspired by fabric-samples/test-network, this tool provides a programmatic way to configure a Hyperledger Fabric network using Go, with a single root organization (Root CA) that signs all certificates for peers and orderers.

## Features

- **Single Root Organization**: Root CA that signs all certificates for the network
- **PM3 Channel Configuration**: Channel setup similar to fabric-samples test-network
- **Variable Peers & Orderers**: Dynamically add any number of peers and orderers
- **Simplified Setup**: No Prometheus or chaincode-as-a-service complexity
- **Complete Configuration Generation**: Generates all necessary YAML configs (CA, peer, orderer, channel)
- **CLI Interface**: Easy-to-use command-line tool for network management

## Quick Start

### One-Command Setup

```bash
# Build and run full setup with 3 peers and 1 orderer
make run-example

# Or customize:
./build/fabric-config full-setup --peers 3 --orderers 1 --channel pm3
```

### Step-by-Step Setup

```bash
# 1. Build the tool
make build

# 2. Initialize network with root org and CA
./build/fabric-config init

# 3. Add orderers
./build/fabric-config add-orderer --count 1

# 4. Add peers
./build/fabric-config add-peer --count 3

# 5. Create channel and generate artifacts
./build/fabric-config create-channel --channel pm3

# 6. View network summary
./build/fabric-config summary
```

## Architecture

```
Root Organization (RootOrg)
├── Root CA (signs all certificates)
│   ├── Admin Identity
│   └── User Identities
├── Peers (variable count)
│   ├── peer0 (port 7051)
│   ├── peer1 (port 7061)
│   └── peer2 (port 7071)
└── Orderers (variable count)
    └── orderer0 (port 7050, etcdraft consensus)

PM3 Channel
├── Channel Configuration (configtx.yaml)
├── Genesis Block
├── Channel Transaction
└── Anchor Peer Update
```

## Commands

### `init` - Initialize Network

Initializes the network with root organization and CA.

```bash
./build/fabric-config init [options]

Options:
  --base-path string    Base path for network (default: ./network)
  --channel string      Channel name (default: pm3)
```

### `add-peer` - Add Peers

Adds peer(s) to the network.

```bash
./build/fabric-config add-peer [options]

Options:
  --count int          Number of peers to add (default: 1)
  --base-path string   Base path for network (default: ./network)
```

### `add-orderer` - Add Orderers

Adds orderer(s) to the network.

```bash
./build/fabric-config add-orderer [options]

Options:
  --count int          Number of orderers to add (default: 1)
  --base-path string   Base path for network (default: ./network)
```

### `create-channel` - Create Channel

Generates channel artifacts and creates the channel.

```bash
./build/fabric-config create-channel [options]

Options:
  --channel string     Channel name (default: pm3)
  --base-path string   Base path for network (default: ./network)
```

### `full-setup` - Complete Setup

Runs complete network setup (init + add peers/orderers + create channel).

```bash
./build/fabric-config full-setup [options]

Options:
  --channel string     Channel name (default: pm3)
  --peers int          Number of peers (default: 1)
  --orderers int       Number of orderers (default: 1)
  --base-path string   Base path for network (default: ./network)
```

### `summary` - Show Summary

Displays network configuration summary.

```bash
./build/fabric-config summary [options]

Options:
  --base-path string   Base path for network (default: ./network)
```

## Generated Configuration Files

The tool generates the following configuration files:

```
network/
├── organizations/
│   └── rootorg/
│       ├── ca/
│       │   └── fabric-ca-server-config.yaml
│       ├── msp/
│       ├── peers/
│       │   ├── peer0.rootorg.pm3.com/msp/
│       │   ├── peer1.rootorg.pm3.com/msp/
│       │   └── peer2.rootorg.pm3.com/msp/
│       ├── orderers/
│       │   └── orderer0.rootorg.pm3.com/msp/
│       └── users/
│           └── Admin@rootorg.pm3.com/msp/
├── config/
│   ├── configtx.yaml
│   ├── peer0/
│   │   └── core.yaml
│   ├── peer1/
│   │   └── core.yaml
│   └── orderer0/
│       └── orderer.yaml
└── channel-artifacts/
    ├── pm3.tx
    └── RootOrgMSPanchors.tx
```

## Configuration Details

### Root CA Configuration

- **Port**: 7054
- **Admin**: admin:adminpw
- **Database**: SQLite3
- **TLS**: Enabled
- **Signing Profiles**:
  - `default`: 1 year expiry, cert sign, crl sign
  - `ca`: 5 years expiry, CA constraints
  - `tls`: 1 year expiry, TLS usage

### Peer Configuration

- **Base Port**: 7051 (increments by 10 for each peer)
- **Chaincode Port**: peer_port + 1
- **Operations Port**: peer_port + 1000
- **TLS**: Enabled
- **Gossip**: Automatic bootstrap to peer0
- **State DB**: goleveldb
- **History DB**: Enabled

### Orderer Configuration

- **Base Port**: 7050 (increments by 10 for each orderer)
- **Admin Port**: orderer_port + 1
- **Operations Port**: orderer_port + 1000
- **TLS**: Enabled
- **Consensus**: etcdraft
- **Batch Size**: 10 messages, 99MB max
- **Batch Timeout**: 2 seconds

### Channel Configuration

- **Name**: pm3 (configurable)
- **Consensus**: etcdraft
- **Policies**:
  - Readers: ANY Readers
  - Writers: ANY Writers
  - Admins: MAJORITY Admins
  - Endorsement: MAJORITY Endorsement
- **Capabilities**:
  - Channel: V2_0
  - Orderer: V2_0
  - Application: V2_5

## Examples

### Example 1: Basic Setup

```bash
# Run basic setup script
./scripts/basic-setup.sh
```

### Example 2: Full Setup

```bash
# Run full setup with environment variables
CHANNEL_NAME=mychannel PEER_COUNT=5 ORDERER_COUNT=3 ./scripts/full-setup.sh
```

### Example 3: Custom Configuration

```bash
# Build
make build

# Initialize with custom settings
./build/fabric-config init --base-path ./my-network --channel mychannel

# Add multiple peers
./build/fabric-config add-peer --count 5 --base-path ./my-network

# Add multiple orderers
./build/fabric-config add-orderer --count 3 --base-path ./my-network

# Create channel
./build/fabric-config create-channel --channel mychannel --base-path ./my-network
```

## Development

### Building

```bash
# Build binary
make build

# Install dependencies
make deps

# Run tests
make test

# Format code
make fmt
```

### Testing

```bash
# Run all tests
go test -v ./...

# Run tests for specific package
go test -v ./internal/ca
go test -v ./internal/peer
go test -v ./internal/orderer
```

### Project Structure

```
fabric-config/
├── cmd/
│   └── fabric-config/      # Main application
│       └── main.go
├── internal/               # Private application code
│   ├── config/            # Configuration types and defaults
│   │   └── types.go
│   ├── ca/                # Certificate Authority management
│   │   └── ca.go
│   ├── peer/              # Peer configuration
│   │   └── peer.go
│   ├── orderer/           # Orderer configuration
│   │   └── orderer.go
│   ├── channel/           # Channel configuration
│   │   └── channel.go
│   └── network/           # Network orchestration
│       └── network.go
├── scripts/               # Utility scripts
│   ├── basic-setup.sh
│   └── full-setup.sh
├── Makefile              # Build automation
├── go.mod                # Go module definition
└── README.md             # This file
```

## Next Steps After Configuration

After running the tool, follow these steps to start your network:

### 1. Start the Certificate Authority

```bash
cd network/organizations/rootorg/ca
fabric-ca-server start -b admin:adminpw
```

### 2. Enroll Identities

```bash
# Set CA client home
export FABRIC_CA_CLIENT_HOME=./network/organizations/rootorg

# Enroll admin
fabric-ca-client enroll -u https://admin:adminpw@localhost:7054 --caname ca.rootorg.pm3.com --tls.certfiles ./network/organizations/rootorg/ca/tls-cert.pem

# Register and enroll peer identities
# Register and enroll orderer identities
# Register and enroll user identities
```

### 3. Generate Genesis Block and Channel Artifacts

```bash
cd network/config

# Generate genesis block
configtxgen -profile PM3Genesis \
  -channelID system-channel \
  -outputBlock ../organizations/rootorg/system-genesis-block/genesis.block

# Generate channel transaction
configtxgen -profile PM3Channel \
  -outputCreateChannelTx ../channel-artifacts/pm3.tx \
  -channelID pm3

# Generate anchor peer update
configtxgen -profile PM3Channel \
  -outputAnchorPeersUpdate ../channel-artifacts/RootOrgMSPanchors.tx \
  -channelID pm3 \
  -asOrg RootOrgMSP
```

### 4. Start Orderers

```bash
# Start orderer0
ORDERER_GENERAL_LOGLEVEL=debug \
FABRIC_CFG_PATH=./network/config/orderer0 \
orderer start
```

### 5. Start Peers

```bash
# Start peer0
FABRIC_LOGGING_SPEC=DEBUG \
FABRIC_CFG_PATH=./network/config/peer0 \
peer node start

# Start peer1
FABRIC_LOGGING_SPEC=DEBUG \
FABRIC_CFG_PATH=./network/config/peer1 \
peer node start
```

### 6. Create and Join Channel

```bash
# Create channel
peer channel create -o localhost:7050 -c pm3 \
  -f ./network/channel-artifacts/pm3.tx \
  --outputBlock ./network/channel-artifacts/pm3.block

# Join peers to channel
peer channel join -b ./network/channel-artifacts/pm3.block

# Update anchor peers
peer channel update -o localhost:7050 -c pm3 \
  -f ./network/channel-artifacts/RootOrgMSPanchors.tx
```

## Requirements

- Go 1.21 or higher
- Hyperledger Fabric 2.5 binaries (fabric-ca-server, configtxgen, peer, orderer)
- Docker (optional, for containerized deployment)

## License

This project is part of the Fraktal distributed ledger application.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Related Projects

- [Hyperledger Fabric](https://github.com/hyperledger/fabric)
- [Fabric Samples](https://github.com/hyperledger/fabric-samples)
- [Fabric CA](https://github.com/hyperledger/fabric-ca)
