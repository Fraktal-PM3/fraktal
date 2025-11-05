#!/usr/bin/env bash
#
# Create Kubernetes secrets for FabConnect from local Fabric enrollments and K8s secrets
#
# This script:
# 1. Extracts peer TLS CA certificate from Kubernetes secrets
# 2. Creates FabConnect secrets from local enrollment files
# 3. These secrets are mounted by the FabConnect deployment
#
# Usage:
#   ./scripts/create_fabconnect_secrets.sh <org>
#
# Example:
#   ./scripts/create_fabconnect_secrets.sh org1
#

set -euo pipefail

# Import utility functions
. scripts/utils.sh

ORG=${1:?"Organization name required (e.g., org1)"}
NAMESPACE=${ORG}

print "=========================================="
print "Creating FabConnect secrets for ${ORG}"
print "=========================================="

# Validate admin enrollments exist (both MSP and TLS)
ADMIN_MSP_ENROLLMENTS="${PWD}/organizations/${ORG}/enrollments/${ORG}admin/msp"
ADMIN_TLS_ENROLLMENTS="${PWD}/organizations/${ORG}/enrollments/${ORG}admin/tls"

if [ ! -d "$ADMIN_MSP_ENROLLMENTS" ]; then
  print "ERROR: Admin MSP enrollments not found at $ADMIN_MSP_ENROLLMENTS"
  print "Run 'just enroll ${ORG}' first"
  exit 1
fi

if [ ! -d "$ADMIN_TLS_ENROLLMENTS" ]; then
  print "ERROR: Admin TLS enrollments not found at $ADMIN_TLS_ENROLLMENTS"
  print "Run 'just enroll ${ORG}' first (should include TLS enrollment)"
  exit 1
fi

# Get admin TLS certificates for mutual TLS authentication with peers
ADMIN_TLS_CERT="${ADMIN_TLS_ENROLLMENTS}/signcerts/cert.pem"
ADMIN_TLS_KEY_DIR="${ADMIN_TLS_ENROLLMENTS}/keystore"

if [ ! -f "$ADMIN_TLS_CERT" ]; then
  print "ERROR: Admin TLS certificate not found at $ADMIN_TLS_CERT"
  exit 1
fi

if [ ! -d "$ADMIN_TLS_KEY_DIR" ]; then
  print "ERROR: Admin TLS keystore directory not found at $ADMIN_TLS_KEY_DIR"
  exit 1
fi

