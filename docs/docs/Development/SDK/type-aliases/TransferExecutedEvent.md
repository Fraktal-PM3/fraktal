[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / TransferExecutedEvent

# Type Alias: TransferExecutedEvent

> **TransferExecutedEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:322](https://github.com/Fraktal-PM3/fraktal-lib/blob/0da627c81ee3e36a14def24adf527f6e2be2cef5/src/lib/services/package/types.common.ts#L322)

Event emitted when a transfer is executed (ownership transferred).

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:330](https://github.com/Fraktal-PM3/fraktal-lib/blob/0da627c81ee3e36a14def24adf527f6e2be2cef5/src/lib/services/package/types.common.ts#L330)

Identity of the caller who executed the transfer.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:324](https://github.com/Fraktal-PM3/fraktal-lib/blob/0da627c81ee3e36a14def24adf527f6e2be2cef5/src/lib/services/package/types.common.ts#L324)

External identifier of the package.

***

### newOwner

> **newOwner**: `string`

Defined in: [src/lib/services/package/types.common.ts:328](https://github.com/Fraktal-PM3/fraktal-lib/blob/0da627c81ee3e36a14def24adf527f6e2be2cef5/src/lib/services/package/types.common.ts#L328)

MSP that is now the new owner of the package.

***

### termsId

> **termsId**: `string`

Defined in: [src/lib/services/package/types.common.ts:326](https://github.com/Fraktal-PM3/fraktal-lib/blob/0da627c81ee3e36a14def24adf527f6e2be2cef5/src/lib/services/package/types.common.ts#L326)

Identifier for the executed transfer.
