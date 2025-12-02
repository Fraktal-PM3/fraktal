[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / CreatePackageEvent

# Type Alias: CreatePackageEvent

> **CreatePackageEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:255](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L255)

Event emitted when a package is created.

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:265](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L265)

Identity of the caller who created the package.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:257](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L257)

External identifier of the created package.

***

### ownerOrgMSP

> **ownerOrgMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:259](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L259)

MSP/organization that owns the package.

***

### packageDetailsAndPIIHash

> **packageDetailsAndPIIHash**: `string`

Defined in: [src/lib/services/package/types.common.ts:263](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L263)

Integrity hash of the package details and PII.

***

### status

> **status**: [`Status`](../enumerations/Status.md)

Defined in: [src/lib/services/package/types.common.ts:261](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L261)

Initial status of the package.