ADMIN_TLS_KEY=$(ls "$ADMIN_TLS_KEY_DIR"/*.pem 2>/dev/null | head -1)
if [ -z "$ADMIN_TLS_KEY" ]; then
  print "ERROR: Admin TLS private key not found in $ADMIN_TLS_KEY_DIR"
  exit 1
fi

# Get admin MSP certificate for transaction signing
ADMIN_MSP_CERT="${ADMIN_MSP_ENROLLMENTS}/signcerts/cert.pem"
ADMIN_MSP_KEY_DIR="${ADMIN_MSP_ENROLLMENTS}/keystore"

ADMIN_MSP_KEY=$(ls "$ADMIN_MSP_KEY_DIR"/*.pem 2>/dev/null | head -1)
if [ -z "$ADMIN_MSP_KEY" ]; then
  print "ERROR: Admin MSP private key not found in $ADMIN_MSP_KEY_DIR"
  exit 1
fi

print "Found admin MSP certificate: $ADMIN_MSP_CERT"
print "Found admin MSP private key: $ADMIN_MSP_KEY"
print "Found admin TLS certificate: $ADMIN_TLS_CERT"
print "Found admin TLS private key: $ADMIN_TLS_KEY"

# Extract peer TLS CA certificate from Kubernetes secret
print "Extracting peer TLS CA certificate from Kubernetes..."

# Determine peer number (usually peer1, but could be configurable)
PEER_NUM=${PEER_NUM:-1}
PEER_NAME="peer${PEER_NUM}"

# The peer TLS CA is stored in a Kubernetes secret created by fabric-operator
# Format: tls-${PEER_NAME}-cacerts in the org namespace
TLS_SECRET_NAME="tls-${PEER_NAME}-cacerts"

# Check if the secret exists
if ! kubectl get secret -n "$NAMESPACE" "$TLS_SECRET_NAME" &>/dev/null; then
  print "ERROR: Kubernetes secret '${TLS_SECRET_NAME}' not found in namespace '${NAMESPACE}'"
  print "Expected: kubectl get secret -n ${NAMESPACE} ${TLS_SECRET_NAME}"
  print ""
  print "Available TLS secrets in ${NAMESPACE}:"
  kubectl get secrets -n "$NAMESPACE" | grep -i tls || true
  exit 1
fi

# Extract the TLS CA certificate from the secret
PEER_TLSCA_PEM=$(kubectl get secret -n "$NAMESPACE" "$TLS_SECRET_NAME" \
  -o jsonpath='{.data.cacert-0\.pem}' | base64 -d)

if [ -z "$PEER_TLSCA_PEM" ]; then
  print "ERROR: Failed to extract TLS CA certificate from secret"
  exit 1
fi

print "Successfully extracted peer TLS CA certificate"

# Create temporary directory for secret files
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Create subdirectories for different secret types
mkdir -p "$TEMP_DIR/admin-msp" "$TEMP_DIR/admin-tls"

# Copy admin MSP certificates (for transaction signing)
cp "$ADMIN_MSP_CERT" "$TEMP_DIR/admin-msp/signcert.pem"
cp "$ADMIN_MSP_KEY" "$TEMP_DIR/admin-msp/keystore.pem"

# Copy admin TLS certificates (for mutual TLS authentication with peers)
cp "$ADMIN_TLS_CERT" "$TEMP_DIR/admin-tls/signcert.pem"
cp "$ADMIN_TLS_KEY" "$TEMP_DIR/admin-tls/keystore.pem"

# Peer TLS CA certificate for server verification
echo "$PEER_TLSCA_PEM" > "$TEMP_DIR/tlsca.pem"

# Create or update the admin MSP certificate secret (for transaction signing)
print "Creating admin MSP secret: fabconnect-${ORG}-admin-msp"
kubectl create secret generic "fabconnect-${ORG}-admin-msp" \
  --from-file=signcert.pem="$TEMP_DIR/admin-msp/signcert.pem" \
  --from-file=keystore.pem="$TEMP_DIR/admin-msp/keystore.pem" \
  -n "$NAMESPACE" \
  --dry-run=client -o yaml | kubectl apply -f -

# Create or update the admin TLS certificate secret (for mutual TLS with peers)
print "Creating admin TLS client certificate secret: fabconnect-${ORG}-admin-tls"
kubectl create secret generic "fabconnect-${ORG}-admin-tls" \
  --from-file=signcert.pem="$TEMP_DIR/admin-tls/signcert.pem" \
  --from-file=keystore.pem="$TEMP_DIR/admin-tls/keystore.pem" \
  -n "$NAMESPACE" \
  --dry-run=client -o yaml | kubectl apply -f -

# Create or update the peer TLS CA secret (for server certificate verification)
print "Creating peer TLS CA secret: fabconnect-${ORG}-peer-tlsca"
kubectl create secret generic "fabconnect-${ORG}-peer-tlsca" \
  --from-file=tlsca.pem="$TEMP_DIR/tlsca.pem" \
  -n "$NAMESPACE" \
  --dry-run=client -o yaml | kubectl apply -f -

# Label the secrets for easy identification
kubectl label secret "fabconnect-${ORG}-admin-msp" \
  -n "$NAMESPACE" \
  app=fabconnect org="$ORG" \
  --overwrite

kubectl label secret "fabconnect-${ORG}-admin-tls" \
  -n "$NAMESPACE" \
  app=fabconnect org="$ORG" \
  --overwrite

kubectl label secret "fabconnect-${ORG}-peer-tlsca" \
  -n "$NAMESPACE" \
  app=fabconnect org="$ORG" \
  --overwrite

print ""
print "FabConnect secrets created successfully for ${ORG}!"
print ""
print "Secrets created:"
kubectl get secrets -n "$NAMESPACE" -l app=fabconnect,org="$ORG"
print ""
print "To verify secret contents:"
print "  kubectl get secret -n ${NAMESPACE} fabconnect-${ORG}-user-certs -o json | jq '.data | keys'"
print "  kubectl get secret -n ${NAMESPACE} fabconnect-${ORG}-peer-tlsca -o json | jq '.data | keys'"
