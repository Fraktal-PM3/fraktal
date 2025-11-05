#!/usr/bin/env bash
#
# Setup FabConnect for a specific organization
#
# This script:
# 1. Creates Kubernetes secrets from enrollment files
# 2. Deploys FabConnect with proper configuration
# 3. Runs identity registration job
#
# Usage: ./setup_fabconnect.sh <org-name> [namespace]
#
# Example: ./setup_fabconnect.sh org1 default
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check arguments
if [ $# -lt 1 ]; then
    log_error "Organization name is required"
    echo "Usage: $0 <org-name> [namespace]"
    echo "Example: $0 org1 default"
    exit 1
fi

ORG=$1
NAMESPACE=${2:-default}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ORG_DIR="$ROOT_DIR/organizations/$ORG"

log_info "============================================"
log_info "FabConnect Setup for $ORG"
log_info "============================================"
log_info "Organization: $ORG"
log_info "Namespace: $NAMESPACE"
log_info "Root Directory: $ROOT_DIR"
log_info ""

# Check if organization directory exists
if [ ! -d "$ORG_DIR" ]; then
    log_error "Organization directory not found: $ORG_DIR"
    exit 1
fi

# Check if enrollments exist
if [ ! -d "$ORG_DIR/enrollments" ]; then
    log_error "Enrollments directory not found: $ORG_DIR/enrollments"
    log_error "Please run the enrollment script first: $ORG_DIR/enroll.sh"
    exit 1
fi

# Step 1: Create secrets
log_info "Step 1: Creating Kubernetes secrets..."
if [ -f "$SCRIPT_DIR/create_fabconnect_secrets.sh" ]; then
    bash "$SCRIPT_DIR/create_fabconnect_secrets.sh" "$ORG" "$NAMESPACE"
else
    log_warn "create_fabconnect_secrets.sh not found, skipping secret creation"
fi
log_info ""

# Step 2: Deploy FabConnect
log_info "Step 2: Deploying FabConnect..."

# Set environment variables for envsubst
export ORG=$ORG
export NAMESPACE=$NAMESPACE
export FABCONNECT_IMAGE=${FABCONNECT_IMAGE:-ghcr.io/hyperledger/firefly-fabconnect}
export FABCONNECT_TAG=${FABCONNECT_TAG:-latest}

# Create temporary file with substituted values
TEMP_DEPLOYMENT=$(mktemp)
envsubst < "$ROOT_DIR/kind/fabconnect/deployment.yaml" > "$TEMP_DEPLOYMENT"

# Apply deployment
kubectl apply -f "$TEMP_DEPLOYMENT" -n "$NAMESPACE"

# Clean up
rm -f "$TEMP_DEPLOYMENT"

log_info "FabConnect deployment created/updated"
log_info ""

# Step 3: Wait for deployment to be ready
log_info "Step 3: Waiting for FabConnect deployment to be ready..."
kubectl wait --for=condition=available --timeout=180s \
    deployment/fabconnect-${ORG} -n "$NAMESPACE" || {
    log_error "FabConnect deployment did not become available in time"
    log_info "Checking pod status..."
    kubectl get pods -l app=fabconnect,org=$ORG -n "$NAMESPACE"
    log_info "Checking pod logs..."
    kubectl logs -l app=fabconnect,org=$ORG -n "$NAMESPACE" --tail=50 || true
    exit 1
}

log_info "FabConnect is ready!"
log_info ""

# Step 4: Run identity registration job
log_info "Step 4: Running identity registration job..."

# Create temporary file with substituted values
TEMP_JOB=$(mktemp)
envsubst < "$ROOT_DIR/kind/fabconnect/identity-registration-job.yaml" > "$TEMP_JOB"

# Delete old job if it exists
kubectl delete job fabconnect-${ORG}-identity-registration -n "$NAMESPACE" 2>/dev/null || true

# Apply job
kubectl apply -f "$TEMP_JOB" -n "$NAMESPACE"

# Clean up
rm -f "$TEMP_JOB"

log_info "Identity registration job created"
log_info ""

# Step 5: Wait for job to complete
log_info "Step 5: Waiting for identity registration to complete..."
kubectl wait --for=condition=complete --timeout=180s \
    job/fabconnect-${ORG}-identity-registration -n "$NAMESPACE" || {
    log_error "Identity registration job did not complete in time"
    log_info "Checking job status..."
    kubectl get jobs fabconnect-${ORG}-identity-registration -n "$NAMESPACE"
    log_info "Checking pod logs..."
    kubectl logs -l app=fabconnect,org=$ORG,component=identity-registration -n "$NAMESPACE" || true
    exit 1
}

log_info "Identity registration completed!"
log_info ""

# Step 6: Verify setup
log_info "Step 6: Verifying FabConnect setup..."

# Get FabConnect pod name
POD_NAME=$(kubectl get pods -l app=fabconnect,org=$ORG -n "$NAMESPACE" -o jsonpath='{.items[0].metadata.name}')

if [ -z "$POD_NAME" ]; then
    log_error "Could not find FabConnect pod"
    exit 1
fi

log_info "FabConnect pod: $POD_NAME"

# Check wallet contents
log_info "Checking wallet contents..."
kubectl exec "$POD_NAME" -n "$NAMESPACE" -- ls -la /var/lib/fabconnect/wallet/ || {
    log_warn "Could not list wallet contents"
}

log_info ""
log_info "============================================"
log_info "✓ FabConnect setup completed successfully!"
log_info "============================================"
log_info ""
log_info "Next steps:"
log_info "1. Test FabConnect API:"
log_info "   kubectl port-forward svc/fabconnect-${ORG} 3000:3000 -n $NAMESPACE"
log_info "   curl http://localhost:3000/status"
log_info ""
log_info "2. View logs:"
log_info "   kubectl logs -f $POD_NAME -n $NAMESPACE"
log_info ""
log_info "3. Test identity registration:"
log_info "   curl http://localhost:3000/identities"
log_info ""
