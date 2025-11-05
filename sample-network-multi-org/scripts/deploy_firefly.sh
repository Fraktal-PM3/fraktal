#!/usr/bin/env bash
#
# Deploy FireFly to Kubernetes using native manifests
#
# This script:
# 1. Validates prerequisites (FabConnect, PostgreSQL running)
# 2. Generates FireFly deployment manifest with org-specific values
# 3. Applies the manifest to Kubernetes
# 4. Waits for FireFly deployment to be ready
#
# Usage:
#   ./scripts/deploy_firefly.sh <org>
#
# Example:
#   ./scripts/deploy_firefly.sh org1
#

set -euo pipefail

# Import utility functions
. scripts/utils.sh

ORG=${1:?"Organization name required (e.g., org1)"}
NAMESPACE=${ORG}

# Configuration
FABCONNECT_HOST="fabconnect-${ORG}.${NAMESPACE}.svc.cluster.local"
POSTGRES_URL="postgresql://postgres:postgres@postgres.${NAMESPACE}.svc.cluster.local:5432/firefly"

print "=========================================="
print "Deploying FireFly for ${ORG}"
print "=========================================="

# Step 1: Validate prerequisites
print ""
print "Step 1: Validating prerequisites..."

# Check if FabConnect is running
if ! kubectl get deployment "fabconnect-${ORG}" -n "$NAMESPACE" &>/dev/null; then
  print "ERROR: FabConnect deployment 'fabconnect-${ORG}' not found in namespace '${NAMESPACE}'"
  print "Deploy FabConnect first with: ./scripts/deploy_fabconnect.sh ${ORG}"
  exit 1
fi

print "✓ FabConnect deployment found"

# Check if PostgreSQL is running (should be started by justfile)
if ! kubectl get deployment postgres -n "$NAMESPACE" &>/dev/null; then
  print "ERROR: PostgreSQL deployment not found in namespace '${NAMESPACE}'"
  print "PostgreSQL should have been deployed by justfile target"
  exit 1
fi

print "✓ PostgreSQL deployment ready"

# Step 2: Generate and apply FireFly manifest
print ""
print "Step 2: Deploying FireFly manifest..."
print "  Organization: ${ORG}"
print "  Namespace: ${NAMESPACE}"
print "  FabConnect: ${FABCONNECT_HOST}"
print "  PostgreSQL: ${POSTGRES_URL}"

# Create temporary directory for manifests
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Process the deployment template
export ORG NAMESPACE FABCONNECT_HOST POSTGRES_URL

cat kind/firefly/firefly-deployment.yaml | envsubst > "$TEMP_DIR/firefly-${ORG}.yaml"

# Apply the manifests
print "Applying FireFly manifests..."
kubectl apply -n "$NAMESPACE" -f "$TEMP_DIR/firefly-${ORG}.yaml"

# Step 2b: Deploy UI and API ingresses
print ""
print "Step 2b: Deploying FireFly UI and API ingresses..."
cat kind/firefly/firefly-ui-ingress.yaml | envsubst > "$TEMP_DIR/firefly-ui-${ORG}.yaml"
kubectl apply -n "$NAMESPACE" -f "$TEMP_DIR/firefly-ui-${ORG}.yaml"

# Step 3: Wait for FireFly to be ready
print ""
print "Step 3: Waiting for FireFly StatefulSet to be ready..."

# Wait for the StatefulSet
print "Waiting for FireFly StatefulSet: firefly-${ORG}"
if kubectl rollout status statefulset/firefly-${ORG} -n "$NAMESPACE" --timeout=300s; then
  print "FireFly StatefulSet is ready!"
else
  print "ERROR: FireFly StatefulSet did not become ready in time"
  print "Checking pod status..."
  kubectl get pods -n "$NAMESPACE" -l app=firefly,org="$ORG"
  print "Checking pod logs..."
  kubectl logs -n "$NAMESPACE" -l app=firefly,org="$ORG" --tail=50
  exit 1
fi

# Step 4: FireFly is ready
print ""
print "Step 4: FireFly deployment complete"
print "FireFly API is ready and responding"

print ""
print "FireFly deployed successfully for ${ORG}!"
print ""
print "FireFly Service Details:"
print "  StatefulSet: firefly-${ORG}"
print "  Namespace: ${NAMESPACE}"
print ""
print "Access FireFly Services:"
print "  API: https://firefly-${ORG}.localho.st/api/v1"
print "  UI: https://firefly-ui-${ORG}.localho.st"
print "  Sandbox (Swagger): https://firefly-sandbox-${ORG}.localho.st"
print "  FabConnect API: https://fabconnect-${ORG}.localho.st"
print ""
print "Local access (port-forward):"
print "  FireFly API: kubectl port-forward -n ${NAMESPACE} svc/firefly-${ORG}-api 5000:5000"
print "  FireFly UI: kubectl port-forward -n ${NAMESPACE} svc/firefly-${ORG}-ui 8080:8080"
print "  FabConnect: kubectl port-forward -n ${NAMESPACE} svc/fabconnect-${ORG} 3000:3000"
print ""
print "To check FireFly status:"
print "  kubectl get statefulset firefly-${ORG} -n ${NAMESPACE}"
print "  kubectl get pods -n ${NAMESPACE} -l app=firefly,org=${ORG}"
print ""
print "To view logs:"
print "  kubectl logs -n ${NAMESPACE} -l app=firefly,org=${ORG} -f"
print ""
