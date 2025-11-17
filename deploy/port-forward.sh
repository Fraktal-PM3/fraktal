#!/bin/bash

echo "Starting port-forwards using tmux..."

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "tmux not found. Installing..."
    sudo apt-get update && sudo apt-get install -y tmux
fi

# Kill existing port-forward sessions if they exist
tmux kill-session -t fabconnect-pf 2>/dev/null || true
tmux kill-session -t firefly-pf 2>/dev/null || true

# Start FabConnect port-forward in detached tmux session
tmux new-session -d -s fabconnect-pf "kubectl port-forward svc/fabconnect-fabconnect 5000:3000"
echo "✓ FabConnect port-forward started (port 5000)"

# Start Firefly port-forward in detached tmux session
tmux new-session -d -s firefly-pf "kubectl port-forward svc/firefly 5100:5100 5101:5101"
echo "✓ Firefly port-forward started (ports 5100, 5101)"

echo ""
echo "To view port-forward sessions:"
echo "  tmux list-sessions"
echo "To attach to a session:"
echo "  tmux attach -t fabconnect-pf"
echo "  tmux attach -t firefly-pf"
echo "To stop port-forwards:"
echo "  tmux kill-session -t fabconnect-pf"
echo "  tmux kill-session -t firefly-pf"
