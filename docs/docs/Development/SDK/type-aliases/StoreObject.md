[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / StoreObject

# Type Alias: StoreObject

> **StoreObject** = `object`

Defined in: [src/lib/services/package/types.common.ts:156](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L156)

Opaque object used to store private package data with integrity.
Typically sent through transient/private channels.

## Properties

### packageDetails

> **packageDetails**: [`PackageDetails`](PackageDetails.md)

Defined in: [src/lib/services/package/types.common.ts:165](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L165)

Public package details mirrored in private context for verification.

***

### pii

> **pii**: [`PackagePII`](PackagePII.md)

Defined in: [src/lib/services/package/types.common.ts:163](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L163)

Private, personally identifiable information.

***

### salt

> **salt**: `string`

Defined in: [src/lib/services/package/types.common.ts:161](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L161)

Salt used when hashing [PackageDetails](PackageDetails.md) and [PackagePII](PackagePII.md)
for integrity verification.
