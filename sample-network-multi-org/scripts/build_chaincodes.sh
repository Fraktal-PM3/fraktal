#!/usr/bin/env bash
#
# Build and package chaincodes for installation on the network
#
# Usage:
#   ./scripts/build_chaincodes.sh [pm3|firefly|all]
#
# Produces packaged chaincodes in:
#   - ./build/pm3package-<version>.tar.gz
#   - ./build/firefly-go-<version>.tar.gz
#

set -euo pipefail

CWDIR=$(cd "$(dirname "$0")/.." && pwd)
BUILD_DIR="${CWDIR}/build"

# Source FABRIC_CFG_PATH configuration
export FABRIC_CFG_PATH="${CWDIR}/../fabric-samples/config/"

# Use environment variables or defaults
PM3_VERSION=${PM3_VERSION:-1.0}
PM3_LABEL=${PM3_LABEL:-pm3package_${PM3_VERSION}}
FIREFLY_VERSION=${FIREFLY_VERSION:-1.0}
FIREFLY_LABEL=${FIREFLY_LABEL:-firefly-go_${FIREFLY_VERSION}}

# Determine which chaincodes to build
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

# Ensure build directory exists
mkdir -p "$BUILD_DIR"

#
# Build and package PM3 Package Chaincode (TypeScript)
#
if [ "$BUILD_PM3" = true ]; then
  print "==============================="
  print "Building PM3 Package Chaincode"
  print "==============================="

  PM3_PATH="${CWDIR}/../chaincodes/package"

  if [ ! -d "$PM3_PATH" ]; then
    errorln "PM3 chaincode path not found: $PM3_PATH"
    exit 1
  fi

  pushd "$PM3_PATH" > /dev/null

  # Clean and install dependencies
  print "Installing PM3 dependencies..."
  rm -rf dist node_modules
  npm install
  npm ci

  # Build and package (creates npm-shrinkwrap.json)
  print "Building PM3 chaincode..."
  npm run package

  # Package for CCAAS (Chaincode as a Service)
  print "Packaging PM3 chaincode as CCAAS..."

  PACKAGE_DIR=$(mktemp -d)
  trap "rm -rf $PACKAGE_DIR" EXIT

  # Create metadata.json for CCAAS
  cat > "$PACKAGE_DIR/metadata.json" << 'EOFMETA'
{
  "type": "ccaas",
  "label": "pm3package"
}
EOFMETA

  # Create code directory with connection.json for CCAAS
  CODE_DIR=$(mktemp -d)
  cat > "$CODE_DIR/connection.json" << 'EOFCONN'
{
  "address": "pm3package.chaincodes.svc.cluster.local:7052",
  "dial_timeout": "10s",
  "tls_required": false
}
EOFCONN

  # Create code.tar.gz with connection details
  tar -czf "$PACKAGE_DIR/code.tar.gz" -C "$CODE_DIR" .
  rm -rf "$CODE_DIR"

  # Create final package
  PM3_PACKAGE="${BUILD_DIR}/pm3package-${PM3_VERSION}.tar.gz"
  tar -czf "$PM3_PACKAGE" -C "$PACKAGE_DIR" metadata.json code.tar.gz

  successln "PM3 package created: $PM3_PACKAGE"
  popd > /dev/null
fi

#
# Build and package FireFly Go Chaincode
#
if [ "$BUILD_FIREFLY" = true ]; then
  print "==============================="
  print "Building FireFly Go Chaincode"
  print "==============================="

  FIREFLY_PATH="${CWDIR}/../firefly/smart_contracts/fabric/firefly-go"

  if [ ! -d "$FIREFLY_PATH" ]; then
    errorln "FireFly chaincode path not found: $FIREFLY_PATH"
    exit 1
  fi

  pushd "$FIREFLY_PATH" > /dev/null

  # Ensure go.mod is present
  if [ ! -f "go.mod" ]; then
    errorln "go.mod not found in $FIREFLY_PATH"
    popd > /dev/null
    exit 1
  fi

  # Vendor Go dependencies
  print "Vendoring Go dependencies..."
  # Disable workspace mode if present (go.work exists at parent level)
  GO111MODULE=on GOWORK=off go mod vendor

  # Package for CCAAS (Chaincode as a Service)
  print "Packaging FireFly Go chaincode as CCAAS..."

  PACKAGE_DIR=$(mktemp -d)
  trap "rm -rf $PACKAGE_DIR" EXIT

  # Create metadata.json for CCAAS
  cat > "$PACKAGE_DIR/metadata.json" << 'EOFMETA'
{
  "type": "ccaas",
  "label": "firefly-go"
}
EOFMETA

  # Create code directory with connection.json for CCAAS
  CODE_DIR=$(mktemp -d)
  cat > "$CODE_DIR/connection.json" << 'EOFCONN'
{
  "address": "firefly-go.chaincodes.svc.cluster.local:7052",
  "dial_timeout": "10s",
  "tls_required": false
}
EOFCONN

  # Create code.tar.gz with connection details
  tar -czf "$PACKAGE_DIR/code.tar.gz" -C "$CODE_DIR" .
  rm -rf "$CODE_DIR"

  # Create final package
  FIREFLY_PACKAGE="${BUILD_DIR}/firefly-go-${FIREFLY_VERSION}.tar.gz"
  tar -czf "$FIREFLY_PACKAGE" -C "$PACKAGE_DIR" metadata.json code.tar.gz

  successln "FireFly package created: $FIREFLY_PACKAGE"
  popd > /dev/null
fi

print ""
print "==============================="
print "Build complete!"
print "Chaincode packages are in: $BUILD_DIR"
print "==============================="

# List the packages
ls -lh "$BUILD_DIR"/*.tar.gz 2>/dev/null || true
