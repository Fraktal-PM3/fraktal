[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / PackageService

# Class: PackageService

Defined in: [src/lib/services/package/PackageService.ts:83](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L83)

High-level API for interacting with blockchain-based package management via Hyperledger FireFly.

Responsibilities:
- Create and manage FireFly datatypes and contract APIs.
- Invoke smart contract functions for package lifecycle.
- Subscribe to blockchain events and dispatch them to registered handlers.

## Examples

```ts
import FireFly from "@hyperledger/firefly-sdk"
import { PackageService } from "fraktal-lib"

const ff = new FireFly(/* ... */)
const svc = new PackageService(ff)
await svc.initalize()
```

```ts
await svc.onEvent("CreatePackage", (e) => {
  console.log("New package:", e.output.externalId, e.txid)
})
```

```ts
const packageDetails = { /* ... */ }
const pii = { name: "Alice" }
const salt = crypto.randomBytes(16).toString("hex")
await svc.createPackage("pkg123", packageDetails, pii, salt)
```

## Constructors

### Constructor

> **new PackageService**(`ff`): `PackageService`

Defined in: [src/lib/services/package/PackageService.ts:88](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L88)

#### Parameters

##### ff

`FireFly`

#### Returns

`PackageService`

## Methods

### acceptTransfer()

> **acceptTransfer**(`externalId`, `termsId`, `privateTransferTerms`): `Promise`\<`Required`\<\{ \}\>\>

Defined in: [src/lib/services/package/PackageService.ts:790](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L790)

Accepts a previously proposed transfer.

The chaincode internally verifies the package details and PII hash
by calling CheckPackageDetailsAndPIIHash. The caller must provide
the private transfer terms via transient map for verification.

#### Parameters

##### externalId

`string`

Package external ID.

##### termsId

`string`

Identifier of the terms being accepted.

##### privateTransferTerms

Private fields (e.g., `price`) sent via `transientMap`.

###### price

`number`

#### Returns

`Promise`\<`Required`\<\{ \}\>\>

FireFly invocation response.

***

### checkPackageDetailsAndPIIHash()

> **checkPackageDetailsAndPIIHash**(`externalId`, `expectedHash`): `Promise`\<`boolean`\>

Defined in: [src/lib/services/package/PackageService.ts:674](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L674)

Verifies that the private package details and PII hash matches the expected hash.

#### Parameters

##### externalId

`string`

Package external ID.

##### expectedHash

`string`

Expected SHA256 hex hash.

#### Returns

`Promise`\<`boolean`\>

`true` if the hash matches; otherwise `false`.

***

### createPackage()

> **createPackage**(`externalId`, `recipientOrgMSP`, `packageDetails`, `pii`, `salt`, `broadcast`): `Promise`\<`Required`\<\{ \}\>\>

Defined in: [src/lib/services/package/PackageService.ts:531](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L531)

Creates a new package on-chain.

#### Parameters

##### externalId

`string`

Unique external identifier for the package.

##### recipientOrgMSP

`string`

##### packageDetails

[`PackageDetails`](../type-aliases/PackageDetails.md)

Public package metadata (serialized into transient map).

##### pii

[`PackagePII`](../type-aliases/PackagePII.md)

Private identifiable information (serialized into transient map).

##### salt

`string`

Random salt used for hashing private data elsewhere.

##### broadcast

`boolean` = `true`

Whether to broadcast the transaction (default: `true`).

#### Returns

`Promise`\<`Required`\<\{ \}\>\>

FireFly invocation response (transaction submission).

#### Example

```ts
await svc.createPackage("pkg-001", details, { name: "Alice" }, saltHex);
```

***

### deletePackage()

> **deletePackage**(`externalId`): `Promise`\<`Required`\<\{ \}\>\>

Defined in: [src/lib/services/package/PackageService.ts:653](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L653)

Deletes a package from the ledger. You can only delete packages that you own and that are in a deletable state.

#### Parameters

##### externalId

`string`

Package external ID.

#### Returns

`Promise`\<`Required`\<\{ \}\>\>

FireFly invocation response.

***

### executeTransfer()

> **executeTransfer**(`externalId`, `termsId`, `storeObject`): `Promise`\<`Required`\<\{ \}\>\>

Defined in: [src/lib/services/package/PackageService.ts:822](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L822)

Executes a confirmed transfer (finalization step).

#### Parameters

##### externalId

`string`

Package external ID.

##### termsId

`string`

Transfer terms ID.

##### storeObject

[`StoreObject`](../type-aliases/StoreObject.md)

The same data passed in CreatePackage, including salt, PII, and packageDetails. For integrity verification
and transfer of data to the new owner.

#### Returns

`Promise`\<`Required`\<\{ \}\>\>

FireFly invocation response.

***

### getDataType()

> **getDataType**(): `Promise`\<\{ \}\>

Defined in: [src/lib/services/package/PackageService.ts:400](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L400)

Retrieves the private package datatype from FireFly.

#### Returns

`Promise`\<\{ \}\>

The datatype object.

#### Throws

If the datatype does not exist.

***

### getLocalPackage()

> **getLocalPackage**(`id`): `Promise`\<`Required`\<\{ \}\> \| `null`\>

Defined in: [src/lib/services/package/PackageService.ts:493](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L493)

Reads a locally-cached FireFly data record by ID.

#### Parameters

##### id

`string`

FireFly data ID.

#### Returns

`Promise`\<`Required`\<\{ \}\> \| `null`\>

The data record (if found) or `null` if missing/errored.

***

### getTransferOfferDataType()

> **getTransferOfferDataType**(): `Promise`\<\{ \}\>

Defined in: [src/lib/services/package/PackageService.ts:472](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L472)

Retrieve the Transfer Offer FireFly datatype.

This method first verifies that the Transfer Offer datatype exists by calling
`transferOfferDataTypeExists()`. If the datatype is not present, it throws an Error.
If it exists, the method queries the FireFly client (`this.ff.getDatatypes`) for
datatypes matching the configured name and version and returns the first result.

#### Returns

`Promise`\<\{ \}\>

A promise that resolves to the first matching FireFly datatype.

#### Throws

If the Transfer Offer datatype does not exist.

#### Throws

If the underlying FireFly client call (`this.ff.getDatatypes`) fails.

***

### initalize()

> **initalize**(): `Promise`\<`void`\>

Defined in: [src/lib/services/package/PackageService.ts:102](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L102)

Initializes the service:
- Ensures the private package **datatype** exists (creates if missing).
- Ensures the **transfer offer datatype** exists (creates if missing).
- Ensures the **contract interface** and **contract API** exist (creates if missing).
- Registers blockchain **event listeners** for all interface events.

Safe to call multiple times; subsequent calls will no-op.

#### Returns

`Promise`\<`void`\>

Resolves when initialization finishes.

***

### initialized()

> **initialized**(): `boolean`

Defined in: [src/lib/services/package/PackageService.ts:122](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L122)

Whether the service has completed initialization.

#### Returns

`boolean`

`true` if initialized; otherwise `false`.

***

### onEvent()

#### Call Signature

> **onEvent**(`eventName`, `handler`): `Promise`\<`void`\>

Defined in: [src/lib/services/package/PackageService.ts:267](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L267)

Registers a local handler for a blockchain event with type-safe casting.
Provides specific event types for known events, and a generic fallback for others.

##### Parameters

###### eventName

`"CreatePackage"`

Name of the blockchain event (as defined in the contract interface).

###### handler

(`event`) => `void`

Callback invoked for each event delivery with properly typed event data.

##### Returns

`Promise`\<`void`\>

##### Example

```ts
// Type-safe listener for CreatePackage event
await svc.onEvent("CreatePackage", (e) => {
  console.log(e.output.externalId, e.output.ownerOrgMSP)
})

// Type-safe listener for StatusUpdated event
await svc.onEvent("StatusUpdated", (e) => {
  console.log(e.output.externalId, e.output.status)
})

// Type-safe listener for ProposeTransfer event
await svc.onEvent("ProposeTransfer", (e) => {
  console.log(e.output.termsId, e.output.terms.fromMSP)
})
```

#### Call Signature

> **onEvent**(`eventName`, `handler`): `Promise`\<`void`\>

Defined in: [src/lib/services/package/PackageService.ts:274](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L274)

Registers a local handler for a blockchain event with type-safe casting.
Provides specific event types for known events, and a generic fallback for others.

##### Parameters

###### eventName

`"StatusUpdated"`

Name of the blockchain event (as defined in the contract interface).

###### handler

(`event`) => `void`

Callback invoked for each event delivery with properly typed event data.

##### Returns

`Promise`\<`void`\>

##### Example

```ts
// Type-safe listener for CreatePackage event
await svc.onEvent("CreatePackage", (e) => {
  console.log(e.output.externalId, e.output.ownerOrgMSP)
})

// Type-safe listener for StatusUpdated event
await svc.onEvent("StatusUpdated", (e) => {
  console.log(e.output.externalId, e.output.status)
})

// Type-safe listener for ProposeTransfer event
await svc.onEvent("ProposeTransfer", (e) => {
  console.log(e.output.termsId, e.output.terms.fromMSP)
})
```

#### Call Signature

> **onEvent**(`eventName`, `handler`): `Promise`\<`void`\>

Defined in: [src/lib/services/package/PackageService.ts:281](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L281)

Registers a local handler for a blockchain event with type-safe casting.
Provides specific event types for known events, and a generic fallback for others.

##### Parameters

###### eventName

`"DeletePackage"`

Name of the blockchain event (as defined in the contract interface).

###### handler

(`event`) => `void`

Callback invoked for each event delivery with properly typed event data.

##### Returns

`Promise`\<`void`\>

##### Example

```ts
// Type-safe listener for CreatePackage event
await svc.onEvent("CreatePackage", (e) => {
  console.log(e.output.externalId, e.output.ownerOrgMSP)
})

// Type-safe listener for StatusUpdated event
await svc.onEvent("StatusUpdated", (e) => {
  console.log(e.output.externalId, e.output.status)
})

// Type-safe listener for ProposeTransfer event
await svc.onEvent("ProposeTransfer", (e) => {
  console.log(e.output.termsId, e.output.terms.fromMSP)
})
```

#### Call Signature

> **onEvent**(`eventName`, `handler`): `Promise`\<`void`\>

Defined in: [src/lib/services/package/PackageService.ts:288](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L288)

Registers a local handler for a blockchain event with type-safe casting.
Provides specific event types for known events, and a generic fallback for others.

##### Parameters

###### eventName

`"ProposeTransfer"`

Name of the blockchain event (as defined in the contract interface).

###### handler

(`event`) => `void`

Callback invoked for each event delivery with properly typed event data.

##### Returns

`Promise`\<`void`\>

##### Example

```ts
// Type-safe listener for CreatePackage event
await svc.onEvent("CreatePackage", (e) => {
  console.log(e.output.externalId, e.output.ownerOrgMSP)
})

// Type-safe listener for StatusUpdated event
await svc.onEvent("StatusUpdated", (e) => {
  console.log(e.output.externalId, e.output.status)
})

// Type-safe listener for ProposeTransfer event
await svc.onEvent("ProposeTransfer", (e) => {
  console.log(e.output.termsId, e.output.terms.fromMSP)
})
```

#### Call Signature

> **onEvent**(`eventName`, `handler`): `Promise`\<`void`\>

Defined in: [src/lib/services/package/PackageService.ts:295](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L295)

Registers a local handler for a blockchain event with type-safe casting.
Provides specific event types for known events, and a generic fallback for others.

##### Parameters

###### eventName

`"AcceptTransfer"`

Name of the blockchain event (as defined in the contract interface).

###### handler

(`event`) => `void`

Callback invoked for each event delivery with properly typed event data.

##### Returns

`Promise`\<`void`\>

##### Example

```ts
// Type-safe listener for CreatePackage event
await svc.onEvent("CreatePackage", (e) => {
  console.log(e.output.externalId, e.output.ownerOrgMSP)
})

// Type-safe listener for StatusUpdated event
await svc.onEvent("StatusUpdated", (e) => {
  console.log(e.output.externalId, e.output.status)
})

// Type-safe listener for ProposeTransfer event
await svc.onEvent("ProposeTransfer", (e) => {
  console.log(e.output.termsId, e.output.terms.fromMSP)
})
```

#### Call Signature

> **onEvent**(`eventName`, `handler`): `Promise`\<`void`\>

Defined in: [src/lib/services/package/PackageService.ts:302](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L302)

Registers a local handler for a blockchain event with type-safe casting.
Provides specific event types for known events, and a generic fallback for others.

##### Parameters

###### eventName

`"TransferExecuted"`

Name of the blockchain event (as defined in the contract interface).

###### handler

(`event`) => `void`

Callback invoked for each event delivery with properly typed event data.

##### Returns

`Promise`\<`void`\>

##### Example

```ts
// Type-safe listener for CreatePackage event
await svc.onEvent("CreatePackage", (e) => {
  console.log(e.output.externalId, e.output.ownerOrgMSP)
})

// Type-safe listener for StatusUpdated event
await svc.onEvent("StatusUpdated", (e) => {
  console.log(e.output.externalId, e.output.status)
})

// Type-safe listener for ProposeTransfer event
await svc.onEvent("ProposeTransfer", (e) => {
  console.log(e.output.termsId, e.output.terms.fromMSP)
})
```

#### Call Signature

> **onEvent**(`eventName`, `handler`): `Promise`\<`void`\>

Defined in: [src/lib/services/package/PackageService.ts:310](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L310)

Registers a local handler for a blockchain event with type-safe casting.
Provides specific event types for known events, and a generic fallback for others.

##### Parameters

###### eventName

`"message"`

Name of the blockchain event (as defined in the contract interface).

###### handler

(`event`) => `void`

Callback invoked for each event delivery with properly typed event data.

##### Returns

`Promise`\<`void`\>

##### Example

```ts
// Type-safe listener for CreatePackage event
await svc.onEvent("CreatePackage", (e) => {
  console.log(e.output.externalId, e.output.ownerOrgMSP)
})

// Type-safe listener for StatusUpdated event
await svc.onEvent("StatusUpdated", (e) => {
  console.log(e.output.externalId, e.output.status)
})

// Type-safe listener for ProposeTransfer event
await svc.onEvent("ProposeTransfer", (e) => {
  console.log(e.output.termsId, e.output.terms.fromMSP)
})
```

#### Call Signature

> **onEvent**(`eventName`, `handler`): `Promise`\<`void`\>

Defined in: [src/lib/services/package/PackageService.ts:316](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L316)

Registers a local handler for a blockchain event with type-safe casting.
Provides specific event types for known events, and a generic fallback for others.

##### Parameters

###### eventName

`string`

Name of the blockchain event (as defined in the contract interface).

###### handler

(`event`) => `void`

Callback invoked for each event delivery with properly typed event data.

##### Returns

`Promise`\<`void`\>

##### Example

```ts
// Type-safe listener for CreatePackage event
await svc.onEvent("CreatePackage", (e) => {
  console.log(e.output.externalId, e.output.ownerOrgMSP)
})

// Type-safe listener for StatusUpdated event
await svc.onEvent("StatusUpdated", (e) => {
  console.log(e.output.externalId, e.output.status)
})

// Type-safe listener for ProposeTransfer event
await svc.onEvent("ProposeTransfer", (e) => {
  console.log(e.output.termsId, e.output.terms.fromMSP)
})
```

***

### packageExists()

> **packageExists**(`externalId`): `Promise`\<`boolean`\>

Defined in: [src/lib/services/package/PackageService.ts:615](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L615)

Checks if a package exists on-chain.

#### Parameters

##### externalId

`string`

Package external ID.

#### Returns

`Promise`\<`boolean`\>

`true` if the package exists; otherwise `false`.

***

### proposeTransfer()

> **proposeTransfer**(`externalId`, `toMSP`, `terms`, `expiryISO?`): `Promise`\<`Required`\<\{ \}\>\>

Defined in: [src/lib/services/package/PackageService.ts:704](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L704)

Proposes a transfer to another organization.

#### Parameters

##### externalId

`string`

Package external ID.

##### toMSP

`string`

MSP ID of the recipient organization.

##### terms

Proposed terms `{ id, price }`. The `price` is sent privately via `transientMap`.

###### id

`string`

###### price

`number`

##### expiryISO?

`string`

Optional ISO-8601 expiry time for the offer.

#### Returns

`Promise`\<`Required`\<\{ \}\>\>

FireFlyContractInvokeResponse.

#### Example

```ts
await svc.proposeTransfer("pkg-001", "Org2MSP", { id: "t-123", price: 42.5 });
```

***

### readBlockchainPackage()

> **readBlockchainPackage**(`externalId`): `Promise`\<[`BlockchainPackage`](../type-aliases/BlockchainPackage.md)\>

Defined in: [src/lib/services/package/PackageService.ts:595](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L595)

Reads the public, on-chain package record.

#### Parameters

##### externalId

`string`

Package external ID.

#### Returns

`Promise`\<[`BlockchainPackage`](../type-aliases/BlockchainPackage.md)\>

The [BlockchainPackage](../type-aliases/BlockchainPackage.md).

***

### readPackageDetailsAndPII()

> **readPackageDetailsAndPII**(`externalId`): `Promise`\<`Required`\<`any`\>\>

Defined in: [src/lib/services/package/PackageService.ts:633](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L633)

Reads the **private** package details and PII visible to the caller’s org.

#### Parameters

##### externalId

`string`

Package external ID.

#### Returns

`Promise`\<`Required`\<`any`\>\>

Implementation-specific object with details + PII.

***

### readPrivateTransferTerms()

> **readPrivateTransferTerms**(`termsId`): `Promise`\<`Required`\<`any`\>\>

Defined in: [src/lib/services/package/PackageService.ts:763](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L763)

Reads the private transfer terms for a given terms ID.
Only the recipient organization (toMSP) can read their private terms.

#### Parameters

##### termsId

`string`

Transfer terms identifier.

#### Returns

`Promise`\<`Required`\<`any`\>\>

The private transfer terms as a JSON string.

***

### readTransferTerms()

> **readTransferTerms**(`termsId`): `Promise`\<`Required`\<`any`\>\>

Defined in: [src/lib/services/package/PackageService.ts:742](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L742)

Reads the public transfer terms for a given terms ID.

#### Parameters

##### termsId

`string`

Transfer terms identifier.

#### Returns

`Promise`\<`Required`\<`any`\>\>

The transfer terms as a JSON string.

***

### transferOfferDataTypeExists()

> **transferOfferDataTypeExists**(): `Promise`\<`boolean`\>

Defined in: [src/lib/services/package/PackageService.ts:451](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L451)

Determines whether the Transfer Offer data type (identified by TRANSFER_OFFER_DT_NAME and
TRANSFER_OFFER_DT_VERSION) is present in the data type registry.

The method queries the underlying data-type service via `this.ff.getDatatypes(...)` and returns
true if at least one matching data type is returned.

#### Returns

`Promise`\<`boolean`\>

A Promise that resolves to `true` if one or more matching data types exist, otherwise `false`.

#### Throws

Propagates any error thrown by `this.ff.getDatatypes`.

***

### updatePackageStatus()

> **updatePackageStatus**(`externalId`, `status`): `Promise`\<`Required`\<\{ \}\>\>

Defined in: [src/lib/services/package/PackageService.ts:574](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L574)

Updates the **status** of an existing package.

#### Parameters

##### externalId

`string`

Package external ID.

##### status

[`Status`](../enumerations/Status.md)

New [Status](../enumerations/Status.md).

#### Returns

`Promise`\<`Required`\<\{ \}\>\>

FireFly invocation response.

***

### uploadPackage()

> **uploadPackage**(`pkg`): `Promise`\<`Required`\<\{ \}\>\>

Defined in: [src/lib/services/package/PackageService.ts:500](https://github.com/Fraktal-PM3/fraktal-lib/blob/264f9dc8966b61c0fde5ee253960ad54127b041e/src/lib/services/package/PackageService.ts#L500)

#### Parameters

##### pkg

[`PackageDetailsWithId`](../type-aliases/PackageDetailsWithId.md)

#### Returns

`Promise`\<`Required`\<\{ \}\>\>
