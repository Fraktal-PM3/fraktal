[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / DeletePackageEvent

# Type Alias: DeletePackageEvent

> **DeletePackageEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:286](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L286)

Event emitted when a package is deleted.

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:292](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L292)

Identity of the caller who deleted the package.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:288](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L288)

External identifier of the deleted package.

***

### status

> **status**: [`Status`](../enumerations/Status.md)

Defined in: [src/lib/services/package/types.common.ts:290](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L290)

Status of the package at deletion.
