# Custom IPFS image with automatic peer discovery and bootstrap configuration
FROM ipfs/kubo:latest

# Copy custom entrypoint script
COPY entrypoint.sh /usr/local/bin/custom-entrypoint.sh
RUN chmod +x /usr/local/bin/custom-entrypoint.sh

# Use our custom entrypoint
ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]
