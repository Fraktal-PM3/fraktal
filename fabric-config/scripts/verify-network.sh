#!/bin/bash
# Fabric Network Verification Script

set -e

# Determine the script's directory and network config path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_CONFIG="$(cd "$SCRIPT_DIR/../network-config" && pwd)"
ORG_PATH="$NETWORK_CONFIG/organizations/rootorg"
DOCKER_COMPOSE_FILE="$NETWORK_CONFIG/docker-compose.yml"

echo "======================================"
echo "  Fabric Network Verification"
echo "======================================"
echo ""

# Parse docker-compose.yml to get all services
echo "📋 Parsing network configuration..."
# Extract all service names that start with pm3_ (excluding cli tools)
SERVICES=($(docker compose -f "$DOCKER_COMPOSE_FILE" config --services | grep "^pm3_" | grep -v "_cli$" || echo ""))
ORDERERS=($(printf '%s\n' "${SERVICES[@]}" | grep "orderer" || echo ""))
PEERS=($(printf '%s\n' "${SERVICES[@]}" | grep "peer" || echo ""))
CA_SERVICE=$(printf '%s\n' "${SERVICES[@]}" | grep "ca" || echo "pm3_fabric_ca")

echo "   Found $(echo ${#ORDERERS[@]}) orderer(s), $(echo ${#PEERS[@]}) peer(s), 1 CA"
echo ""

# 1. Container Status
echo "1. Container Status:"
echo "-----------------------------------"
all_running=true
for container in "${SERVICES[@]}"; do
    container_name=$(docker compose -f "$DOCKER_COMPOSE_FILE" ps --format json | jq -r "select(.Service==\"$container\") | .Name" 2>/dev/null || echo "$container")
    status=$(docker ps --filter "name=$container_name" --format "{{.Status}}" 2>/dev/null || echo "NOT RUNNING")
    if [[ $status == *"Up"* ]]; then
        echo "   ✓ $container_name: Running ($(echo $status | cut -d'(' -f1))"
    else
        echo "   ✗ $container_name: $status"
        all_running=false
    fi
done
echo ""

if [ "$all_running" = false ]; then
    echo "❌ Some containers are not running. Exiting..."
    exit 1
fi

# 2. CA Verification
echo "2. Certificate Authority:"
echo "-----------------------------------"
cd "$ORG_PATH"
export FABRIC_CA_CLIENT_HOME="$PWD"
identity_count=$(fabric-ca-client identity list --tls.certfiles ca/ca-cert.pem 2>/dev/null | grep "^Name:" | wc -l)
echo "   ✓ Registered identities: $identity_count"
cert_count=$(fabric-ca-client certificate list --tls.certfiles ca/ca-cert.pem 2>/dev/null | grep "Serial Number:" | wc -l)
echo "   ✓ Enrolled certificates: $cert_count"
echo ""

