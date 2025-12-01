[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / DeletePackageEvent

# Type Alias: DeletePackageEvent

> **DeletePackageEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:280](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L280)

Event emitted when a package is deleted.

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:286](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L286)

Identity of the caller who deleted the package.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:282](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L282)

External identifier of the deleted package.

***

### status

> **status**: [`Status`](../enumerations/Status.md)

Defined in: [src/lib/services/package/types.common.ts:284](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L284)

Status of the package at deletion.
