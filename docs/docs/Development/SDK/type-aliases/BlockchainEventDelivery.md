[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / BlockchainEventDelivery

# Type Alias: BlockchainEventDelivery

> **BlockchainEventDelivery** = `object`

Defined in: [src/lib/services/package/types.common.ts:224](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L224)

Blockchain-emitted event with typed output.

## Properties

### header

> **header**: [`FireFlyMessageHeader`](FireFlyMessageHeader.md)

Defined in: [src/lib/services/package/types.common.ts:232](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L232)

Message header (always included).

***

### output

> **output**: `any`

Defined in: [src/lib/services/package/types.common.ts:228](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L228)

Event output/payload from the contract.

***

### timestamp

> **timestamp**: `string`

Defined in: [src/lib/services/package/types.common.ts:230](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L230)

ISO-8601 timestamp when the event was recorded.

***

### txid?

> `optional` **txid**: `string`

Defined in: [src/lib/services/package/types.common.ts:226](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L226)

Blockchain transaction ID.
