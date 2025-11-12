[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / BlockchainPackage

# Type Alias: BlockchainPackage

> **BlockchainPackage** = `object`

Defined in: [src/lib/services/package/types.common.ts:162](https://github.com/Fraktal-PM3/fraktal-lib/blob/fb7e8d6fe7788d4f61b3eac0583e0a47cc3cedd1/src/lib/services/package/types.common.ts#L162)

The on-chain/public representation of a package.

## Properties

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:164](https://github.com/Fraktal-PM3/fraktal-lib/blob/fb7e8d6fe7788d4f61b3eac0583e0a47cc3cedd1/src/lib/services/package/types.common.ts#L164)

External, business-level identifier.

***

### ownerOrgMSP

> **ownerOrgMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:166](https://github.com/Fraktal-PM3/fraktal-lib/blob/fb7e8d6fe7788d4f61b3eac0583e0a47cc3cedd1/src/lib/services/package/types.common.ts#L166)

MSP/organization that currently owns the package.

***

### packageDetailsHash

> **packageDetailsHash**: `string`

Defined in: [src/lib/services/package/types.common.ts:174](https://github.com/Fraktal-PM3/fraktal-lib/blob/fb7e8d6fe7788d4f61b3eac0583e0a47cc3cedd1/src/lib/services/package/types.common.ts#L174)

Hash of the package details (and possibly PII+salt, per implementation).

#### Remarks

Enables integrity checks without disclosing private content.

***

### status

> **status**: [`Status`](../enumerations/Status.md)

Defined in: [src/lib/services/package/types.common.ts:168](https://github.com/Fraktal-PM3/fraktal-lib/blob/fb7e8d6fe7788d4f61b3eac0583e0a47cc3cedd1/src/lib/services/package/types.common.ts#L168)

Current [Status](../enumerations/Status.md).
