[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / TransferExecutedEvent

# Type Alias: TransferExecutedEvent

> **TransferExecutedEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:332](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L332)

Event emitted when a transfer is executed (ownership transferred).

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:340](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L340)

Identity of the caller who executed the transfer.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:334](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L334)

External identifier of the package.

***

### newOwner

> **newOwner**: `string`

Defined in: [src/lib/services/package/types.common.ts:338](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L338)

MSP that is now the new owner of the package.

***

### termsId

> **termsId**: `string`

Defined in: [src/lib/services/package/types.common.ts:336](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L336)

Identifier for the executed transfer.
