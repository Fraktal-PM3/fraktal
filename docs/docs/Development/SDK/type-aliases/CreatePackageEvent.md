[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / CreatePackageEvent

# Type Alias: CreatePackageEvent

> **CreatePackageEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:258](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L258)

Event emitted when a package is created.

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:268](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L268)

Identity of the caller who created the package.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:260](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L260)

External identifier of the created package.

***

### ownerOrgMSP

> **ownerOrgMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:262](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L262)

MSP/organization that owns the package.

***

### packageDetailsAndPIIHash

> **packageDetailsAndPIIHash**: `string`

Defined in: [src/lib/services/package/types.common.ts:266](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L266)

Integrity hash of the package details and PII.

***

### status

> **status**: [`Status`](../enumerations/Status.md)

Defined in: [src/lib/services/package/types.common.ts:264](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L264)

Initial status of the package.
