#!/usr/bin/env bash
#
# Deploy FabConnect to Kubernetes for a given organization
#
# This script:
# 1. Creates necessary secrets from enrollment certificates
# 2. Applies FabConnect deployment manifest with org-specific values
# 3. Waits for FabConnect service to be ready
#
# Usage:
#   ./scripts/deploy_fabconnect.sh <org>
#
# Example:
#   ./scripts/deploy_fabconnect.sh org1
#

set -euo pipefail

# Import utility functions
. scripts/utils.sh

ORG=${1:?"Organization name required (e.g., org1)"}
NAMESPACE=${ORG}

# Configuration
FABCONNECT_IMAGE=${FABCONNECT_IMAGE:-"ghcr.io/hyperledger/firefly-fabconnect:latest"}
PEER_GATEWAY_PORT=${PEER_GATEWAY_PORT:-7051}
CHANNEL_NAME=${CHANNEL_NAME:-pm3}
FABCONNECT_PORT=${FABCONNECT_PORT:-3000}

# Export for envsubst
export FABCONNECT_IMAGE PEER_GATEWAY_PORT CHANNEL_NAME FABCONNECT_PORT

print "=========================================="
print "Deploying FabConnect for ${ORG}"
print "=========================================="

# Step 1: Create secrets
print ""
print "Step 1: Creating FabConnect secrets..."
./scripts/create_fabconnect_secrets.sh "$ORG"

# Step 2: Determine peer gateway host
# Pattern: peer-gateway.${NAMESPACE}.svc.cluster.local
PEER_GATEWAY_HOST="peer-gateway.${NAMESPACE}.svc.cluster.local"

print ""
print "Step 2: Deploying FabConnect manifest..."
print "  Organization: ${ORG}"
print "  Namespace: ${NAMESPACE}"
print "  Peer Gateway: ${PEER_GATEWAY_HOST}:${PEER_GATEWAY_PORT}"
print "  Channel: ${CHANNEL_NAME}"
print "  Image: ${FABCONNECT_IMAGE}"

# Apply FabConnect deployment using envsubst
export ORG NAMESPACE FABCONNECT_IMAGE PEER_GATEWAY_HOST PEER_GATEWAY_PORT CHANNEL_NAME

# Create temporary directory for templates
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Process the deployment template
cat kind/fabconnect/deployment.yaml | envsubst > "$TEMP_DIR/fabconnect-${ORG}.yaml"

# Apply the manifests
print "Applying FabConnect manifests..."
kubectl apply -n "$NAMESPACE" -f "$TEMP_DIR/fabconnect-${ORG}.yaml"

# Step 3: Wait for FabConnect to be ready
print ""
print "Step 3: Waiting for FabConnect to be ready..."

# Wait for the deployment
print "Waiting for FabConnect deployment to be ready..."
if kubectl rollout status deployment/fabconnect-${ORG} -n "$NAMESPACE" --timeout=300s; then
  print "FabConnect deployment is ready!"
else
  print "ERROR: FabConnect deployment did not become ready in time"
  print "Checking pod status..."
  kubectl get pods -n "$NAMESPACE" -l app=fabconnect,org="$ORG"
  print "Checking pod logs..."
  kubectl logs -n "$NAMESPACE" -l app=fabconnect,org="$ORG" --tail=50
  exit 1
fi

# FabConnect is ready - readiness probe confirmed it's responding
print "FabConnect API is ready"

print ""
print "FabConnect deployed successfully for ${ORG}!"
print ""
print "FabConnect Service Details:"
print "  Service Name: fabconnect-${ORG}"
print "  Namespace: ${NAMESPACE}"
print "  Internal Endpoint: fabconnect-${ORG}.${NAMESPACE}.svc.cluster.local:3000"
print "  Swagger UI: http://fabconnect-${ORG}.${NAMESPACE}.svc.cluster.local:3000/api"
print ""
print "To check FabConnect status:"
print "  kubectl exec -n ${NAMESPACE} -it deployment/fabconnect-${ORG} -- curl http://localhost:3000/status"
print ""
print "To view logs:"
print "  kubectl logs -n ${NAMESPACE} -l app=fabconnect,org=${ORG} -f"
print ""
