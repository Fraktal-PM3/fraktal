[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / DeletePackageEvent

# Type Alias: DeletePackageEvent

> **DeletePackageEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:273](https://github.com/Fraktal-PM3/fraktal-lib/blob/755a00672b0a6277cf4ebfc878b6356f5d6d3aff/src/lib/services/package/types.common.ts#L273)

Event emitted when a package is deleted.

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:279](https://github.com/Fraktal-PM3/fraktal-lib/blob/755a00672b0a6277cf4ebfc878b6356f5d6d3aff/src/lib/services/package/types.common.ts#L279)

Identity of the caller who deleted the package.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:275](https://github.com/Fraktal-PM3/fraktal-lib/blob/755a00672b0a6277cf4ebfc878b6356f5d6d3aff/src/lib/services/package/types.common.ts#L275)

External identifier of the deleted package.

***

### status

> **status**: [`Status`](../enumerations/Status.md)

Defined in: [src/lib/services/package/types.common.ts:277](https://github.com/Fraktal-PM3/fraktal-lib/blob/755a00672b0a6277cf4ebfc878b6356f5d6d3aff/src/lib/services/package/types.common.ts#L277)

Status of the package at deletion.
