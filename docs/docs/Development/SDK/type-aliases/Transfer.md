[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / Transfer

# Type Alias: Transfer

> **Transfer** = `object`

Defined in: [src/lib/services/package/types.common.ts:116](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L116)

A transfer instance and its state.

## Properties

### status

> **status**: [`TransferStatus`](../enumerations/TransferStatus.md)

Defined in: [src/lib/services/package/types.common.ts:120](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L120)

Current [TransferStatus](../enumerations/TransferStatus.md) of the transfer.

***

### terms

> **terms**: [`TransferTerms`](TransferTerms.md)

Defined in: [src/lib/services/package/types.common.ts:118](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L118)

Public terms for this transfer.

***

### transferTermsHash

> **transferTermsHash**: `string`

Defined in: [src/lib/services/package/types.common.ts:126](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L126)

Integrity hash of private terms or payloads associated with the transfer.

#### Remarks

Used to prove consistency without revealing private data publicly.
