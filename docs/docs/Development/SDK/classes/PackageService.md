[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / PackageService

# Class: PackageService

Defined in: [src/lib/services/package/PackageService.ts:50](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L50)

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
await svc.onEvent("PackageCreated", (e) => {
  console.log("New package:", e.output, e.txid)
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

Defined in: [src/lib/services/package/PackageService.ts:55](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L55)

#### Parameters

##### ff

`FireFly`

#### Returns

`PackageService`

## Methods

### acceptTransfer()

> **acceptTransfer**(`externalId`, `termsId`, `privateTransferTerms`): `Promise`\<`Required`\<\{ \}\>\>

Defined in: [src/lib/services/package/PackageService.ts:553](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L553)

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

Defined in: [src/lib/services/package/PackageService.ts:437](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L437)

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

> **createPackage**(`externalId`, `packageDetails`, `pii`, `salt`, `broadcast`): `Promise`\<`Required`\<\{ \}\>\>

Defined in: [src/lib/services/package/PackageService.ts:303](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L303)

Creates a new package on-chain.

#### Parameters

##### externalId

`string`

Unique external identifier for the package.

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

Defined in: [src/lib/services/package/PackageService.ts:418](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L418)

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

Defined in: [src/lib/services/package/PackageService.ts:585](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L585)

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

Defined in: [src/lib/services/package/PackageService.ts:245](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L245)

Retrieves the private package datatype from FireFly.

#### Returns

`Promise`\<\{ \}\>

The datatype object.

#### Throws

If the datatype does not exist.

***

### getLocalPackage()

> **getLocalPackage**(`id`): `Promise`\<`Required`\<\{ \}\> \| `null`\>

Defined in: [src/lib/services/package/PackageService.ts:267](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L267)

Reads a locally-cached FireFly data record by ID.

#### Parameters

##### id

`string`

FireFly data ID.

#### Returns

`Promise`\<`Required`\<\{ \}\> \| `null`\>

The data record (if found) or `null` if missing/errored.

***

### initalize()

> **initalize**(): `Promise`\<`void`\>

Defined in: [src/lib/services/package/PackageService.ts:68](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L68)

Initializes the service:
- Ensures the private package **datatype** exists (creates if missing).
- Ensures the **contract interface** and **contract API** exist (creates if missing).
- Registers blockchain **event listeners** for all interface events.

Safe to call multiple times; subsequent calls will no-op.

#### Returns

`Promise`\<`void`\>

Resolves when initialization finishes.

***

### initialized()

> **initialized**(): `boolean`

Defined in: [src/lib/services/package/PackageService.ts:84](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L84)

Whether the service has completed initialization.

#### Returns

`boolean`

`true` if initialized; otherwise `false`.

***

### onEvent()

> **onEvent**(`eventName`, `handler`): `Promise`\<`void`\>

Defined in: [src/lib/services/package/PackageService.ts:176](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L176)

Registers a local handler for a blockchain event.

#### Parameters

##### eventName

`string`

Name of the blockchain event (as defined in the contract interface).

##### handler

(...`args`) => `void`

Callback invoked for each event delivery.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await svc.onEvent("PackageUpdated", (e) => {
  console.log(e.txid, e.timestamp, e.output)
})
```

***

### packageExists()

> **packageExists**(`externalId`): `Promise`\<`boolean`\>

Defined in: [src/lib/services/package/PackageService.ts:380](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L380)

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

Defined in: [src/lib/services/package/PackageService.ts:467](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L467)

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

Defined in: [src/lib/services/package/PackageService.ts:362](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L362)

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

Defined in: [src/lib/services/package/PackageService.ts:398](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L398)

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

Defined in: [src/lib/services/package/PackageService.ts:526](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L526)

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

Defined in: [src/lib/services/package/PackageService.ts:505](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L505)

Reads the public transfer terms for a given terms ID.

#### Parameters

##### termsId

`string`

Transfer terms identifier.

#### Returns

`Promise`\<`Required`\<`any`\>\>

The transfer terms as a JSON string.

***

### updatePackageStatus()

> **updatePackageStatus**(`externalId`, `status`): `Promise`\<`Required`\<\{ \}\>\>

Defined in: [src/lib/services/package/PackageService.ts:344](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L344)

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

Defined in: [src/lib/services/package/PackageService.ts:272](https://github.com/Fraktal-PM3/fraktal-lib/blob/3bb28aef27366ea851309d078ee663a9c495ab10/src/lib/services/package/PackageService.ts#L272)

#### Parameters

##### pkg

[`PackageDetailsWithId`](../type-aliases/PackageDetailsWithId.md)

#### Returns

`Promise`\<`Required`\<\{ \}\>\>
