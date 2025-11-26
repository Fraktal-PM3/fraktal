[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / PackageEventHandler

# Type Alias: PackageEventHandler()

> **PackageEventHandler** = (`res`) => `void`

Defined in: [src/lib/services/package/types.common.ts:187](https://github.com/Fraktal-PM3/fraktal-lib/blob/eff4b5a6caf1290c4a9614c73cff032385c181de/src/lib/services/package/types.common.ts#L187)

Callback signature for package-related blockchain events.

## Parameters

### res

\{ `output`: `any`; `timestamp`: `string`; `txid`: `string` \| `undefined`; \} | \{ `author`: `string`; `created`: `string`; `hash`: `string`; `id`: `string`; `namespace`: `string`; `signingKey`: `string`; `validator`: `string`; `value`: `any`; \}

## Returns

`void`
