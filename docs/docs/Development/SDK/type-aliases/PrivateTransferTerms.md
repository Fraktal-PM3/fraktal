[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / PrivateTransferTerms

# Type Alias: PrivateTransferTerms

> **PrivateTransferTerms** = `object`

Defined in: [src/lib/services/package/types.common.ts:89](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L89)

Private terms for a transfer that should not be public on-chain.

## Properties

### price

> **price**: `number`

Defined in: [src/lib/services/package/types.common.ts:93](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L93)

Price to transfer ownership (currency/context external).

***

### salt

> **salt**: `string`

Defined in: [src/lib/services/package/types.common.ts:91](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L91)

Random salt used for hashing private transfer terms for integrity verification.
