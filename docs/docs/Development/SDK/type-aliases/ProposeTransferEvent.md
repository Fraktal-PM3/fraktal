[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / ProposeTransferEvent

# Type Alias: ProposeTransferEvent

> **ProposeTransferEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:285](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L285)

Event emitted when a transfer is proposed.

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:304](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L304)

Identity of the caller who proposed the transfer.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:287](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L287)

External identifier of the package being transferred.

***

### terms

> **terms**: `object`

Defined in: [src/lib/services/package/types.common.ts:291](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L291)

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

Defined in: [src/lib/services/package/types.common.ts:289](https://github.com/Fraktal-PM3/fraktal-lib/blob/83c7e4dd65aa346553765d0c89e45ec502fbf464/src/lib/services/package/types.common.ts#L289)

Identifier for this transfer proposal.
