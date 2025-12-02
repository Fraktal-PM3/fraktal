[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / BlockchainEventDelivery

# Type Alias: BlockchainEventDelivery

> **BlockchainEventDelivery** = `object`

Defined in: [src/lib/services/package/types.common.ts:237](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L237)

Blockchain-emitted event with typed output.

## Properties

### header

> **header**: [`FireFlyMessageHeader`](FireFlyMessageHeader.md)

Defined in: [src/lib/services/package/types.common.ts:245](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L245)

Message header (always included).

***

### output

> **output**: `any`

Defined in: [src/lib/services/package/types.common.ts:241](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L241)

Event output/payload from the contract.

***

### timestamp

> **timestamp**: `string`

Defined in: [src/lib/services/package/types.common.ts:243](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L243)

ISO-8601 timestamp when the event was recorded.

***

### txid?

> `optional` **txid**: `string`

Defined in: [src/lib/services/package/types.common.ts:239](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L239)

Blockchain transaction ID.
