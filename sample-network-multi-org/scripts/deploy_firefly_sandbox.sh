#!/usr/bin/env bash
set -e

# Deploy FireFly Sandbox
# This script deploys the FireFly Sandbox UI for both organizations

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Deploying FireFly Sandbox..."

# Deploy org1 sandbox
echo "📦 Deploying Sandbox for org1..."
export ORG=org1
export NAMESPACE=org1
export FIREFLY_API_URL="http://firefly-org1-api.org1.svc.cluster.local:5000"

cat "${PROJECT_DIR}/kind/firefly/firefly-sandbox-deployment.yaml" | envsubst | kubectl apply -f -

# Deploy org2 sandbox
echo "📦 Deploying Sandbox for org2..."
export ORG=org2
export NAMESPACE=org2
export FIREFLY_API_URL="http://firefly-org2-api.org2.svc.cluster.local:5000"

cat "${PROJECT_DIR}/kind/firefly/firefly-sandbox-deployment.yaml" | envsubst | kubectl apply -f -

# Wait for deployments
echo "⏳ Waiting for deployments to be ready..."
kubectl rollout status deployment/firefly-sandbox-org1 -n org1 --timeout=2m
kubectl rollout status deployment/firefly-sandbox-org2 -n org2 --timeout=2m

echo "✅ FireFly Sandbox deployed successfully!"
echo ""
echo "🌐 Access the Sandbox at:"
echo "   Org1: https://firefly-sandbox-org1.localho.st"
echo "   Org2: https://firefly-sandbox-org2.localho.st"
echo ""
echo "💡 The Sandbox provides an interactive interface to:"
echo "   - Test FireFly APIs"
echo "   - Send messages and data"
echo "   - Deploy and invoke smart contracts"
echo "   - Manage tokens"
echo "   - And more!"
