[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / StoreObject

# Type Alias: StoreObject

> **StoreObject** = `object`

Defined in: [src/lib/services/package/types.common.ts:149](https://github.com/Fraktal-PM3/fraktal-lib/blob/51901a902f41089239cca9e85780b1ef7e447d3c/src/lib/services/package/types.common.ts#L149)

Opaque object used to store private package data with integrity.
Typically sent through transient/private channels.

## Properties

### packageDetails

> **packageDetails**: [`PackageDetails`](PackageDetails.md)

Defined in: [src/lib/services/package/types.common.ts:158](https://github.com/Fraktal-PM3/fraktal-lib/blob/51901a902f41089239cca9e85780b1ef7e447d3c/src/lib/services/package/types.common.ts#L158)

Public package details mirrored in private context for verification.

***

### pii

> **pii**: [`PackagePII`](PackagePII.md)

Defined in: [src/lib/services/package/types.common.ts:156](https://github.com/Fraktal-PM3/fraktal-lib/blob/51901a902f41089239cca9e85780b1ef7e447d3c/src/lib/services/package/types.common.ts#L156)

Private, personally identifiable information.

***

### salt

> **salt**: `string`

Defined in: [src/lib/services/package/types.common.ts:154](https://github.com/Fraktal-PM3/fraktal-lib/blob/51901a902f41089239cca9e85780b1ef7e447d3c/src/lib/services/package/types.common.ts#L154)

Salt used when hashing [PackageDetails](PackageDetails.md) and [PackagePII](PackagePII.md)
for integrity verification.
