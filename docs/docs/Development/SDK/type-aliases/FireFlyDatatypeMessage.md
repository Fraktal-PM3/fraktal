[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / FireFlyDatatypeMessage

# Type Alias: FireFlyDatatypeMessage

> **FireFlyDatatypeMessage** = `object`

Defined in: [src/lib/services/package/types.common.ts:210](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L210)

Generic FireFly datatype message event.
Represents a message that was confirmed on-chain with datatype information.

## Properties

### author

> **author**: `string`

Defined in: [src/lib/services/package/types.common.ts:228](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L228)

Author identity.

***

### created

> **created**: `string`

Defined in: [src/lib/services/package/types.common.ts:222](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L222)

ISO-8601 timestamp when created.

***

### hash

> **hash**: `string`

Defined in: [src/lib/services/package/types.common.ts:220](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L220)

Hash of the message content.

***

### header

> **header**: [`FireFlyMessageHeader`](FireFlyMessageHeader.md)

Defined in: [src/lib/services/package/types.common.ts:214](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L214)

Message header with signing and author information.

***

### id

> **id**: `string`

Defined in: [src/lib/services/package/types.common.ts:212](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L212)

Unique message identifier.

***

### namespace

> **namespace**: `string`

Defined in: [src/lib/services/package/types.common.ts:218](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L218)

Namespace the message belongs to.

***

### signingKey

> **signingKey**: `string`

Defined in: [src/lib/services/package/types.common.ts:226](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L226)

Signing key used for this message.

***

### validator

> **validator**: `string`

Defined in: [src/lib/services/package/types.common.ts:216](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L216)

Validator type (typically "json").

***

### value

> **value**: `any`

Defined in: [src/lib/services/package/types.common.ts:224](https://github.com/Fraktal-PM3/fraktal-lib/blob/923fd0ee464d01ab825000e88a2852e9d2ca6a86/src/lib/services/package/types.common.ts#L224)

The parsed message value/payload.
