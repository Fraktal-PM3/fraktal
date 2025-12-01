[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / StatusUpdatedEvent

# Type Alias: StatusUpdatedEvent

> **StatusUpdatedEvent** = `object`

Defined in: [src/lib/services/package/types.common.ts:268](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L268)

Event emitted when a package status changes.

## Properties

### caller

> **caller**: `string`

Defined in: [src/lib/services/package/types.common.ts:274](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L274)

Identity of the caller who updated the status.

***

### externalId

> **externalId**: `string`

Defined in: [src/lib/services/package/types.common.ts:270](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L270)

External identifier of the package.

***

### status

> **status**: [`Status`](../enumerations/Status.md)

Defined in: [src/lib/services/package/types.common.ts:272](https://github.com/Fraktal-PM3/fraktal-lib/blob/5f3b11a2f5ed5a955483a277e36fe14ae1f4b719/src/lib/services/package/types.common.ts#L272)

New status of the package.
