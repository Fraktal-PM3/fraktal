#!/usr/bin/env bash
#
# Deploy chaincode services to Kubernetes (CCAAS)
#
# Usage:
#   ./scripts/deploy_chaincode_services.sh [pm3|firefly|all]
#

set -euo pipefail

CWDIR=$(cd "$(dirname "$0")/.." && pwd)

# Determine which services to deploy
DEPLOY_PM3=${1:-all}
if [ "$DEPLOY_PM3" = "firefly" ] || [ "$DEPLOY_PM3" = "all" ]; then
  DEPLOY_FIREFLY=true
else
  DEPLOY_FIREFLY=false
fi

if [ "$DEPLOY_PM3" = "firefly" ]; then
  DEPLOY_PM3=false
else
  DEPLOY_PM3=true
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
# Deploy PM3 Chaincode Service
#
if [ "$DEPLOY_PM3" = true ]; then
  print "==============================="
  print "Deploying PM3 Chaincode Service"
  print "==============================="

  PM3_MANIFEST="${CWDIR}/kind/chaincodes/pm3package.yaml"
  PM3_PACKAGE="${CWDIR}/build/pm3package-1.0.tar.gz"

  if [ ! -f "$PM3_MANIFEST" ]; then
    errorln "PM3 manifest not found: $PM3_MANIFEST"
    exit 1
  fi

  if [ ! -f "$PM3_PACKAGE" ]; then
    errorln "PM3 package not found: $PM3_PACKAGE"
    errorln "Run ./scripts/build_chaincodes.sh first"
    exit 1
  fi

  print "Getting PM3 chaincode package ID..."
  # Calculate package ID using peer CLI
  # This is the authoritative way to get the package ID that peers will use
  PEER_POD=$(kubectl get pod -n org1 -l app=peer1 -o jsonpath='{.items[0].metadata.name}')
  
  kubectl cp "$PM3_PACKAGE" "org1/$PEER_POD:/tmp/pm3package-1.0.tar.gz" -c peer
  PM3_PACKAGE_ID=$(kubectl exec -n org1 "$PEER_POD" -c peer -- \
    peer lifecycle chaincode calculatepackageid /tmp/pm3package-1.0.tar.gz 2>/dev/null)
  
  print "PM3 package ID: $PM3_PACKAGE_ID"

  print "Applying PM3 Kubernetes manifests..."
  kubectl apply -f "$PM3_MANIFEST"

  print "Updating PM3 deployment with correct CHAINCODE_CCID..."
  kubectl set env deployment/pm3package -n chaincodes \
    CHAINCODE_CCID="$PM3_PACKAGE_ID" \
    CORE_CHAINCODE_ID_NAME="$PM3_PACKAGE_ID"

  print "Waiting for PM3 deployment to be ready..."
  kubectl rollout status deployment/pm3package -n chaincodes --timeout=5m

  # Get service information
  PM3_SERVICE=$(kubectl get svc pm3package -n chaincodes -o jsonpath='{.spec.clusterIP}:{.spec.ports[0].port}')
  successln "PM3 service deployed: $PM3_SERVICE with CCID: $PM3_PACKAGE_ID"
fi

#
# Deploy FireFly Go Chaincode Service
#
if [ "$DEPLOY_FIREFLY" = true ]; then
  print "==============================="
  print "Deploying FireFly Go Chaincode Service"
  print "==============================="

  FIREFLY_MANIFEST="${CWDIR}/kind/chaincodes/firefly-go.yaml"

  if [ ! -f "$FIREFLY_MANIFEST" ]; then
    errorln "FireFly manifest not found: $FIREFLY_MANIFEST"
    exit 1
  fi

  # Calculate the package ID from the chaincode package file
  FIREFLY_PACKAGE="${CWDIR}/build/firefly-go-1.0.tar.gz"
  
  if [ ! -f "$FIREFLY_PACKAGE" ]; then
    errorln "FireFly package not found: $FIREFLY_PACKAGE"
    errorln "Run ./scripts/build_chaincodes.sh first"
    exit 1
  fi
  
  print "Getting FireFly chaincode package ID..."
  # Calculate package ID using peer CLI
  # This is the authoritative way to get the package ID that peers will use
  PEER_POD=$(kubectl get pod -n org1 -l app=peer1 -o jsonpath='{.items[0].metadata.name}')
  
  kubectl cp "$FIREFLY_PACKAGE" "org1/$PEER_POD:/tmp/firefly-go-1.0.tar.gz" -c peer
  FIREFLY_PACKAGE_ID=$(kubectl exec -n org1 "$PEER_POD" -c peer -- \
    peer lifecycle chaincode calculatepackageid /tmp/firefly-go-1.0.tar.gz 2>/dev/null)
  
  print "FireFly package ID: $FIREFLY_PACKAGE_ID"

  print "Applying FireFly Kubernetes manifests..."
  kubectl apply -f "$FIREFLY_MANIFEST"

  print "Updating chaincode deployment with correct CHAINCODE_CCID..."
  kubectl set env deployment/firefly-go -n chaincodes \
    CHAINCODE_CCID="$FIREFLY_PACKAGE_ID" \
    CORE_CHAINCODE_ID_NAME="$FIREFLY_PACKAGE_ID"

  print "Waiting for FireFly deployment to be ready..."
  kubectl rollout status deployment/firefly-go -n chaincodes --timeout=5m

  # Get service information
  FIREFLY_SERVICE=$(kubectl get svc firefly-go -n chaincodes -o jsonpath='{.spec.clusterIP}:{.spec.ports[0].port}')
  successln "FireFly service deployed: $FIREFLY_SERVICE with CCID: $FIREFLY_PACKAGE_ID"
fi

print ""
print "==============================="
print "Chaincode services deployed!"
print "==============================="

# Verify all services are running
kubectl get all -n chaincodes
