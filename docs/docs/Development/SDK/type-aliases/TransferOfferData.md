[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / TransferOfferData

# Type Alias: TransferOfferData

> **TransferOfferData** = `object`

Defined in: [src/lib/services/package/types.common.ts:359](https://github.com/Fraktal-PM3/fraktal-lib/blob/755a00672b0a6277cf4ebfc878b6356f5d6d3aff/src/lib/services/package/types.common.ts#L359)

Transfer offer data structure for FireFly datatype messages.

## Properties

### createdISO

> **createdISO**: `string`

Defined in: [src/lib/services/package/types.common.ts:371](https://github.com/Fraktal-PM3/fraktal-lib/blob/755a00672b0a6277cf4ebfc878b6356f5d6d3aff/src/lib/services/package/types.common.ts#L371)

ISO-8601 creation timestamp.

***

### expiryISO

> **expiryISO**: `string` \| `null` \| `undefined`

Defined in: [src/lib/services/package/types.common.ts:373](https://github.com/Fraktal-PM3/fraktal-lib/blob/755a00672b0a6277cf4ebfc878b6356f5d6d3aff/src/lib/services/package/types.common.ts#L373)

Optional ISO-8601 expiry timestamp.

***

### externalPackageId

> **externalPackageId**: `string`

Defined in: [src/lib/services/package/types.common.ts:361](https://github.com/Fraktal-PM3/fraktal-lib/blob/755a00672b0a6277cf4ebfc878b6356f5d6d3aff/src/lib/services/package/types.common.ts#L361)

External identifier of the package being transferred.

***

### fromMSP

> **fromMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:365](https://github.com/Fraktal-PM3/fraktal-lib/blob/755a00672b0a6277cf4ebfc878b6356f5d6d3aff/src/lib/services/package/types.common.ts#L365)

MSP initiating the transfer.

***

### price

> **price**: `number`

Defined in: [src/lib/services/package/types.common.ts:369](https://github.com/Fraktal-PM3/fraktal-lib/blob/755a00672b0a6277cf4ebfc878b6356f5d6d3aff/src/lib/services/package/types.common.ts#L369)

Price for the transfer.

***

### termsId

> **termsId**: `string`

Defined in: [src/lib/services/package/types.common.ts:363](https://github.com/Fraktal-PM3/fraktal-lib/blob/755a00672b0a6277cf4ebfc878b6356f5d6d3aff/src/lib/services/package/types.common.ts#L363)

Identifier for this transfer proposal.

***

### toMSP

> **toMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:367](https://github.com/Fraktal-PM3/fraktal-lib/blob/755a00672b0a6277cf4ebfc878b6356f5d6d3aff/src/lib/services/package/types.common.ts#L367)

MSP targeted to receive the package.
