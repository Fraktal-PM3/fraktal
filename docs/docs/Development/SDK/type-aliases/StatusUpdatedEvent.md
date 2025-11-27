[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / StatusUpdatedEvent

# Type Alias: StatusUpdatedEvent

> **StatusUpdatedEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:261](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L261)

Event emitted when a package status changes.

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:267](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L267)

Identity of the caller who updated the status.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:263](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L263)

External identifier of the package.

***

### status

> **status**: [`Status`](../enumerations/Status.md)

Defined in: [src/lib/services/package/types.common.ts:265](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L265)

New status of the package.
