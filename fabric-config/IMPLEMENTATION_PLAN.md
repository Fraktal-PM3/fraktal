# Implementation Plan: Offline TLS CA with Single Intermediate CA

## Overview

This plan describes how to modify the fabric config generator to:

1. Create a TLS CA
2. Create two intermediate CA's (enrolled under TLS CA)
3. Shut down TLS CA (move to offline/cold storage)
4. Have all organizations enroll under the intermediate CA instead of TLS CA

This improves security by keeping the root TLS CA offline after initial setup.

---

## Phase 1: Data Structure Changes

### 1.1 Update `internal/config/types.go`

Add a new struct to track the intermediate CA:

```go
type IntermediateCA struct {
    Name     string
    Port     int
    Path     string
    CAName   string
}
```

Add field to `NetworkConfig`:

```go
IntermediateCA *IntermediateCA `yaml:"intermediateCA"`
```

---

## Phase 2: Intermediate CA Creation

### 2.1 Create function in `internal/ca/ca.go`

```go
func CreateIntermediateCA(basePath string, fabricBinPath string, tlsCA *config.Organization) (*config.Organization, error)
```

This function should:

1. **Set up paths**
   - `caPath := basePath/organizations/server/intermediate-ca`
   - Create directory structure

2. **Register bootstrap identity with TLS CA**
   - Use `fabric-ca-client register` with TLS CA
   - Identity name: `intermediate-ca-admin` (or similar)
   - Type: `client`
   - Attributes: same as org admin attributes
   - Save enrollment credentials

3. **Enroll bootstrap identity with TLS CA**
   - Use `fabric-ca-client enroll` with TLS CA
   - Use `ca` profile (important - this makes it a CA certificate)
   - Store cert/key in intermediate-ca path

4. **Initialize intermediate CA server**
   - Run `fabric-ca-server init -b intermediate-ca-admin:password`
   - Generates default `fabric-ca-server-config.yaml`

5. **Modify intermediate CA config**
   - Set port to 9001 (or unique port)
   - Set `ca.name` to something like `pm3-intermediate-ca`
   - Set TLS enabled
   - Add parent server configuration:
     ```yaml
     intermediate:
       parentserver:
         url: https://tls-admin:password@localhost:9000
         caname: pm3-tls-ca
       enrollment:
         profile: ca
       tls:
         certfiles:
           - path/to/tls-ca-cert.pem
     ```
   - Delete previous certs (ca-cert.pem, msp directory)

6. **Write config and start intermediate CA**
   - Write updated config to `fabric-ca-server-config.yaml`
   - Run `fabric-ca-server start`
   - Wait for server to be healthy

7. **Enroll intermediate CA admin**
   - Register intermediate CA admin with the intermediate CA itself
   - Enroll intermediate CA admin

8. **Return IntermediateCA object**
   - Create config object with intermediate CA details
   - Return to caller

---

## Phase 3: Update TLS CA Initialization

### 3.1 Modify `CreateRootOrgTLSCA()` in `internal/ca/ca.go`

Current flow:

```
1. Create TLS CA
2. Start TLS CA
3. Enroll TLS CA bootstrap user
4. Return
```

New flow:

```
1. Create TLS CA
2. Start TLS CA
3. Enroll TLS CA bootstrap user
4. Create intermediate CA (while TLS CA still running) ← NEW
5. Shut down TLS CA ← NEW
6. Return (intermediate CA is now running)
```

Add this after `EnrollBootstrapUserTLSCA()`:

```go
intermediateCA, err := CreateIntermediateCA(basePath, fabricBinPath, rootOrgTLSCA)
if err != nil {
    return nil, err
}

// Stop TLS CA (no longer needed)
n.StopCA(ctx, rootOrgTLSCA.Name)

// Store intermediate CA reference
net.Config.IntermediateCA = &config.IntermediateCA{
    Name: intermediateCA.Name,
    Port: intermediateCA.Port,
    CAName: intermediateCA.CA.Name,
}
```

---

