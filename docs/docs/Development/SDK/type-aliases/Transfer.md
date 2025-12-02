[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / Transfer

# Type Alias: Transfer

> **Transfer** = `object`

Defined in: [src/lib/services/package/types.common.ts:123](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L123)

A transfer instance and its state.

## Properties

### status

> **status**: [`TransferStatus`](../enumerations/TransferStatus.md)

Defined in: [src/lib/services/package/types.common.ts:127](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L127)

Current [TransferStatus](../enumerations/TransferStatus.md) of the transfer.

***

### terms

> **terms**: [`TransferTerms`](TransferTerms.md)

Defined in: [src/lib/services/package/types.common.ts:125](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L125)

Public terms for this transfer.

***

### transferTermsHash

> **transferTermsHash**: `string`

Defined in: [src/lib/services/package/types.common.ts:133](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L133)

Integrity hash of private terms or payloads associated with the transfer.

#### Remarks

Used to prove consistency without revealing private data publicly.
