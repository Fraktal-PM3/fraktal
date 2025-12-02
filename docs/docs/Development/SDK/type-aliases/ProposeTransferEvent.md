[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / ProposeTransferEvent

# Type Alias: ProposeTransferEvent

> **ProposeTransferEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:298](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L298)

Event emitted when a transfer is proposed.

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:317](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L317)

Identity of the caller who proposed the transfer.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:300](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L300)

External identifier of the package being transferred.

***

### terms

> **terms**: `object`

Defined in: [src/lib/services/package/types.common.ts:304](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L304)

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

Defined in: [src/lib/services/package/types.common.ts:302](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L302)

Identifier for this transfer proposal.
