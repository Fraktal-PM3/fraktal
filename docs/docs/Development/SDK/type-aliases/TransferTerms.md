[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / TransferTerms

# Type Alias: TransferTerms

> **TransferTerms** = `object`

Defined in: [src/lib/services/package/types.common.ts:95](https://github.com/Fraktal-PM3/fraktal-lib/blob/fb7e8d6fe7788d4f61b3eac0583e0a47cc3cedd1/src/lib/services/package/types.common.ts#L95)

Public transfer terms that identify the package and counterparties.

## Properties

### createdISO

> **createdISO**: `string`

Defined in: [src/lib/services/package/types.common.ts:103](https://github.com/Fraktal-PM3/fraktal-lib/blob/fb7e8d6fe7788d4f61b3eac0583e0a47cc3cedd1/src/lib/services/package/types.common.ts#L103)

ISO-8601 creation timestamp of the proposal.

***

### expiryISO

> **expiryISO**: `string` \| `null` \| `undefined`

Defined in: [src/lib/services/package/types.common.ts:108](https://github.com/Fraktal-PM3/fraktal-lib/blob/fb7e8d6fe7788d4f61b3eac0583e0a47cc3cedd1/src/lib/services/package/types.common.ts#L108)

Optional ISO-8601 expiry timestamp.
If `null`/`undefined`, the proposal does not expire automatically.

***

### externalPackageId

> **externalPackageId**: `string`

Defined in: [src/lib/services/package/types.common.ts:97](https://github.com/Fraktal-PM3/fraktal-lib/blob/fb7e8d6fe7788d4f61b3eac0583e0a47cc3cedd1/src/lib/services/package/types.common.ts#L97)

External identifier of the package being transferred.

***

### fromMSP

> **fromMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:99](https://github.com/Fraktal-PM3/fraktal-lib/blob/fb7e8d6fe7788d4f61b3eac0583e0a47cc3cedd1/src/lib/services/package/types.common.ts#L99)

MSP/organization initiating the transfer.

***

### toMSP

> **toMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:101](https://github.com/Fraktal-PM3/fraktal-lib/blob/fb7e8d6fe7788d4f61b3eac0583e0a47cc3cedd1/src/lib/services/package/types.common.ts#L101)

MSP/organization targeted to receive the package.
