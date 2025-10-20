#!/bin/bash
# Fabric CA Verification Script

set -e

CA_HOME="/home/adrian/Code/LTU/fraktal/fabric-config/network-config/organizations/rootorg"
CA_CERT="ca/ca-cert.pem"

echo "=== Fabric CA Verification ==="
echo ""

# Check CA container status
echo "1. CA Container Status:"
docker ps --filter "name=ca" --format "   {{.Names}} - {{.Status}}"
echo ""

# Change to CA home directory
cd "$CA_HOME"
export FABRIC_CA_CLIENT_HOME="$PWD"

# List identities
echo "2. Registered Identities:"
fabric-ca-client identity list --tls.certfiles "$CA_CERT" | while read line; do
    if [[ $line == Name:* ]]; then
        # Extract name and type
        name=$(echo "$line" | grep -oP 'Name: \K[^,]+')
        type=$(echo "$line" | grep -oP 'Type: \K[^,]+')
        echo "   ✓ $name ($type)"
    fi
done
echo ""

# List affiliations
echo "3. Affiliations:"
fabric-ca-client affiliation list --tls.certfiles "$CA_CERT" | grep "affiliation:" | sed 's/affiliation:/   -/'
echo ""

# Check enrolled certificates count
echo "4. Enrolled Certificates:"
cert_count=$(fabric-ca-client certificate list --tls.certfiles "$CA_CERT" 2>/dev/null | grep "Serial Number:" | wc -l)
echo "   Total enrolled: $cert_count"
echo ""

# Verify MSP directories exist
echo "5. MSP Directory Structure:"
for entity in orderers/orderer0.rootorg.pm3.org peers/peer0.rootorg.pm3.org peers/peer1.rootorg.pm3.org users/Admin@rootorg.pm3.org users/User@rootorg.pm3.org; do
    if [ -d "$entity/msp" ]; then
        echo "   ✓ $entity/msp"
    else
        echo "   ✗ $entity/msp (missing)"
    fi
done
echo ""

echo "=== Verification Complete ==="
