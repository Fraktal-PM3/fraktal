#!/usr/bin/env bash
#
# Stop Hyperledger FireFly for an organization
#

set -euo pipefail

ORG=org2
FIREFLY_DIR="${PWD}/organizations/${ORG}/firefly"

if [ ! -d "$FIREFLY_DIR" ]; then
  echo "FireFly directory not found at $FIREFLY_DIR"
  exit 1
fi

echo "Stopping FireFly for ${ORG}..."

pushd "$FIREFLY_DIR" > /dev/null

if [ -f "docker-compose.yml" ]; then
  docker-compose down
else
  echo "docker-compose.yml not found"
fi

popd > /dev/null

echo "FireFly stopped for ${ORG}"