# 3. Orderer Health Check
echo "3. Orderer Health Check:"
echo "-----------------------------------"
for orderer_service in "${ORDERERS[@]}"; do
    # Extract orderer name (e.g., orderer0 from pm3_orderer0)
    orderer_name=${orderer_service#pm3_}
    
    # Get ports from docker-compose file for this orderer
    admin_port=$(docker compose -f "$DOCKER_COMPOSE_FILE" config | yq e ".services.$orderer_service.ports[]" - 2>/dev/null | grep ":9200$" | cut -d':' -f1 || echo "9200")
    ops_port=$(docker compose -f "$DOCKER_COMPOSE_FILE" config | yq e ".services.$orderer_service.ports[]" - 2>/dev/null | grep -E ":91[0-9]+$" | cut -d':' -f1 || echo "9150")
    
    # Find orderer directory
    orderer_dir="$ORG_PATH/orderers/${orderer_name}.rootorg.pm3.org"
    
    if [ -d "$orderer_dir" ]; then
        # Check orderer admin endpoint
        orderer_admin_check=$(osnadmin channel list \
            --orderer-address localhost:$admin_port \
            --ca-file "$orderer_dir/tls/ca.crt" \
            --client-cert "$orderer_dir/tls/server.crt" \
            --client-key "$orderer_dir/tls/server.key" 2>&1 || echo "FAILED")
        if echo "$orderer_admin_check" | grep -q "Status: 200"; then
            echo "   ✓ $orderer_name admin endpoint: reachable (port $admin_port)"
        else
            echo "   ✗ $orderer_name admin endpoint: FAILED"
        fi
        
        # Check orderer operations endpoint
        orderer_ops_health=$(curl -s http://localhost:$ops_port/healthz 2>/dev/null || echo "FAILED")
        if [[ $orderer_ops_health == *"OK"* ]] || echo "$orderer_ops_health" | grep -q "status.*OK"; then
            echo "   ✓ $orderer_name operations endpoint: healthy (port $ops_port)"
        else
            echo "   ℹ $orderer_name operations: $(echo $orderer_ops_health | head -c 50)"
        fi
    fi
    
    # Check for errors in orderer logs
    orderer_errors=$(docker logs $orderer_service 2>&1 | grep -i "panic\|fatal" | tail -3 || echo "")
    if [ -z "$orderer_errors" ]; then
        echo "   ✓ $orderer_name logs: No critical errors"
    else
        echo "   ⚠ $orderer_name has errors (check logs)"
    fi
done
echo ""

# 4. Peer Health Checks
echo "4. Peer Health Checks:"
echo "-----------------------------------"
for peer_service in "${PEERS[@]}"; do
    # Extract peer name (e.g., peer0 from pm3_peer0)
    peer_name=${peer_service#pm3_}
    
    # Get operations port from docker-compose file
    ops_port=$(docker compose -f "$DOCKER_COMPOSE_FILE" config | yq e ".services.$peer_service.ports[]" - 2>/dev/null | grep -E ":90[0-9]+$" | cut -d':' -f1 || echo "9050")
    
    peer_health=$(curl -s http://localhost:$ops_port/healthz 2>/dev/null || echo "FAILED")
    if [[ $peer_health == *"OK"* ]] || echo "$peer_health" | grep -q "status.*OK"; then
        echo "   ✓ $peer_name operations endpoint: healthy (port $ops_port)"
    else
        echo "   ℹ $peer_name operations: $(echo $peer_health | head -c 50)"
    fi
    
    # Check for errors
    peer_errors=$(docker logs $peer_service 2>&1 | grep -i "panic\|fatal" | tail -3 || echo "")
    if [ -z "$peer_errors" ]; then
        echo "   ✓ $peer_name logs: No critical errors"
    else
        echo "   ⚠ $peer_name has errors (check logs)"
    fi
done
echo ""

# 5. Channel Status
echo "5. Channel Status:"
echo "-----------------------------------"
# Check if channel exists via osnadmin on first orderer
first_orderer="${ORDERERS[0]}"
orderer_name=${first_orderer#pm3_}
orderer_dir="$ORG_PATH/orderers/${orderer_name}.rootorg.pm3.org"
admin_port=$(docker compose -f "$DOCKER_COMPOSE_FILE" config | yq e ".services.$first_orderer.ports[]" - 2>/dev/null | grep ":9200$" | cut -d':' -f1 || echo "9200")

export FABRIC_CFG_PATH="$ORG_PATH"
export ORDERER_CA="$orderer_dir/tls/ca.crt"
export ORDERER_ADMIN_TLS_SIGN_CERT="$orderer_dir/tls/server.crt"
export ORDERER_ADMIN_TLS_PRIVATE_KEY="$orderer_dir/tls/server.key"

channel_info=$(osnadmin channel list \
    --orderer-address localhost:$admin_port \
    --ca-file "$ORDERER_CA" \
    --client-cert "$ORDERER_ADMIN_TLS_SIGN_CERT" \
    --client-key "$ORDERER_ADMIN_TLS_PRIVATE_KEY" 2>&1)

if echo "$channel_info" | grep -q "pm3"; then
    echo "   ✓ Channel 'pm3' exists on $orderer_name"
    height=$(echo "$channel_info" | grep -oP 'Height: \K[0-9]+' || echo "unknown")
    echo "   ✓ Channel height: $height blocks"
    
    # Verify ledger data exists on orderer (host filesystem check)
    orderer_ledger_dir="$orderer_dir/data/chains/pm3"
    if [ -d "$orderer_ledger_dir" ]; then
        block_count=$(ls -1 "$orderer_ledger_dir"/blockfile_* 2>/dev/null | wc -l || echo "0")
        echo "   ✓ Orderer ledger data exists ($block_count blockfile(s))"
    else
        echo "   ⚠ Orderer ledger data not found on host filesystem"
    fi
else
    echo "   ✗ Channel 'pm3' not found"
fi
echo ""

# 6. Peer Channel Participation
echo "6. Peer Channel Participation:"
echo "-----------------------------------"
# Check if peers have channel ledger data by examining the container filesystem
for peer_service in "${PEERS[@]}"; do
    peer_name=${peer_service#pm3_}
    
    # Check inside the container first (most reliable)
    ledger_check=$(docker exec $peer_service ls /var/hyperledger/production/ledgersData/chains/chains/ 2>/dev/null || echo "")
    
    if echo "$ledger_check" | grep -q "pm3"; then
        # Count blockfiles in the container
        block_count=$(docker exec $peer_service ls -1 /var/hyperledger/production/ledgersData/chains/chains/pm3/blockfile_* 2>/dev/null | wc -l || echo "0")
        echo "   ✓ $peer_name has joined channel 'pm3' ($block_count blockfile(s))"
    else
        # Also check host filesystem as backup (if volume is mounted)
        peer_ledger_dir="$ORG_PATH/peers/${peer_name}.rootorg.pm3.org/data/ledgersData/chains/chains/pm3"
        if [ -d "$peer_ledger_dir" ]; then
            block_count=$(ls -1 "$peer_ledger_dir"/blockfile_* 2>/dev/null | wc -l || echo "0")
            echo "   ✓ $peer_name has joined channel 'pm3' ($block_count blockfile(s) on host)"
        else
            echo "   ✗ $peer_name has not joined channel 'pm3' (no ledger data found)"
        fi
    fi
done
echo ""

# 7. Network Connectivity
echo "7. Network Connectivity:"
echo "-----------------------------------"
# Check if peers can connect to orderers
for peer_service in "${PEERS[@]}"; do
    peer_name=${peer_service#pm3_}
    for orderer_service in "${ORDERERS[@]}"; do
        orderer_name=${orderer_service#pm3_}
        # Get orderer listen port from docker-compose
        orderer_port=$(docker compose -f "$DOCKER_COMPOSE_FILE" config | yq e ".services.$orderer_service.environment.ORDERER_GENERAL_LISTENPORT" - 2>/dev/null | tr -d '"' || echo "7100")
        
        orderer_ping=$(docker exec $peer_service nc -zv $orderer_service $orderer_port 2>&1 || echo "FAILED")
        if [[ $orderer_ping == *"succeeded"* ]] || [[ $orderer_ping == *"open"* ]]; then
            echo "   ✓ $peer_name can reach $orderer_name"
        else
            echo "   ℹ $peer_name to $orderer_name: $(echo $orderer_ping | head -c 60)"
        fi
    done
done

# Check peer-to-peer connectivity
if [ ${#PEERS[@]} -gt 1 ]; then
    for ((i=0; i<${#PEERS[@]}; i++)); do
        peer1_service="${PEERS[$i]}"
        peer1_name=${peer1_service#pm3_}
        for ((j=i+1; j<${#PEERS[@]}; j++)); do
            peer2_service="${PEERS[$j]}"
            peer2_name=${peer2_service#pm3_}
            # Get peer listen port
            peer2_port=$(docker compose -f "$DOCKER_COMPOSE_FILE" config | yq e ".services.$peer2_service.environment.CORE_PEER_LISTENADDRESS" - 2>/dev/null | cut -d':' -f2 || echo "7051")
            
            peer_ping=$(docker exec $peer1_service nc -zv $peer2_service $peer2_port 2>&1 || echo "FAILED")
            if [[ $peer_ping == *"succeeded"* ]] || [[ $peer_ping == *"open"* ]]; then
                echo "   ✓ $peer1_name can reach $peer2_name"
            else
                echo "   ℹ $peer1_name to $peer2_name: $(echo $peer_ping | head -c 60)"
            fi
        done
    done
fi
echo ""

# 8. Summary
echo "======================================"
echo "  Verification Summary"
echo "======================================"
if [ "$all_running" = true ] && echo "$channel_info" | grep -q "pm3"; then
    echo "✅ Network is operational!"
    echo ""
    echo "Key Endpoints:"
    
    # List orderers with their ports
    for orderer_service in "${ORDERERS[@]}"; do
        orderer_name=${orderer_service#pm3_}
        listen_port=$(docker compose -f "$DOCKER_COMPOSE_FILE" config | yq e ".services.$orderer_service.ports[]" - 2>/dev/null | grep -E "^71[0-9]+:" | cut -d':' -f1)
        admin_port=$(docker compose -f "$DOCKER_COMPOSE_FILE" config | yq e ".services.$orderer_service.ports[]" - 2>/dev/null | grep ":9200$" | cut -d':' -f1)
        echo "  • $orderer_name:      localhost:$listen_port (admin: $admin_port)"
    done
    
    # List peers with their ports
    for peer_service in "${PEERS[@]}"; do
        peer_name=${peer_service#pm3_}
        listen_port=$(docker compose -f "$DOCKER_COMPOSE_FILE" config | yq e ".services.$peer_service.ports[]" - 2>/dev/null | grep -E "^70[0-9]+:" | cut -d':' -f1)
        echo "  • $peer_name:        localhost:$listen_port"
    done
    
    # List CA
    ca_port=$(docker compose -f "$DOCKER_COMPOSE_FILE" config | yq e ".services.$CA_SERVICE.ports[]" - 2>/dev/null | grep -E "^90[0-9]+:" | cut -d':' -f1)
    echo "  • Fabric CA:    localhost:$ca_port"
else
    echo "⚠️  Network has issues - review details above"
fi
echo ""
