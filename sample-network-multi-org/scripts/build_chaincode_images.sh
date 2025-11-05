#!/usr/bin/env bash
#
# Build Docker images for chaincode services (CCAAS)
#
# Usage:
#   ./scripts/build_chaincode_images.sh [pm3|firefly|all]
#

set -euo pipefail

CWDIR=$(cd "$(dirname "$0")/.." && pwd)
REGISTRY_HOST="localhost"
REGISTRY_PORT="5000"

# Use environment variables or defaults
PM3_VERSION=${PM3_VERSION:-1.0}
FIREFLY_VERSION=${FIREFLY_VERSION:-1.0}

# Determine which images to build
BUILD_PM3=${1:-all}
if [ "$BUILD_PM3" = "firefly" ] || [ "$BUILD_PM3" = "all" ]; then
  BUILD_FIREFLY=true
else
  BUILD_FIREFLY=false
fi

if [ "$BUILD_PM3" = "firefly" ]; then
  BUILD_PM3=false
else
  BUILD_PM3=true
fi

# Helper functions
print() {
  echo -e "\033[1;34m$1\033[0m"
}

errorln() {
  echo -e "\033[1;31m$1\033[0m"
}

successln() {
  echo -e "\033[1;32m$1\033[0m"
}

#
# Build PM3 Package Chaincode Docker image
#
if [ "$BUILD_PM3" = true ]; then
  print "==============================="
  print "Building PM3 Chaincode Image"
  print "==============================="

  PM3_PATH="${CWDIR}/../chaincodes/package"

  if [ ! -d "$PM3_PATH" ]; then
    errorln "PM3 chaincode path not found: $PM3_PATH"
    exit 1
  fi

  if [ ! -f "$PM3_PATH/Dockerfile" ]; then
    errorln "PM3 Dockerfile not found: $PM3_PATH/Dockerfile"
    exit 1
  fi

  # Build the image
  print "Building Docker image for PM3 Package Chaincode..."
  docker build \
    -f "$PM3_PATH/Dockerfile" \
    -t "pm3package:${PM3_VERSION}" \
    -t "pm3package:latest" \
    "$PM3_PATH"

  successln "PM3 image built: pm3package:${PM3_VERSION}"
fi

#
# Build FireFly Go Chaincode Docker image
#
if [ "$BUILD_FIREFLY" = true ]; then
  print "==============================="
  print "Building FireFly Go Chaincode Image"
  print "==============================="

  FIREFLY_PATH="${CWDIR}/../firefly/smart_contracts/fabric/firefly-go"

  if [ ! -d "$FIREFLY_PATH" ]; then
    errorln "FireFly chaincode path not found: $FIREFLY_PATH"
    exit 1
  fi

  if [ ! -f "$FIREFLY_PATH/Dockerfile" ]; then
    errorln "FireFly Dockerfile not found: $FIREFLY_PATH/Dockerfile"
    exit 1
  fi

  # Build the image
  print "Building Docker image for FireFly Go Chaincode..."
  docker build \
    -f "$FIREFLY_PATH/Dockerfile" \
    -t "firefly-go:${FIREFLY_VERSION}" \
    -t "firefly-go:latest" \
    "$FIREFLY_PATH"

  successln "FireFly image built: firefly-go:${FIREFLY_VERSION}"
fi

print ""
print "==============================="
print "Build complete!"
print "==============================="

# List the images
docker images | grep -E "pm3package|firefly-go" || true
