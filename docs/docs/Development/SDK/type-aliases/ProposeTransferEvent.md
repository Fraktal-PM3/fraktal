[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / ProposeTransferEvent

# Type Alias: ProposeTransferEvent

> **ProposeTransferEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:295](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L295)

Event emitted when a transfer is proposed.

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:314](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L314)

Identity of the caller who proposed the transfer.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:297](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L297)

External identifier of the package being transferred.

***

### terms

> **terms**: `object`

Defined in: [src/lib/services/package/types.common.ts:301](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L301)

Public transfer terms.

#### createdISO

> **createdISO**: `string`

ISO-8601 creation timestamp.

#### expiryISO

> **expiryISO**: `string` \| `null` \| `undefined`

Optional ISO-8601 expiry timestamp.

#### extenalPackageId?

> `optional` **extenalPackageId**: `string`

External identifier of the package (in transfer context).

#### fromMSP

> **fromMSP**: `string`

MSP initiating the transfer.

#### toMSP

> **toMSP**: `string`

MSP targeted to receive the package.

***

### termsId

> **termsId**: `string`

Defined in: [src/lib/services/package/types.common.ts:299](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L299)

Identifier for this transfer proposal.
