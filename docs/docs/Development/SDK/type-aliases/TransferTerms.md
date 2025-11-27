[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / TransferTerms

# Type Alias: TransferTerms

> **TransferTerms** = `object`

Defined in: [src/lib/services/package/types.common.ts:97](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L97)

Public transfer terms that identify the package and counterparties.

## Properties

### createdISO

> **createdISO**: `string`

Defined in: [src/lib/services/package/types.common.ts:105](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L105)

ISO-8601 creation timestamp of the proposal.

***

### expiryISO

> **expiryISO**: `string` \| `null` \| `undefined`

Defined in: [src/lib/services/package/types.common.ts:110](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L110)

Optional ISO-8601 expiry timestamp.
If `null`/`undefined`, the proposal does not expire automatically.

***

### externalPackageId

> **externalPackageId**: `string`

Defined in: [src/lib/services/package/types.common.ts:99](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L99)

External identifier of the package being transferred.

***

### fromMSP

> **fromMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:101](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L101)

MSP/organization initiating the transfer.

***

### toMSP

> **toMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:103](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L103)

MSP/organization targeted to receive the package.
