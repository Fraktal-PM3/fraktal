[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / TransferExecutedEvent

# Type Alias: TransferExecutedEvent

> **TransferExecutedEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:335](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L335)

Event emitted when a transfer is executed (ownership transferred).

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:343](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L343)

Identity of the caller who executed the transfer.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:337](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L337)

External identifier of the package.

***

### newOwner

> **newOwner**: `string`

Defined in: [src/lib/services/package/types.common.ts:341](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L341)

MSP that is now the new owner of the package.

***

### termsId

> **termsId**: `string`

Defined in: [src/lib/services/package/types.common.ts:339](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L339)

Identifier for the executed transfer.
