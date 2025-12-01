[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / TransferOfferData

# Type Alias: TransferOfferData

> **TransferOfferData** = `object`

Defined in: [src/lib/services/package/types.common.ts:366](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L366)

Transfer offer data structure for FireFly datatype messages.

## Properties

### createdISO

> **createdISO**: `string`

Defined in: [src/lib/services/package/types.common.ts:378](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L378)

ISO-8601 creation timestamp.

***

### expiryISO

> **expiryISO**: `string` \| `null` \| `undefined`

Defined in: [src/lib/services/package/types.common.ts:380](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L380)

Optional ISO-8601 expiry timestamp.

***

### externalPackageId

> **externalPackageId**: `string`

Defined in: [src/lib/services/package/types.common.ts:368](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L368)

External identifier of the package being transferred.

***

### fromMSP

> **fromMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:372](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L372)

MSP initiating the transfer.

***

### price

> **price**: `number`

Defined in: [src/lib/services/package/types.common.ts:376](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L376)

Price for the transfer.

***

### termsId

> **termsId**: `string`

Defined in: [src/lib/services/package/types.common.ts:370](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L370)

Identifier for this transfer proposal.

***

### toMSP

> **toMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:374](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L374)

MSP targeted to receive the package.
