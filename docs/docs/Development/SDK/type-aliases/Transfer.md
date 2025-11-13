[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / Transfer

# Type Alias: Transfer

> **Transfer** = `object`

Defined in: [src/lib/services/package/types.common.ts:114](https://github.com/Fraktal-PM3/fraktal-lib/blob/ded2c1ea4e3b1d3dd2d70ae81d5c478a768191ee/src/lib/services/package/types.common.ts#L114)

A transfer instance and its state.

## Properties

### status

> **status**: [`TransferStatus`](../enumerations/TransferStatus.md)

Defined in: [src/lib/services/package/types.common.ts:118](https://github.com/Fraktal-PM3/fraktal-lib/blob/ded2c1ea4e3b1d3dd2d70ae81d5c478a768191ee/src/lib/services/package/types.common.ts#L118)

Current [TransferStatus](../enumerations/TransferStatus.md) of the transfer.

***

### terms

> **terms**: [`TransferTerms`](TransferTerms.md)

Defined in: [src/lib/services/package/types.common.ts:116](https://github.com/Fraktal-PM3/fraktal-lib/blob/ded2c1ea4e3b1d3dd2d70ae81d5c478a768191ee/src/lib/services/package/types.common.ts#L116)

Public terms for this transfer.

***

### transferTermsHash

> **transferTermsHash**: `string`

Defined in: [src/lib/services/package/types.common.ts:124](https://github.com/Fraktal-PM3/fraktal-lib/blob/ded2c1ea4e3b1d3dd2d70ae81d5c478a768191ee/src/lib/services/package/types.common.ts#L124)

Integrity hash of private terms or payloads associated with the transfer.

#### Remarks

Used to prove consistency without revealing private data publicly.
