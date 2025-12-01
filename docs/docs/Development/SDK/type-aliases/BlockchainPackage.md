[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / BlockchainPackage

# Type Alias: BlockchainPackage

> **BlockchainPackage** = `object`

Defined in: [src/lib/services/package/types.common.ts:171](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L171)

The on-chain/public representation of a package.

## Properties

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:173](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L173)

External, business-level identifier.

***

### ownerOrgMSP

> **ownerOrgMSP**: `string`

Defined in: [src/lib/services/package/types.common.ts:175](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L175)

MSP/organization that currently owns the package.

***

### packageDetailsAndPIIHash

> **packageDetailsAndPIIHash**: `string`

Defined in: [src/lib/services/package/types.common.ts:183](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L183)

Hash of the package details (and PII + salt).

#### Remarks

Enables integrity checks without disclosing private content.

***

### status

> **status**: [`Status`](../enumerations/Status.md)

Defined in: [src/lib/services/package/types.common.ts:177](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L177)

Current [Status](../enumerations/Status.md).
