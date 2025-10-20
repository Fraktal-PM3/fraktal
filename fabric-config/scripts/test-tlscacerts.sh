#!/bin/bash
# Test script to verify tlscacerts directory is created during init

set -e

TEST_DIR="/tmp/fabric-config-test-$(date +%s)"
echo "Testing tlscacerts creation in: $TEST_DIR"

# Set required environment variable
export FABRIC_CA_ADMIN_PASSWORD="testadminpw"

# Run init
cd /home/adrian/Code/LTU/fraktal/fabric-config
./build/fabric-config init --base-path "$TEST_DIR" --peers 1 --orderers 1

# Check if tlscacerts directory was created
TLSCACERTS_DIR="$TEST_DIR/organizations/rootorg/msp/tlscacerts"
if [ -d "$TLSCACERTS_DIR" ]; then
    echo "✓ tlscacerts directory created successfully"
    
    # Check if ca.crt exists
    if [ -f "$TLSCACERTS_DIR/ca.crt" ]; then
        echo "✓ ca.crt file exists in tlscacerts"
        
        # Verify it's a valid certificate
        if openssl x509 -in "$TLSCACERTS_DIR/ca.crt" -noout -text > /dev/null 2>&1; then
            echo "✓ ca.crt is a valid certificate"
            echo ""
            echo "SUCCESS: tlscacerts setup is working correctly!"
        else
            echo "✗ ca.crt is not a valid certificate"
            exit 1
        fi
    else
        echo "✗ ca.crt file not found in tlscacerts"
        exit 1
    fi
else
    echo "✗ tlscacerts directory was not created"
    exit 1
fi

# Cleanup
echo ""
echo "Cleaning up test directory..."
cd /home/adrian/Code/LTU/fraktal/fabric-config
./build/fabric-config down --base-path "$TEST_DIR" --volumes 2>/dev/null || true
rm -rf "$TEST_DIR"
echo "✓ Test cleanup complete"
