[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / TransferExecutedEvent

# Type Alias: TransferExecutedEvent

> **TransferExecutedEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:329](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L329)

Event emitted when a transfer is executed (ownership transferred).

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:337](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L337)

Identity of the caller who executed the transfer.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:331](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L331)

External identifier of the package.

***

### newOwner

> **newOwner**: `string`

Defined in: [src/lib/services/package/types.common.ts:335](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L335)

MSP that is now the new owner of the package.

***

### termsId

> **termsId**: `string`

Defined in: [src/lib/services/package/types.common.ts:333](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L333)

Identifier for the executed transfer.
