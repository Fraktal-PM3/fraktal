[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / CreatePackageEvent

# Type Alias: CreatePackageEvent

> **CreatePackageEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:245](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L245)

Event emitted when a package is created.

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:255](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L255)

Identity of the caller who created the package.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:247](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L247)

External identifier of the created package.

***

### ownerOrgMSP

> **ownerOrgMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:249](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L249)

MSP/organization that owns the package.

***

### packageDetailsAndPIIHash

> **packageDetailsAndPIIHash**: `string`

Defined in: [src/lib/services/package/types.common.ts:253](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L253)

Integrity hash of the package details and PII.

***

### status

> **status**: [`Status`](../enumerations/Status.md)

Defined in: [src/lib/services/package/types.common.ts:251](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L251)

Initial status of the package.
