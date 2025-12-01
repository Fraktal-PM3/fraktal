[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / ProposeTransferEvent

# Type Alias: ProposeTransferEvent

> **ProposeTransferEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:292](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L292)

Event emitted when a transfer is proposed.

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:311](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L311)

Identity of the caller who proposed the transfer.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:294](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L294)

External identifier of the package being transferred.

***

### terms

> **terms**: `object`

Defined in: [src/lib/services/package/types.common.ts:298](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L298)

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

Defined in: [src/lib/services/package/types.common.ts:296](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L296)

Identifier for this transfer proposal.
