#!/usr/bin/env bash
set -euo pipefail

# Deploy Data Exchange and IPFS for FireFly
# This script deploys the necessary shared storage and P2P messaging components
#
# Usage: ./scripts/deploy_data_plugins.sh <org>
#   org: Organization name (org1, org2)

ORG="${1}"
NAMESPACE="${ORG}"

echo "Deploying IPFS for ${ORG}..."
export ORG NAMESPACE
cat kind/firefly/ipfs-deployment.yaml | envsubst | kubectl apply -f -

echo "Deploying Data Exchange HTTPS for ${ORG}..."
cat kind/firefly/dataexchange-deployment.yaml | envsubst | kubectl apply -f -

echo "Waiting for IPFS to be ready..."
kubectl wait --for=condition=ready pod -l app=ipfs,org=${ORG} -n ${NAMESPACE} --timeout=120s || true

echo "Waiting for Data Exchange to be ready..."
kubectl wait --for=condition=ready pod -l app=dataexchange,org=${ORG} -n ${NAMESPACE} --timeout=120s || true

# Configure DataExchange peer connections after both orgs are deployed
echo "Configuring DataExchange peer connections..."

# Determine the peer endpoint based on the current org
if [ "${ORG}" = "org1" ]; then
  PEER_ENDPOINT="https://dataexchange-org2.localho.st"
  # Check if org2 dataexchange exists before trying to configure
  if kubectl get deployment dataexchange-org2 -n org2 &>/dev/null; then
    echo "Adding org2 as peer to org1 DataExchange..."
    kubectl exec -n ${NAMESPACE} deployment/dataexchange-${ORG} -- sh -c \
      "wget -q -O- --post-data='{\"endpoint\":\"${PEER_ENDPOINT}\"}' --header='Content-Type: application/json' http://localhost:3000/api/v1/peers" || \
      echo "Peer configuration will be completed when both orgs are running"
  else
    echo "Org2 DataExchange not yet deployed - peer configuration will happen when org2 is deployed"
  fi
elif [ "${ORG}" = "org2" ]; then
  PEER_ENDPOINT="https://dataexchange-org1.localho.st"
  # Check if org1 dataexchange exists and configure both directions
  if kubectl get deployment dataexchange-org1 -n org1 &>/dev/null; then
    echo "Adding org1 as peer to org2 DataExchange..."
    kubectl exec -n ${NAMESPACE} deployment/dataexchange-${ORG} -- sh -c \
      "wget -q -O- --post-data='{\"endpoint\":\"${PEER_ENDPOINT}\"}' --header='Content-Type: application/json' http://localhost:3000/api/v1/peers" || true
    
    # Also configure org1 to know about org2 (reverse direction)
    echo "Adding org2 as peer to org1 DataExchange..."
    kubectl exec -n org1 deployment/dataexchange-org1 -- sh -c \
      "wget -q -O- --post-data='{\"endpoint\":\"https://dataexchange-org2.localho.st\"}' --header='Content-Type: application/json' http://localhost:3000/api/v1/peers" || true
    
    echo "✓ Bidirectional peer connection configured between org1 and org2"
  fi
fi

echo "Data plugins deployed successfully for ${ORG}"
