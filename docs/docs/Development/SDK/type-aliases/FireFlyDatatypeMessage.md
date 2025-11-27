[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / FireFlyDatatypeMessage

# Type Alias: FireFlyDatatypeMessage

> **FireFlyDatatypeMessage** = `object`

Defined in: [src/lib/services/package/types.common.ts:200](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L200)

Generic FireFly datatype message event.
Represents a message that was confirmed on-chain with datatype information.

## Properties

### author

> **author**: `string`

Defined in: [src/lib/services/package/types.common.ts:218](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L218)

Author identity.

***

### created

> **created**: `string`

Defined in: [src/lib/services/package/types.common.ts:212](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L212)

ISO-8601 timestamp when created.

***

### hash

> **hash**: `string`

Defined in: [src/lib/services/package/types.common.ts:210](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L210)

Hash of the message content.

***

### header

> **header**: [`FireFlyMessageHeader`](FireFlyMessageHeader.md)

Defined in: [src/lib/services/package/types.common.ts:204](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L204)

Message header with signing and author information.

***

### id

> **id**: `string`

Defined in: [src/lib/services/package/types.common.ts:202](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L202)

Unique message identifier.

***

### namespace

> **namespace**: `string`

Defined in: [src/lib/services/package/types.common.ts:208](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L208)

Namespace the message belongs to.

***

### signingKey

> **signingKey**: `string`

Defined in: [src/lib/services/package/types.common.ts:216](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L216)

Signing key used for this message.

***

### validator

> **validator**: `string`

Defined in: [src/lib/services/package/types.common.ts:206](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L206)

Validator type (typically "json").

***

### value

> **value**: `any`

Defined in: [src/lib/services/package/types.common.ts:214](https://github.com/Fraktal-PM3/fraktal-lib/blob/1a083dd0d8d8f600e13b9e9a0d7fd348dfebf328/src/lib/services/package/types.common.ts#L214)

The parsed message value/payload.
