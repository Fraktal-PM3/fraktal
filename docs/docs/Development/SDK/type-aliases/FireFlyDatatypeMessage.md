[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / FireFlyDatatypeMessage

# Type Alias: FireFlyDatatypeMessage

> **FireFlyDatatypeMessage** = `object`

Defined in: [src/lib/services/package/types.common.ts:213](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L213)

Generic FireFly datatype message event.
Represents a message that was confirmed on-chain with datatype information.

## Properties

### author

> **author**: `string`

Defined in: [src/lib/services/package/types.common.ts:231](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L231)

Author identity.

***

### created

> **created**: `string`

Defined in: [src/lib/services/package/types.common.ts:225](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L225)

ISO-8601 timestamp when created.

***

### hash

> **hash**: `string`

Defined in: [src/lib/services/package/types.common.ts:223](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L223)

Hash of the message content.

***

### header

> **header**: [`FireFlyMessageHeader`](FireFlyMessageHeader.md)

Defined in: [src/lib/services/package/types.common.ts:217](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L217)

Message header with signing and author information.

***

### id

> **id**: `string`

Defined in: [src/lib/services/package/types.common.ts:215](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L215)

Unique message identifier.

***

### namespace

> **namespace**: `string`

Defined in: [src/lib/services/package/types.common.ts:221](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L221)

Namespace the message belongs to.

***

### signingKey

> **signingKey**: `string`

Defined in: [src/lib/services/package/types.common.ts:229](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L229)

Signing key used for this message.

***

### validator

> **validator**: `string`

Defined in: [src/lib/services/package/types.common.ts:219](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L219)

Validator type (typically "json").

***

### value

> **value**: `any`

Defined in: [src/lib/services/package/types.common.ts:227](https://github.com/Fraktal-PM3/fraktal-lib/blob/edf80d1ae36c4ff5ecc8f5c693291c518d5289d1/src/lib/services/package/types.common.ts#L227)

The parsed message value/payload.
