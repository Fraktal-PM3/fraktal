#!/usr/bin/env bash
# Quick verification script for FireFly UI

echo "🔍 FireFly UI Status Check"
echo "=========================="
echo ""

# Check org1
echo "📱 Org1 UI Status:"
echo "   URL: https://firefly-org1.localho.st/ui"
HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" https://firefly-org1.localho.st/ui 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Status: Accessible (HTTP $HTTP_CODE)"
else
    echo "   ❌ Status: Not accessible (HTTP $HTTP_CODE)"
fi
echo ""

# Check org2
echo "📱 Org2 UI Status:"
echo "   URL: https://firefly-org2.localho.st/ui"
HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" https://firefly-org2.localho.st/ui 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Status: Accessible (HTTP $HTTP_CODE)"
else
    echo "   ❌ Status: Not accessible (HTTP $HTTP_CODE)"
fi
echo ""

# Check pod status
echo "📦 Pod Status:"
kubectl get pods -n org1 -l app=firefly
kubectl get pods -n org2 -l app=firefly
echo ""

# Check configuration
echo "⚙️  UI Configuration:"
kubectl exec -n org1 firefly-org1-0 -- cat /etc/firefly/config/config.json 2>/dev/null | grep -A 3 '"ui"' || echo "   ⚠️  Could not read configuration"
echo ""

echo "🌐 Access URLs:"
echo "   Org1: https://firefly-org1.localho.st/ui"
echo "   Org2: https://firefly-org2.localho.st/ui"
echo ""
echo "💡 Open these URLs in your browser to access the FireFly Explorer UI"
