[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / BlockchainPackage

# Type Alias: BlockchainPackage

> **BlockchainPackage** = `object`

Defined in: [src/lib/services/package/types.common.ts:164](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/types.common.ts#L164)

The on-chain/public representation of a package.

## Properties

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:166](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/types.common.ts#L166)

External, business-level identifier.

***

### ownerOrgMSP

> **ownerOrgMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:168](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/types.common.ts#L168)

MSP/organization that currently owns the package.

***

### packageDetailsAndPIIHash

> **packageDetailsAndPIIHash**: `string`

Defined in: [src/lib/services/package/types.common.ts:176](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/types.common.ts#L176)

Hash of the package details (and possibly PII+salt, per implementation).

#### Remarks

Enables integrity checks without disclosing private content.

***

### status

> **status**: [`Status`](../enumerations/Status.md)

Defined in: [src/lib/services/package/types.common.ts:170](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/types.common.ts#L170)

Current [Status](../enumerations/Status.md).
