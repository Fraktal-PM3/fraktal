[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / CreatePackageEvent

# Type Alias: CreatePackageEvent

> **CreatePackageEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:252](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L252)

Event emitted when a package is created.

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:262](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L262)

Identity of the caller who created the package.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:254](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L254)

External identifier of the created package.

***

### ownerOrgMSP

> **ownerOrgMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:256](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L256)

MSP/organization that owns the package.

***

### packageDetailsAndPIIHash

> **packageDetailsAndPIIHash**: `string`

Defined in: [src/lib/services/package/types.common.ts:260](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L260)

Integrity hash of the package details and PII.

***

### status

> **status**: [`Status`](../enumerations/Status.md)

Defined in: [src/lib/services/package/types.common.ts:258](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L258)

Initial status of the package.
