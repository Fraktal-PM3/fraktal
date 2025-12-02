[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / StatusUpdatedEvent

# Type Alias: StatusUpdatedEvent

> **StatusUpdatedEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:271](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L271)

Event emitted when a package status changes.

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:277](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L277)

Identity of the caller who updated the status.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:273](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L273)

External identifier of the package.

***

### status

> **status**: [`Status`](../enumerations/Status.md)

Defined in: [src/lib/services/package/types.common.ts:275](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L275)

New status of the package.
