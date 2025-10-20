# Security Guidelines

This document outlines the security measures and best practices implemented in fabric-config.

## Environment Variables

### Required Environment Variables

Before running `fabric-config init`, you **MUST** set the following environment variable:

```bash
export FABRIC_CA_ADMIN_PASSWORD="your-secure-password-here"
```

**Requirements:**
- Minimum 8 characters
- Use a strong, randomly generated password
- Never commit this password to version control

**Example:**
```bash
# Generate a secure password
export FABRIC_CA_ADMIN_PASSWORD="$(openssl rand -base64 32)"

# Then run fabric-config
fabric-config init
```

## File Permissions

The tool automatically sets secure file permissions for sensitive materials:

- **CA configuration files**: `0600` (read/write owner only)
- **Keystore directories**: `0700` (full access owner only)
- **TLS directories**: `0700` (full access owner only)
- **Config files**: `0640` (read/write owner, read group)
- **Other MSP directories**: `0755` (standard directory permissions)

## Input Validation

All user inputs are validated to prevent:
- Command injection attacks
- Path traversal attacks
- Invalid configurations

### Validated Inputs
- Peer/orderer counts (1-100 for peers, 1-50 for orderers)
- Container names (no shell metacharacters allowed)
- Volume names (no shell metacharacters allowed)
- File paths (sanitized and validated)

## Docker Security

When using Docker commands, the tool:
- Validates all container and volume names
- Prevents command injection through input sanitization
- Uses context for proper cancellation
- Handles goroutine cleanup to prevent resource leaks

### Forbidden Characters

The following characters are not allowed in container/volume names:
- `;` (semicolon)
- `|` (pipe)
- `&` (ampersand)
- `$` (dollar sign)
- `` ` `` (backtick)
- `<` (less than)
- `>` (greater than)

## Best Practices

### 1. Credential Management
- Never hardcode credentials in code or configuration files
- Use environment variables for sensitive data
- Rotate credentials regularly
- Use strong, unique passwords

### 2. Network Configuration
- Enable TLS for all Fabric components
- Use firewall rules to restrict network access
- Separate development and production environments
- Monitor network traffic for anomalies

### 3. File System Security
- Keep crypto-config directories secure (0700 permissions)
- Regularly backup cryptographic materials
- Store backups encrypted and off-site
- Implement key rotation policies

### 4. Docker Security
- Use official Hyperledger Fabric images
- Keep Docker and images up to date
- Limit container capabilities
- Use Docker secrets for sensitive data

### 5. Development Practices
- Review all code changes for security implications
- Run security scanners on codebase
- Keep dependencies up to date
- Follow Go security best practices

## Vulnerability Reporting

If you discover a security vulnerability, please:
1. **DO NOT** open a public issue
2. Report it privately to the maintainers
3. Include detailed reproduction steps
4. Allow time for a fix before public disclosure

## Security Checklist

Before deploying to production:

- [ ] Set strong `FABRIC_CA_ADMIN_PASSWORD`
- [ ] Review and restrict file permissions
- [ ] Enable TLS for all components
- [ ] Configure firewall rules
- [ ] Review Docker container security
- [ ] Audit cryptographic material storage
- [ ] Test backup and recovery procedures
- [ ] Review access control policies
- [ ] Enable logging and monitoring
- [ ] Document security procedures

## Updates and Patches

- Monitor for security updates to:
  - Hyperledger Fabric
  - Go runtime
  - Dependencies (check with `go list -m all`)
  - Docker images

## References

- [Hyperledger Fabric Security Documentation](https://hyperledger-fabric.readthedocs.io/en/latest/security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
- [Go Security Best Practices](https://github.com/OWASP/Go-SCP)
