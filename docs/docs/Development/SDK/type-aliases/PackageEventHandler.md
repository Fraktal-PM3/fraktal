[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / PackageEventHandler

# Type Alias: PackageEventHandler()

> **PackageEventHandler** = (`res`) => `void`

Defined in: [src/lib/services/package/types.common.ts:187](https://github.com/Fraktal-PM3/fraktal-lib/blob/7321e86e85b115942bce945b2b3c1c1ca5059f46/src/lib/services/package/types.common.ts#L187)

Callback signature for package-related blockchain events.

## Parameters

### res

\{ `output`: `any`; `timestamp`: `string`; `txid`: `string` \| `undefined`; \} | \{ `author`: `string`; `created`: `string`; `hash`: `string`; `header`: `any`; `id`: `string`; `namespace`: `string`; `signingKey`: `string`; `validator`: `string`; `value`: `any`; \}

## Returns

`void`
