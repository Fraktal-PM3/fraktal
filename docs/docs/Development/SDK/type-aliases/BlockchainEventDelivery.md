[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / BlockchainEventDelivery

# Type Alias: BlockchainEventDelivery

> **BlockchainEventDelivery** = `object`

Defined in: [src/lib/services/package/types.common.ts:231](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L231)

Blockchain-emitted event with typed output.

## Properties

### header

> **header**: [`FireFlyMessageHeader`](FireFlyMessageHeader.md)

Defined in: [src/lib/services/package/types.common.ts:239](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L239)

Message header (always included).

***

### output

> **output**: `any`

Defined in: [src/lib/services/package/types.common.ts:235](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L235)

Event output/payload from the contract.

***

### timestamp

> **timestamp**: `string`

Defined in: [src/lib/services/package/types.common.ts:237](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L237)

ISO-8601 timestamp when the event was recorded.

***

### txid?

> `optional` **txid**: `string`

Defined in: [src/lib/services/package/types.common.ts:233](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L233)

Blockchain transaction ID.
