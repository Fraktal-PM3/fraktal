[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / FireFlyDatatypeMessage

# Type Alias: FireFlyDatatypeMessage

> **FireFlyDatatypeMessage** = `object`

Defined in: [src/lib/services/package/types.common.ts:207](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L207)

Generic FireFly datatype message event.
Represents a message that was confirmed on-chain with datatype information.

## Properties

### author

> **author**: `string`

Defined in: [src/lib/services/package/types.common.ts:225](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L225)

Author identity.

***

### created

> **created**: `string`

Defined in: [src/lib/services/package/types.common.ts:219](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L219)

ISO-8601 timestamp when created.

***

### hash

> **hash**: `string`

Defined in: [src/lib/services/package/types.common.ts:217](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L217)

Hash of the message content.

***

### header

> **header**: [`FireFlyMessageHeader`](FireFlyMessageHeader.md)

Defined in: [src/lib/services/package/types.common.ts:211](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L211)

Message header with signing and author information.

***

### id

> **id**: `string`

Defined in: [src/lib/services/package/types.common.ts:209](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L209)

Unique message identifier.

***

### namespace

> **namespace**: `string`

Defined in: [src/lib/services/package/types.common.ts:215](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L215)

Namespace the message belongs to.

***

### signingKey

> **signingKey**: `string`

Defined in: [src/lib/services/package/types.common.ts:223](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L223)

Signing key used for this message.

***

### validator

> **validator**: `string`

Defined in: [src/lib/services/package/types.common.ts:213](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L213)

Validator type (typically "json").

***

### value

> **value**: `any`

Defined in: [src/lib/services/package/types.common.ts:221](https://github.com/Fraktal-PM3/fraktal-lib/blob/ce999374d61643a8d0997907334a30d246182b3e/src/lib/services/package/types.common.ts#L221)

The parsed message value/payload.
