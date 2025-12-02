[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / DeletePackageEvent

# Type Alias: DeletePackageEvent

> **DeletePackageEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:283](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L283)

Event emitted when a package is deleted.

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:289](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L289)

Identity of the caller who deleted the package.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:285](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L285)

External identifier of the deleted package.

***

### status

> **status**: [`Status`](../enumerations/Status.md)

Defined in: [src/lib/services/package/types.common.ts:287](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L287)

Status of the package at deletion.
