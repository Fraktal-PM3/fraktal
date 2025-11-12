#!/usr/bin/env bash
set -euo pipefail

# Create a local kind cluster for testing Fraktal deployments
CLUSTER_NAME=${1:-fraktal}

cat <<EOF | kind create cluster --name "$CLUSTER_NAME" --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
  - role: worker
EOF

echo "Kind cluster '$CLUSTER_NAME' created."
