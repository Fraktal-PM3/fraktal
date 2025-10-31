#!/bin/sh
set -e

# Custom IPFS entrypoint for Fraktal PM3
# Configures IPFS nodes to bootstrap from each other in the FireFly stack

IPFS_PATH="${IPFS_PATH:-/data/ipfs}"

# Initialize IPFS if not already done
if [ ! -f "${IPFS_PATH}/config" ]; then
  echo "Initializing IPFS..."
  ipfs init
fi

# Configure swarm.key for private network if provided
if [ -n "$IPFS_SWARM_KEY" ]; then
  echo "Configuring swarm.key for private network..."
  echo "$IPFS_SWARM_KEY" > "${IPFS_PATH}/swarm.key"
  echo "Swarm key configured"
else
  echo "WARNING: IPFS_SWARM_KEY not set but LIBP2P_FORCE_PNET may be enabled"
fi

# Get our peer ID
MY_PEER_ID=$(ipfs config Identity.PeerID)
echo "IPFS Peer ID: ${MY_PEER_ID}"

# Remove all default bootstrap nodes (public IPFS network)
echo "Removing default bootstrap nodes..."
ipfs bootstrap rm --all

# Configure bootstrap based on container name
# We use DNS names that Docker provides within the network
if [ -n "$IPFS_PEER_0_ID" ] && [ -n "$IPFS_PEER_1_ID" ]; then
  echo "Configuring custom bootstrap nodes..."
  ipfs bootstrap add "/dns4/dev_ipfs_0/tcp/4001/p2p/${IPFS_PEER_0_ID}"
  ipfs bootstrap add "/dns4/dev_ipfs_1/tcp/4001/p2p/${IPFS_PEER_1_ID}"
  echo "Bootstrap nodes configured"
else
  echo "WARNING: IPFS_PEER_0_ID or IPFS_PEER_1_ID not set"
  echo "Nodes will attempt to discover each other via mDNS only"
fi

# Configure IPFS for better peer discovery in private network
echo "Configuring IPFS for private network..."
ipfs config --json Swarm.RelayClient.Enabled true
ipfs config --json Swarm.RelayService.Enabled true
ipfs config --json Discovery.MDNS.Enabled true
ipfs config --json Swarm.ConnMgr.Type '"basic"'
ipfs config --json Swarm.ConnMgr.LowWater 50
ipfs config --json Swarm.ConnMgr.HighWater 200

# Disable AutoConf for private network (required for Kubo 0.38+)
echo "Disabling AutoConf for private network..."
ipfs config --json AutoConf.Enabled false

# Set Routing.Type to dht instead of auto for private network
echo "Configuring routing for private network..."
ipfs config Routing.Type dht

# Clear auto-configured resolvers and routers (not compatible with private network)
ipfs config --json DNS.Resolvers '{}'
ipfs config --json Routing.DelegatedRouters '[]'
ipfs config --json Ipns.DelegatedPublishers '[]'

# Disable AutoTLS (not compatible with private network)
ipfs config --json AutoTLS.Enabled false

# Display bootstrap configuration
echo "Current bootstrap nodes:"
ipfs bootstrap list

# Configure API and Gateway to listen on all interfaces (required for Docker networking)
echo "Configuring API and Gateway addresses..."
ipfs config Addresses.API /ip4/0.0.0.0/tcp/5001
ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080

# Start IPFS daemon
echo "Starting IPFS daemon..."
exec ipfs daemon --migrate=true
