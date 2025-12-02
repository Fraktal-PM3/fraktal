[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / TransferTerms

# Type Alias: TransferTerms

> **TransferTerms** = `object`

Defined in: [src/lib/services/package/types.common.ts:99](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L99)

Public transfer terms that identify the package and counterparties.

## Properties

### createdISO

> **createdISO**: `string`

Defined in: [src/lib/services/package/types.common.ts:107](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L107)

ISO-8601 creation timestamp of the proposal.

***

### expiryISO

> **expiryISO**: `string` \| `null` \| `undefined`

Defined in: [src/lib/services/package/types.common.ts:112](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L112)

Optional ISO-8601 expiry timestamp.
If `null`/`undefined`, the proposal does not expire automatically.

***

### externalPackageId

> **externalPackageId**: `string`

Defined in: [src/lib/services/package/types.common.ts:101](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L101)

External identifier of the package being transferred.

***

### fromMSP

> **fromMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:103](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L103)

MSP/organization initiating the transfer.

***

### privateTermsHash

> **privateTermsHash**: `string`

Defined in: [src/lib/services/package/types.common.ts:117](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L117)

SHA256 hash of the private transfer terms.
Used to verify integrity without revealing private data publicly.

***

### toMSP

> **toMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:105](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L105)

MSP/organization targeted to receive the package.
