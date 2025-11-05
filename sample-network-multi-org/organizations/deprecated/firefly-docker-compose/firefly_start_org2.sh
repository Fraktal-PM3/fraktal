#!/usr/bin/env bash
#
# Copyright contributors to the Hyperledgendary Kubernetes Test Network project
#
# SPDX-License-Identifier: Apache-2.0
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at:
#
# 	  http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# This script starts Hyperledger FireFly as an overlay on top of the Fabric network.
# FireFly provides a unified REST API and websocket interface to the Fabric blockchain,
# along with blockchain abstraction, event subscriptions, and multi-organization capabilities.
#
# Prerequisites:
#   - Fabric network must be running (peers, orderer, channel created)
#   - Chaincode installed and committed to the channel
#   - Enrollments must be complete (admin user, gateway user)
#
set -euo pipefail
. scripts/utils.sh

export NAMESPACE=org2
ORG=org2
FIREFLY_DIR="${PWD}/organizations/${ORG}/firefly"

# FireFly configuration
FIREFLY_VERSION=${FIREFLY_VERSION:-v1.3.0}
FIREFLY_PORT=${FIREFLY_PORT:-5002}
FIREFLY_UI_PORT=${FIREFLY_UI_PORT:-5003}
FABCONNECT_PORT=${FABCONNECT_PORT:-6001}
DB_PORT=${DB_PORT:-5433}

print "=========================================="
print "Starting FireFly for ${ORG}"
print "=========================================="

# Ensure firefly directory exists
mkdir -p "$FIREFLY_DIR"

#
# Setup PostgreSQL database for FireFly state
#
print "Setting up PostgreSQL database..."

# Check if PostgreSQL is already running
if ! kubectl get pod -n "$NAMESPACE" -l app=postgres &>/dev/null; then
  # Create a simple PostgreSQL deployment for FireFly
  cat > "$FIREFLY_DIR/postgres.yaml" << 'EOF'
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-init
data:
  init.sql: |
    CREATE DATABASE firefly;
    GRANT ALL PRIVILEGES ON DATABASE firefly TO postgres;
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_PASSWORD
          value: postgres
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        - name: init-scripts
          mountPath: /docker-entrypoint-initdb.d
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
      - name: init-scripts
        configMap:
          name: postgres-init
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  ports:
  - port: 5432
    targetPort: 5432
  selector:
    app: postgres
EOF

  apply_template "$FIREFLY_DIR/postgres.yaml"
  print "Waiting for PostgreSQL to be ready..."
  kubectl wait --for=condition=ready pod -l app=postgres -n "$NAMESPACE" --timeout=300s 2>/dev/null || true
  sleep 5
fi

#
# Prepare Fabric gateway credentials for FireFly
#
print "Preparing Fabric gateway credentials..."

# The gateway credentials are already enrolled by enroll.sh
# FireFly will use these to connect to the Fabric network
export FABRIC_USER_KEYSTORE="${PWD}/organizations/${ORG}/enrollments/${ORG}user/msp/keystore"
export FABRIC_USER_CERT="${PWD}/organizations/${ORG}/enrollments/${ORG}user/msp/signcerts/cert.pem"

if [ ! -f "$FABRIC_USER_CERT" ]; then
  errorln "ERROR: Gateway credentials not found at $FABRIC_USER_CERT"
  errorln "Make sure to run 'just enroll $ORG' first"
  exit 1
fi

