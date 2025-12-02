[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / TransferOfferData

# Type Alias: TransferOfferData

> **TransferOfferData** = `object`

Defined in: [src/lib/services/package/types.common.ts:369](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L369)

Transfer offer data structure for FireFly datatype messages.

## Properties

### createdISO

> **createdISO**: `string`

Defined in: [src/lib/services/package/types.common.ts:381](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L381)

ISO-8601 creation timestamp.

***

### expiryISO

> **expiryISO**: `string` \| `null` \| `undefined`

Defined in: [src/lib/services/package/types.common.ts:383](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L383)

Optional ISO-8601 expiry timestamp.

***

### externalPackageId

> **externalPackageId**: `string`

Defined in: [src/lib/services/package/types.common.ts:371](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L371)

External identifier of the package being transferred.

***

### fromMSP

> **fromMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:375](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L375)

MSP initiating the transfer.

***

### price

> **price**: `number`

Defined in: [src/lib/services/package/types.common.ts:379](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L379)

Price for the transfer.

***

### termsId

> **termsId**: `string`

Defined in: [src/lib/services/package/types.common.ts:373](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L373)

Identifier for this transfer proposal.

***

### toMSP

> **toMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:377](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L377)

MSP targeted to receive the package.
