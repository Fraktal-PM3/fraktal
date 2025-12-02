[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / BlockchainEventDelivery

# Type Alias: BlockchainEventDelivery

> **BlockchainEventDelivery** = `object`

Defined in: [src/lib/services/package/types.common.ts:234](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L234)

Blockchain-emitted event with typed output.

## Properties

### header

> **header**: [`FireFlyMessageHeader`](FireFlyMessageHeader.md)

Defined in: [src/lib/services/package/types.common.ts:242](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L242)

Message header (always included).

***

### output

> **output**: `any`

Defined in: [src/lib/services/package/types.common.ts:238](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L238)

Event output/payload from the contract.

***

### timestamp

> **timestamp**: `string`

Defined in: [src/lib/services/package/types.common.ts:240](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L240)

ISO-8601 timestamp when the event was recorded.

***

### txid?

> `optional` **txid**: `string`

Defined in: [src/lib/services/package/types.common.ts:236](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L236)

Blockchain transaction ID.