# Get the private key file (there should be only one)
FABRIC_USER_KEY=$(ls "$FABRIC_USER_KEYSTORE"/*.pem 2>/dev/null | head -1)
if [ -z "$FABRIC_USER_KEY" ]; then
  errorln "ERROR: Private key not found in $FABRIC_USER_KEYSTORE"
  exit 1
fi

#
# Create FabConnect configuration
# FabConnect is the Hyperledger Fabric connector for FireFly
#
print "Creating FabConnect configuration..."

# Load peer connection details
export PEER_HOST="org2-peer-gateway.org2.svc.cluster.local"
export PEER_PORT="7051"

# Get the peer CA certificate
export PEER_TLSCERT="${PWD}/organizations/${ORG}/enrollments/peer1/tls/tlscacerts"
if [ ! -d "$PEER_TLSCERT" ]; then
  PEER_TLSCERT="${PWD}/organizations/${ORG}/enrollments/peer1/msp/tlscacerts"
fi

PEER_CA_CERT=$(find "$PEER_TLSCERT" -name "*.pem" 2>/dev/null | head -1)
if [ -z "$PEER_CA_CERT" ]; then
  errorln "ERROR: Peer CA certificate not found"
  exit 1
fi

#
# Create FireFly core configuration
#
print "Creating FireFly core configuration..."

cat > "$FIREFLY_DIR/firefly-core-config.yaml" << EOF
server:
  port: $FIREFLY_PORT

database:
  postgres:
    url: postgres://postgres:postgres@postgres:5432/firefly

plugins:
  blockchain:
    - name: fabric_connector
      type: fabconnect
      url: http://fabconnect:$FABCONNECT_PORT
  dataexchange:
    - name: https_exchange
      type: dataexchange-https
      initEndpoint: http://dataexchange-https:8080

log:
  level: info
EOF

print "FireFly configuration created"

#
# Create docker-compose for FireFly stack
# This runs FireFly, FabConnect, and dependencies in containers
#
print "Creating FireFly docker-compose configuration..."

cat > "$FIREFLY_DIR/docker-compose.yml" << 'EOF'
version: '3'

services:
  # PostgreSQL database for FireFly
  postgres:
    image: postgres:15-alpine
    container_name: ${ORG}_postgres
    environment:
      POSTGRES_PASSWORD: postgres
    ports:
      - "${DB_PORT}:5432"
    volumes:
      - ${ORG}_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ${ORG}_firefly

  # FabConnect - Hyperledger Fabric connector for FireFly
  fabconnect:
    image: ghcr.io/hyperledger/firefly-fabconnect:latest
    container_name: ${ORG}_fabconnect
    environment:
      FF_LOG_LEVEL: debug
      FABRIC_TLSCONFIG: true
      FABRIC_CERTPATH: /certs
    ports:
      - "${FABCONNECT_PORT}:3000"
    volumes:
      # Fabric credentials and configuration
      - ./../../organizations/${ORG}/enrollments/${ORG}user/msp:/certs/msp:ro
      - ./../../organizations/${ORG}/enrollments/peer1/msp/tlscacerts:/certs/tlscacerts:ro
    depends_on:
      - postgres
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/status"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ${ORG}_firefly

  # FireFly Core - Main REST API
  firefly:
    image: ghcr.io/hyperledger/firefly:${FIREFLY_VERSION}
    container_name: ${ORG}_firefly
    environment:
      FF_LOG_LEVEL: info
      FF_DATABASE_TYPE: postgres
      FF_DATABASE_POSTGRES_URL: postgres://postgres:postgres@postgres:5432/firefly
      FF_BLOCKCHAIN_PLUGIN: fabric_connector
      FF_FABRIC_CONNECTOR_URL: http://fabconnect:3000
      FF_DATAEXCHANGE_PLUGIN: https_exchange
    ports:
      - "${FIREFLY_PORT}:5000"
    depends_on:
      postgres:
        condition: service_healthy
      fabconnect:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/v1/status"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ${ORG}_firefly

volumes:
  ${ORG}_postgres_data:

networks:
  ${ORG}_firefly:
    driver: bridge
EOF

print "FireFly docker-compose created"

#
# Start FireFly stack
#
print "Starting FireFly stack..."

# Export variables for docker-compose substitution
export FIREFLY_VERSION
export FIREFLY_PORT
export FABCONNECT_PORT
export DB_PORT
export ORG

pushd "$FIREFLY_DIR" > /dev/null

# Pull latest images
print "Pulling FireFly container images..."
docker-compose pull 2>/dev/null || true

# Start the stack
print "Starting containers..."
docker-compose up -d

print ""
print "=========================================="
print "FireFly started for ${ORG}!"
print "=========================================="
print ""
print "FireFly Core API:     http://localhost:${FIREFLY_PORT}"
print "FabConnect API:       http://localhost:${FABCONNECT_PORT}"
print "PostgreSQL Database:  localhost:${DB_PORT}"
print ""
print "View logs:"
print "  docker-compose logs -f"
print ""

# Wait for services to be healthy
print "Waiting for FireFly services to be healthy..."
for i in {1..30}; do
  if curl -s http://localhost:${FIREFLY_PORT}/api/v1/status >/dev/null 2>&1; then
    successln "FireFly is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    errorln "FireFly did not become ready in time. Check logs with: docker-compose logs -f"
  fi
  sleep 2
done

popd > /dev/null
