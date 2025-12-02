[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / StatusUpdatedEvent

# Type Alias: StatusUpdatedEvent

> **StatusUpdatedEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:274](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L274)

Event emitted when a package status changes.

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:280](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L280)

Identity of the caller who updated the status.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:276](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L276)

External identifier of the package.

***

### status

> **status**: [`Status`](../enumerations/Status.md)

Defined in: [src/lib/services/package/types.common.ts:278](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L278)

New status of the package.
