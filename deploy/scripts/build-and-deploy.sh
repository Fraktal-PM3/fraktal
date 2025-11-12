#!/usr/bin/env bash
set -euo pipefail

# Build images, optionally load into kind, then deploy k8s manifests using kubectl or helm.
# Usage: ./build-and-deploy.sh [--kind <cluster-name>] [--skip-build]

CLUSTER_NAME="fraktal"
SKIP_BUILD=false

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

while [[ $# -gt 0 ]]; do
  case $1 in
    --kind)
      CLUSTER_NAME="$2"; shift 2;;
    --skip-build)
      SKIP_BUILD=true; shift;;
    *) echo "Unknown arg: $1"; exit 1;;
  esac

done


if [ "$SKIP_BUILD" = false ]; then
  echo "Building placeholder images..."
  if [ -d "$ROOT_DIR/api" ]; then
    docker build -t ghcr.io/your-org/fraktal-api:dev "$ROOT_DIR/api"
  else
    echo "Skipping ./api build — directory not found: $ROOT_DIR/api"
  fi

  if [ -d "$ROOT_DIR/web" ]; then
    docker build -t ghcr.io/your-org/fraktal-web:dev "$ROOT_DIR/web"
  else
    echo "Skipping ./web build — directory not found: $ROOT_DIR/web"
  fi
fi

# If kind exists, load images (only if they exist locally)
if command -v kind >/dev/null 2>&1 && kind get clusters | grep -q "$CLUSTER_NAME"; then
  echo "Loading images into kind cluster $CLUSTER_NAME"
  if docker image inspect ghcr.io/your-org/fraktal-api:dev >/dev/null 2>&1; then
    kind load docker-image ghcr.io/your-org/fraktal-api:dev --name "$CLUSTER_NAME"
  else
    echo "Image ghcr.io/your-org/fraktal-api:dev not present locally — skipping kind load"
  fi

  if docker image inspect ghcr.io/your-org/fraktal-web:dev >/dev/null 2>&1; then
    kind load docker-image ghcr.io/your-org/fraktal-web:dev --name "$CLUSTER_NAME"
  else
    echo "Image ghcr.io/your-org/fraktal-web:dev not present locally — skipping kind load"
  fi
fi

# Deploy base kustomize (use absolute path so script can be run from anywhere)
KUSTOMIZE_PATH="$ROOT_DIR/deploy/k8s/overlays/dev"
if [ -d "$KUSTOMIZE_PATH" ]; then
  kubectl apply -k "$KUSTOMIZE_PATH"
  echo "Deployment applied (dev overlay)."
else
  echo "ERROR: kustomize overlay not found at: $KUSTOMIZE_PATH"
  exit 1
fi