## Phase 4: Organization Creation Changes

### 4.1 Modify `RegAndEnrollOrgCABootrapID()` in `internal/ca/ca.go`

**Change parent from TLS CA to intermediate CA:**

Currently registers with:

```go
// Register with TLS CA
fabric-ca-client register ... -u https://tls-admin@localhost:9000
```

New version:

```go
// Register with intermediate CA instead
fabric-ca-client register ... -u https://intermediate-ca-admin@localhost:9001
```

Pass intermediate CA details as parameter to function.

### 4.2 Update `AddOrganization()` in `internal/network/network.go`

Currently:

```go
enrollConfig, err := ca.RegAndEnrollOrgCABootrapID(n.Config, tlsCA, orgDef.Identifier)
```

Change to pass intermediate CA:

```go
enrollConfig, err := ca.RegAndEnrollOrgCABootrapID(
    n.Config,
    intermediateCA,  // ← Now use intermediate instead of TLS CA
    orgDef.Identifier
)
```

### 4.3 Update `CreateOrgWithEnroll()` in `internal/ca/ca.go`

The parent server config in the org CA should point to intermediate CA:

Instead of:

```yaml
intermediate:
  parentserver:
    url: https://tls-admin:pwd@localhost:9000
    caname: pm3-tls-ca
```

Use:

```yaml
intermediate:
  parentserver:
    url: https://intermediate-ca-admin:pwd@localhost:9001
    caname: pm3-intermediate-ca
```

Pass intermediate CA info to this function.

---

## Phase 5: Update Initialization Flow

### 5.1 Modify `Init()` in `internal/network/network.go`

Current flow:

```go
1. Create TLS CA
2. Start TLS CA
3. Enroll bootstrap user with TLS CA
4. Create root-org (enrolls with TLS CA)
5. Create other orgs (enroll with TLS CA)
6. Stop all CAs
```

New flow:

```go
1. Create TLS CA
2. Start TLS CA
3. Enroll bootstrap user with TLS CA
4. Create intermediate CA (while TLS CA running)  ← NEW
5. Stop TLS CA (not needed anymore)             ← NEW
6. Store intermediate CA reference in config    ← NEW
7. Create root-org (enrolls with intermediate)   ← CHANGED
8. Create other orgs (enroll with intermediate)  ← CHANGED
9. Stop intermediate CA at the end              ← CHANGED
```

The key is that after step 5, the TLS CA should not be started again.

---

## Phase 6: Update Configuration Serialization

### 6.1 Ensure `IntermediateCA` is serialized to config

When saving network config to YAML, the intermediate CA details should be saved so that:

- On next run, code knows intermediate CA exists
- Can reference intermediate CA port/name without restarting it

---

## Implementation Order

1. **First**: Add `IntermediateCA` struct to `types.go`
2. **Second**: Create `CreateIntermediateCA()` function in `ca.go`
3. **Third**: Update `CreateRootOrgTLSCA()` to create and shut down TLS CA
4. **Fourth**: Update `RegAndEnrollOrgCABootrapID()` to accept intermediate CA parameter
5. **Fifth**: Update `CreateOrgWithEnroll()` to use intermediate CA as parent
6. **Sixth**: Update `AddOrganization()` to pass intermediate CA
7. **Seventh**: Test the full `Init()` flow

---

## Testing Checklist

- [ ] TLS CA starts and can issue certificates
- [ ] Intermediate CA can enroll under TLS CA with `ca` profile
- [ ] TLS CA shuts down cleanly
- [ ] Intermediate CA continues running after TLS CA shutdown
- [ ] Org CAs can enroll under intermediate CA
- [ ] Org identities can be issued from org CAs
- [ ] Full network initialization completes without errors
- [ ] Network config YAML contains intermediate CA details

---

## Notes

- The intermediate CA will continue running after TLS CA shutdown
- To add more CAs in the future (if needed), TLS CA would need to be brought back online manually
- Consider storing TLS CA credentials separately and safely for future use
- The intermediate CA can be shut down normally when not in use
