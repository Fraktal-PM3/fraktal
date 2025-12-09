import { createHash } from "crypto"
import {
    Context,
    Contract,
    Info,
    Returns,
    Transaction,
} from "fabric-contract-api"
import stringify from "json-stringify-deterministic"
import sortKeysRecursive from "sort-keys-recursive"
import { BlockchainPackageSchema, Status, TransferTerms } from "./package"
import {
    callerMSP,
    getImplicitCollection,
    isAllowedTransition,
    isISODateString,
    isUUID,
    setAssetStateBasedEndorsement,
    validateJSONToBlockchainPackage,
    validateJSONToPackageDetails,
    validateJSONToPII,
    validateJSONToPrivateTransferTerms,
    validateJSONToStoreObject,
    validateJSONToTransferTerms,
} from "./utils"

const compositeKeyPrefix = "transferTerms"

export const PM3_MSPID = "Org1MSP"

@Info({
    title: "PackageContract",
    description: "Smart contract for managing packages",
})
export class PackageContract extends Contract {
    /**
     * CreatePackage issues a new package to the world state with given details.
     * Stores the private package details and PII in the caller's implicit collection
     * and a public package record (with a hash of the private blob) on the ledger.
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier (unique)
     * @returns {Promise<void>}
     */
    @Transaction()
    public async CreatePackage(
        ctx: Context,
        externalId: string,
        recipientOrgMSP: string,
    ): Promise<void> {
        const callerMSPID = callerMSP(ctx)
        console.log(
            `[CreatePackage] Called by: ${callerMSPID} for package: ${externalId}`,
        )

        if (!externalId || externalId.trim() === "") {
            throw new Error("packageID must be a non-empty string")
        }

        const exists = await this.PackageExists(ctx, externalId)
        if (exists) {
            throw new Error(`The package ${externalId} already exists`)
        }

        const ownerOrgMSPID = callerMSPID
        console.log(`[CreatePackage] Package owner will be: ${ownerOrgMSPID}`)

        // Read the private details of the package from transient data
        const tmap = ctx.stub.getTransient()
        const piiBuf = tmap.get("pii")
        if (!piiBuf) {
            throw new Error("Missing transient field 'pii'")
        }

        const parsedPII = validateJSONToPII(piiBuf.toString())

        const packageDetails = tmap.get("packageDetails")
        if (!packageDetails) {
            throw new Error(
                "Missing transient field 'packageDetails' (must be JSON of PackageDetails)",
            )
        }

        const parsedPackageInfo = validateJSONToPackageDetails(
            packageDetails.toString(),
        )

        const salt = tmap.get("salt")
        if (!salt) throw new Error("Missing transient field 'salt'")
        const parsedSalt = salt.toString()
        const storeObject = {
            packageDetails: parsedPackageInfo,
            pii: parsedPII,
            salt: parsedSalt,
        }

        const canonicalPackageInfo = stringify(sortKeysRecursive(storeObject))
        const packageInfoHash = createHash("sha256")
            .update(canonicalPackageInfo)
            .digest("hex")

        // Store private data in the owner organization's implicit collection
        const ownerCollection = getImplicitCollection(ownerOrgMSPID)
        console.log(
            `[CreatePackage] Writing private data to collection: ${ownerCollection}`,
        )
        await ctx.stub.putPrivateData(
            ownerCollection,
            externalId,
            Buffer.from(stringify(sortKeysRecursive(storeObject))),
        )

        console.log(
            `[CreatePackage] Successfully wrote private data to ${ownerCollection}`,
        )

        const blockchainPackage = BlockchainPackageSchema.parse({
            externalId: externalId,
            ownerOrgMSP: ownerOrgMSPID,
            status: Status.PENDING,
            recipientOrgMSP: recipientOrgMSP,
            senderOrgMSP: ownerOrgMSPID,
            packageDetailsAndPIIHash: packageInfoHash,
        })

        const stateBuffer = Buffer.from(
            stringify(sortKeysRecursive(blockchainPackage)),
        )
        const eventBuffer = Buffer.from(
            stringify(
                sortKeysRecursive({
                    ...blockchainPackage,
                    caller: ownerOrgMSPID,
                }),
            ),
        )

        await ctx.stub.putState(externalId, stateBuffer)

        await setAssetStateBasedEndorsement(ctx, externalId, [ownerOrgMSPID])

        ctx.stub.setEvent("CreatePackage", eventBuffer)
    }

    /**
     * ReadBlockchainPackage returns the public package stored in the world state.
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier
     * @returns {Promise<string>} JSON serialized public package
     */
    @Transaction(false)
    public async ReadBlockchainPackage(
        ctx: Context,
        externalId: string,
    ): Promise<string> {
        const packageJSON = await ctx.stub.getState(externalId) // get the package from chaincode state
        if (packageJSON.length === 0) {
            throw new Error(`The package ${externalId} does not exist`)
        }
        return packageJSON.toString()
    }

    /**
     * ReadPackageDetailsAndPII returns the private package blob (details + PII)
     * for the caller's organization. Only the owning org may read their private data.
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier
     * @returns {Promise<string>} JSON serialized private blob
     */
    @Transaction(false)
    public async ReadPackageDetailsAndPII(
        ctx: Context,
        externalId: string,
    ): Promise<string> {
        const callerMSPID = callerMSP(ctx)
        console.log(
            `[ReadPackageDetailsAndPII] Called by: ${callerMSPID} for package: ${externalId}`,
        )

        const blockchainPackageString = await this.ReadBlockchainPackage(
            ctx,
            externalId,
        ) // Verify package exists
        const blockchainPackage = validateJSONToBlockchainPackage(
            blockchainPackageString,
        )

        console.log(
            `[ReadPackageDetailsAndPII] Package owner: ${blockchainPackage.ownerOrgMSP}, Caller: ${callerMSPID}`,
        )

        // CRITICAL: Only the owner organization can read private data from their implicit collection
        if (blockchainPackage.ownerOrgMSP !== callerMSPID) {
            console.log(
                `[ReadPackageDetailsAndPII] ACCESS DENIED: ${callerMSPID} tried to read package owned by ${blockchainPackage.ownerOrgMSP}`,
            )
            throw new Error(
                `The caller organization (${callerMSPID}) is not authorized to read the private details of package ${externalId} owned by ${blockchainPackage.ownerOrgMSP}`,
            )
        }

        console.log(
            `[ReadPackageDetailsAndPII] ACCESS GRANTED: Reading from ${callerMSPID}'s implicit collection`,
        )

        // Read from the owner's implicit collection (which is also the caller's collection after the check above)
        const ownerCollection = getImplicitCollection(callerMSPID)
        console.log(
            `[ReadPackageDetailsAndPII] Collection name: ${ownerCollection}`,
        )

        const privateBuf = await ctx.stub.getPrivateData(
            ownerCollection,
            externalId,
        )
        if (privateBuf.length === 0) {
            console.log(
                `[ReadPackageDetailsAndPII] ERROR: No data found in collection ${ownerCollection} for key ${externalId}`,
            )
            throw new Error(
                `The private package information for package ${externalId} does not exist in ${callerMSPID}'s collection`,
            )
        }

        console.log(
            `[ReadPackageDetailsAndPII] SUCCESS: Retrieved private data for ${externalId}`,
        )
        return privateBuf.toString()
    }

    /**
     * UpdatePackageStatus updates the public package status. Only the owner org
     * may perform updates and certain transitions require specific roles.
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier
     * @param {Status} status - New status to set
     * @returns {Promise<void>}
     */
    @Transaction()
    public async UpdatePackageStatus(
        ctx: Context,
        externalId: string,
        status: Status,
    ): Promise<void> {
        const packageJSON = await this.ReadBlockchainPackage(ctx, externalId)
        const packageData = validateJSONToBlockchainPackage(packageJSON)

        const callerMSPID = callerMSP(ctx)
        const isOwner = packageData.ownerOrgMSP === callerMSPID

        // Enforce that only the owner organization can update the package status
        if (!isOwner) {
            throw new Error(
                `The caller is not authorized to update the package ${externalId} status`,
            )
        }

        if (!isAllowedTransition(packageData.status, status)) {
            throw new Error(
                `The status transition from ${packageData.status} to ${status} is not allowed`,
            )
        }

        // Set the new status
        packageData.status = status

        const stateBuffer = Buffer.from(
            stringify(sortKeysRecursive(packageData)),
        )
        const eventBuffer = Buffer.from(
            stringify(
                sortKeysRecursive({
                    externalId: externalId,
                    status,
                    caller: callerMSPID,
                }),
            ),
        )

        await ctx.stub.putState(externalId, stateBuffer)
        ctx.stub.setEvent("StatusUpdated", eventBuffer)
    }

    /** Deletes a package from the world state
     * - Owner can delete if status is PENDING
     * - Owner can delete if there's an active transfer proposal (before execution)
     * @param ctx - The transaction context
     * @param externalId - Unique identifier for the package
     * @throws {Error} If caller doesn't have required permissions
     */
    @Transaction()
    public async DeletePackage(
        ctx: Context,
        externalId: string,
    ): Promise<void> {
        const packageJSON = await this.ReadBlockchainPackage(ctx, externalId)
        const packageData = validateJSONToBlockchainPackage(packageJSON)

        const callerMSPID = callerMSP(ctx)
        const isOwner = packageData.ownerOrgMSP === callerMSPID

        if (
            isOwner &&
            (packageData.status === Status.PENDING ||
                packageData.status === Status.PROPOSED ||
                packageData.status === Status.READY_FOR_PICKUP)
        ) {
            const iterator = await ctx.stub.getStateByPartialCompositeKey(
                compositeKeyPrefix,
                [externalId],
            )

            let result = await iterator.next()
            while (!result.done) {
                const compositeKey = result.value.key
                const attributes = ctx.stub.splitCompositeKey(compositeKey)

                if (attributes.attributes.length >= 2) {
                    const termsId = attributes.attributes[1]

                    const termsJSON = await ctx.stub.getState(termsId)
                    if (termsJSON.length > 0) {
                        const terms = validateJSONToTransferTerms(
                            termsJSON.toString(),
                        )

                        const privateTermsCollection = getImplicitCollection(
                            terms.toMSP,
                        )
                        await ctx.stub.deletePrivateData(
                            privateTermsCollection,
                            termsId,
                        )
                    }

                    await ctx.stub.deleteState(termsId)
                    await ctx.stub.deleteState(compositeKey)
                }

                result = await iterator.next()
            }
            await iterator.close()

            const ownerCollection = getImplicitCollection(callerMSPID)
            await ctx.stub.deletePrivateData(ownerCollection, externalId)

            await ctx.stub.deleteState(externalId)

            ctx.stub.setEvent(
                "DeletePackage",
                Buffer.from(
                    stringify(
                        sortKeysRecursive({
                            id: externalId,
                            caller: callerMSPID,
                        }),
                    ),
                ),
            )
            return
        }
        throw new Error(`Not authorized to delete package ${externalId}.`)
    }
    /**
     * PackageExists returns true when a public package with the given ID exists
     * in the world state.
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier
     * @returns {Promise<boolean>}
     */
    @Transaction(false)
    @Returns("boolean")
    public async PackageExists(
        ctx: Context,
        externalId: string,
    ): Promise<boolean> {
        const data = await ctx.stub.getState(externalId)
        return data.length > 0
    }

    /**
     * ProposeTransfer creates a public transfer term and stores private transfer
     * terms (e.g. price) in the recipient's implicit collection.
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier
     * @param {string} toMSP - Recipient organization's MSP ID
     * @param {string=} expiryISO - Optional ISO expiry timestamp
     * @returns {Promise<void>}
     */
    @Transaction()
    public async ProposeTransfer(
        ctx: Context,
        externalId: string,
        termsId: string,
        toMSP: string,
        createdISO: string,
        expiryISO?: string,
    ): Promise<void> {
        const exists = await this.PackageExists(ctx, externalId)
        if (!exists) {
            throw new Error(`The package ${externalId} does not exist`)
        }

        const packageJSON = await this.ReadBlockchainPackage(ctx, externalId)
        const packageData = validateJSONToBlockchainPackage(packageJSON)

        if (packageData.ownerOrgMSP !== callerMSP(ctx)) {
            throw new Error(
                `Only the owner organization may propose a transfer for package ${externalId}`,
            )
        }

        if (
            packageData.senderOrgMSP !== callerMSP(ctx) &&
            packageData.recipientOrgMSP !== toMSP
        ) {
            throw new Error(
                "A transporter cannot propose a transfer to other organizations than the indtended recipient",
            )
        }

        if (packageData.status === Status.PROPOSED) {
            throw new Error(
                `Cannot propose transfer for package ${externalId} — it is already in PROPOSED status`,
            )
        }

        if (!isUUID(termsId)) {
            throw new Error("Invalid termsId format — must be a UUID string.")
        }

        if (!isISODateString(createdISO)) {
            throw new Error(
                "Invalid createdISO format — must be an ISO-8601 string.",
            )
        }

        const privateTermsCollection = getImplicitCollection(toMSP)
        const tmap = ctx.stub.getTransient()

        const privateTransferTermsData = tmap.get("privateTransferTerms")
        if (!privateTransferTermsData || !privateTransferTermsData.length) {
            throw new Error(
                "Missing transient field 'privateTransferTerms' for private transfer terms",
            )
        }

        const privateTransferTerms = validateJSONToPrivateTransferTerms(
            privateTransferTermsData.toString(),
        )

        const privateTermsHash = createHash("sha256")
            .update(stringify(sortKeysRecursive(privateTransferTerms)))
            .digest("hex")

        const unparsedTerms: TransferTerms = {
            externalPackageId: externalId,
            fromMSP: callerMSP(ctx),
            expiryISO: expiryISO || null,
            createdISO: createdISO,
            toMSP: toMSP,
            privateTermsHash: privateTermsHash,
        }

        const terms = validateJSONToTransferTerms(
            stringify(sortKeysRecursive(unparsedTerms)),
        )

        const compositeKey = ctx.stub.createCompositeKey(compositeKeyPrefix, [
            externalId,
            termsId,
        ])

        await ctx.stub.putPrivateData(
            privateTermsCollection,
            termsId,
            Buffer.from(stringify(sortKeysRecursive(privateTransferTerms))),
        )

        await ctx.stub.putState(
            termsId,
            Buffer.from(stringify(sortKeysRecursive(terms))),
        )

        await ctx.stub.putState(
            compositeKey,
            Buffer.from(stringify(sortKeysRecursive(terms))),
        )

        if (packageData.status !== Status.IN_TRANSIT) {
            packageData.status = Status.PROPOSED
        }

        await ctx.stub.putState(
            externalId,
            Buffer.from(stringify(sortKeysRecursive(packageData))),
        )

        await setAssetStateBasedEndorsement(
            ctx,
            externalId,
            [callerMSP(ctx), toMSP],
            false,
        )

        ctx.stub.setEvent(
            "ProposeTransfer",
            Buffer.from(
                stringify(
                    sortKeysRecursive({
                        externalId,
                        termsId,
                        parsedTerms: terms,
                        caller: callerMSP(ctx),
                    }),
                ),
            ),
        )
    }

    /**
     * CheckPackageDetailsAndPIIHash verifies that the private package blob
     * stored in the owner's implicit collection matches the expected hash.
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier
     * @param {string} expectedHash - Expected SHA256 hex hash
     * @returns {Promise<boolean>}
     */
    @Transaction(false)
    public async CheckPackageDetailsAndPIIHash(
        ctx: Context,
        externalId: string,
        expectedHash: string,
    ): Promise<boolean> {
        console.log(
            `[CheckPackageDetailsAndPIIHash] Called for package: ${externalId}`,
        )

        const blockchainPackageData = await this.ReadBlockchainPackage(
            ctx,
            externalId,
        )

        if (!blockchainPackageData) {
            throw new Error(`The package ${externalId} does not exist`)
        }

        const blockchainPackage = validateJSONToBlockchainPackage(
            blockchainPackageData,
        )

        // Read the package details and PII
        const ownerCollection = getImplicitCollection(
            blockchainPackage.ownerOrgMSP,
        )
        console.log(
            `[CheckPackageDetailsAndPIIHash] Collection name: ${ownerCollection}`,
        )
        const dataHash = Buffer.from(
            await ctx.stub.getPrivateDataHash(ownerCollection, externalId),
        ).toString("hex")

        // No need to validate, checked validation on store

        if (dataHash !== expectedHash) {
            console.log(
                `[CheckPackageDetailsAndPIIHash] Hash mismatch: expected ${expectedHash}, got ${dataHash.toString()}`,
            )
            return false
        }
        return true
    }

    /**
     * ReadTransferTerms returns the public transfer terms for a given term id.
     * @param {Context} ctx - Fabric transaction context
     * @param {string} termsId - Transfer term identifier
     * @returns {Promise<string>} JSON serialized transfer terms
     */
    @Transaction(false)
    public async ReadTransferTerms(
        ctx: Context,
        termsId: string,
    ): Promise<string> {
        const termsJSON = await ctx.stub.getState(termsId) // get the package from chaincode state
        if (termsJSON.length === 0) {
            throw new Error(`The package ${termsId} does not exist`)
        }
        return termsJSON.toString()
    }

    /**
     * ReadPrivateTransferTerms returns the private transfer terms from the
     * caller's implicit collection. Caller must be the intended recipient.
     * @param {Context} ctx - Fabric transaction context
     * @param {string} termsId - Transfer term identifier
     * @returns {Promise<string>} JSON serialized private transfer terms
     */
    @Transaction(false)
    public async ReadPrivateTransferTerms(
        ctx: Context,
        termsId: string,
    ): Promise<string> {
        const callerMSPID = callerMSP(ctx)
        console.log(
            `[ReadPrivateTransferTerms] Called by: ${callerMSPID} for proposalId: ${termsId}`,
        )

        const publicTransferTerms = await this.ReadTransferTerms(ctx, termsId) // Verify transfer terms exists

        const parsedTerms = validateJSONToTransferTerms(publicTransferTerms)

        console.log(
            `[ReadPrivateTransferTerms] Transfer to: ${parsedTerms.toMSP}, Caller: ${callerMSPID}`,
        )

        if (parsedTerms.toMSP !== callerMSPID) {
            console.log(
                `[ReadPrivateTransferTerms] ACCESS DENIED: ${callerMSPID} tried to read private terms owned by ${parsedTerms.toMSP}`,
            )
            throw new Error(
                `The caller organization (${callerMSPID}) is not authorized to read the private details of terms ${termsId} owned by ${parsedTerms.toMSP}`,
            )
        }

        console.log(
            `[ReadPrivateTransferTerms] ACCESS GRANTED: Reading from ${callerMSPID}'s implicit collection`,
        )

        // Read from the owner's implicit collection (which is also the caller's collection after the check above)
        const ownerCollection = getImplicitCollection(callerMSPID)
        console.log(
            `[ReadPrivateTransferTerms] Collection name: ${ownerCollection}`,
        )

        const privateBuf = await ctx.stub.getPrivateData(
            ownerCollection,
            termsId,
        )
        if (privateBuf.length === 0) {
            console.log(
                `[ReadPrivateTransferTerms] ERROR: No data found in collection ${ownerCollection} for key ${termsId}`,
            )
            throw new Error(
                `The private information for terms ${termsId} does not exist in ${callerMSPID}'s collection`,
            )
        }

        console.log(
            `[ReadPrivateTransferTerms] SUCCESS: Retrieved private data for ${termsId}`,
        )
        return privateBuf.toString()
    }

    /**
     * AcceptTransfer is called by the proposed recipient to accept a transfer.
     * It validates the package hash and the private terms provided in transient
     * against the stored private terms.
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier
     * @param {string} termsId - Transfer term identifier
     * @returns {Promise<void>}
     */
    @Transaction()
    public async AcceptTransfer(
        ctx: Context,
        externalId: string,
        termsId: string,
    ): Promise<void> {
        const callerMSPID = callerMSP(ctx)
        console.log(
            `[AcceptTransfer] Called by: ${callerMSPID} for proposalId: ${termsId} and externalId: ${externalId}`,
        )
        const publictransferTerms = await this.ReadTransferTerms(ctx, termsId)
        const parsedTerms = validateJSONToTransferTerms(publictransferTerms)

        if (parsedTerms.toMSP !== callerMSPID) {
            console.log(
                `[AcceptTransfer] ACCESS DENIED: ${callerMSPID} tried to accept transfer intended for ${parsedTerms.toMSP}`,
            )
            throw new Error(
                `The caller organization (${callerMSPID}) is not authorized to accept terms ${termsId} meant for ${parsedTerms.toMSP}`,
            )
        }
        if (parsedTerms.externalPackageId !== externalId) {
            console.log(
                `[AcceptTransfer] ERROR: proposalId ${termsId} is not for package ${externalId}`,
            )
            throw new Error(
                `The proposalId ${termsId} is not for package ${externalId}`,
            )
        }

        const blockchainPackage = await this.ReadBlockchainPackage(
            ctx,
            externalId,
        )
        const parsedPackage = validateJSONToBlockchainPackage(blockchainPackage)

        if (
            parsedPackage.status !== Status.PROPOSED &&
            parsedPackage.status !== Status.IN_TRANSIT
        ) {
            throw new Error(
                "[AcceptTransfer] You cannot accept a transfer for a package that has not been proposed or is being delivered",
            )
        }

        // Validate that the package externalId has correct hash as I have recieved
        if (
            !(await this.CheckPackageDetailsAndPIIHash(
                ctx,
                externalId,
                parsedPackage.packageDetailsAndPIIHash,
            ))
        ) {
            console.log(
                `[AcceptTransfer] ERROR: Hash mismatch for package ${externalId}`,
            )
            throw new Error(
                `[AcceptTransfer] Hash mismatch for package ${externalId}`,
            )
        }

        // Get the package, PII and transfer terms through the pdc
        const privateTransferTermsHash = Buffer.from(
            await ctx.stub.getPrivateDataHash(
                getImplicitCollection(parsedTerms.toMSP),
                termsId,
            ),
        ).toString("hex")

        if (privateTransferTermsHash !== parsedTerms.privateTermsHash) {
            console.log(
                `[AcceptTransfer] ERROR: Private transfer terms mismatch for proposalId ${termsId}`,
            )
            throw new Error(
                `The provided private transfer terms do not match the stored terms for proposalId ${termsId}`,
            )
        }

        if (parsedPackage.status === Status.PROPOSED) {
            parsedPackage.status = Status.READY_FOR_PICKUP
        }

        await ctx.stub.putState(
            externalId,
            Buffer.from(stringify(sortKeysRecursive(parsedPackage))),
        )

        await setAssetStateBasedEndorsement(
            ctx,
            externalId,
            [parsedTerms.fromMSP, parsedTerms.toMSP],
            false,
        )

        ctx.stub.setEvent(
            "AcceptTransfer",
            Buffer.from(
                stringify(
                    sortKeysRecursive({
                        externalId,
                        termsId,
                        caller: callerMSPID,
                    }),
                ),
            ),
        )
    }

    /**
     * ExecuteTransfer performs the ownership change. Caller must be the current owner (fromMSP).
     * It moves the package's private details and PII from the owner's implicit collection
     * to the recipient's implicit collection (if they differ), updates the public package
     * owner on the ledger, and emits a minimal TransferExecuted event.
     *
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier
     * @param {string} termsId - Transfer term identifier
     * @returns {Promise<void>}
     */
    @Transaction()
    public async ExecuteTransfer(
        ctx: Context,
        externalId: string,
        termsId: string,
    ): Promise<void> {
        // Read public transfer terms
        const termsJSON = await this.ReadTransferTerms(ctx, termsId)
        const terms = validateJSONToTransferTerms(termsJSON)

        if (terms.externalPackageId !== externalId) {
            throw new Error(
                `Transfer terms ${termsId} are not for package ${externalId}`,
            )
        }

        const caller = callerMSP(ctx)

        // Only the original proposer (fromMSP) may execute the transfer
        if (caller !== terms.fromMSP) {
            throw new Error(
                `Only the proposer (${terms.fromMSP}) may execute the transfer`,
            )
        }

        // Read public package and verify ownership
        const packageJSON = await this.ReadBlockchainPackage(ctx, externalId)
        const packageData = validateJSONToBlockchainPackage(packageJSON)

        if (packageData.ownerOrgMSP !== caller) {
            throw new Error(`Package ${externalId} is not owned by ${caller}`)
        }

        // Validate expiry if present
        if (terms.expiryISO) {
            const exp = new Date(terms.expiryISO)
            if (isNaN(exp.getTime())) {
                throw new Error(
                    `Invalid expiryISO on transfer terms: ${terms.expiryISO}`,
                )
            }
            if (exp < new Date()) {
                throw new Error(
                    `The transfer terms ${termsId} for package ${externalId} have expired`,
                )
            }
        }

        const tmap = ctx.stub.getTransient()
        const storeData = tmap.get("storeObject")
        if (!storeData || !storeData.length) {
            throw new Error("Missing transient field 'storeObject'")
        }
        const parsedStoreObject = validateJSONToStoreObject(
            storeData.toString(),
        )

        const canonicalPackageInfo = stringify(
            sortKeysRecursive(parsedStoreObject),
        )
        const packageInfoHash = createHash("sha256")
            .update(canonicalPackageInfo)
            .digest("hex")

        const recipientCollection = getImplicitCollection(terms.toMSP)
        const verified = await this.CheckPackageDetailsAndPIIHash(
            ctx,
            externalId,
            packageInfoHash,
        )

        if (!verified) {
            throw new Error(
                `The provided package details and PII do not match the stored hash for package ${externalId}`,
            )
        }

        await ctx.stub.putPrivateData(
            recipientCollection,
            externalId,
            Buffer.from(stringify(sortKeysRecursive(parsedStoreObject))),
        )
        const ownerCollection = getImplicitCollection(terms.fromMSP)
        // remove from owner's collection
        await ctx.stub.deletePrivateData(ownerCollection, externalId)

        // Update public package owner
        packageData.ownerOrgMSP = terms.toMSP

        // Transporter picks package up
        if (packageData.recipientOrgMSP !== terms.toMSP) {
            packageData.status = Status.PICKED_UP
        } else {
            // Transporter hands package to reciever
            packageData.status = Status.DELIVERED
        }

        await setAssetStateBasedEndorsement(ctx, externalId, [terms.toMSP])
        await setAssetStateBasedEndorsement(ctx, termsId, [terms.toMSP])

        await ctx.stub.putState(
            externalId,
            Buffer.from(stringify(sortKeysRecursive(packageData))),
        )

        ctx.stub.setEvent(
            "TransferExecuted",
            Buffer.from(
                stringify({
                    externalId,
                    termsId,
                    newOwner: packageData.ownerOrgMSP,
                    caller: callerMSP(ctx),
                }),
            ),
        )
    }

    /**
     * TransferToPM3 transfers ownership of a delivered package to PM3 organization.
     * The caller must be the current owner, and the package must be in DELIVERED status
     * with matching owner and recipient organizations.
     *
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier
     * @returns {Promise<void>}
     */
    @Transaction()
    public async TransferToPM3(
        ctx: Context,
        externalId: string,
    ): Promise<void> {
        const exists = await this.PackageExists(ctx, externalId)
        if (!exists) {
            throw new Error(`The package ${externalId} does not exist`)
        }

        const packageJSON = await this.ReadBlockchainPackage(ctx, externalId)
        const packageData = validateJSONToBlockchainPackage(packageJSON)

        if (packageData.ownerOrgMSP !== callerMSP(ctx)) {
            throw new Error(
                `Only the owner organization may transfer the package ${externalId} to PM3`,
            )
        }

        if (packageData.ownerOrgMSP !== packageData.recipientOrgMSP) {
            throw new Error(
                `The package ${externalId} recipientOrgMSP does not match the current ownerOrgMSP`,
            )
        }

        if (packageData.status !== Status.DELIVERED) {
            throw new Error(
                `The package ${externalId} must be in DELIVERED status to transfer to PM3`,
            )
        }

        // Update public package owner to PM3
        packageData.ownerOrgMSP = PM3_MSPID
        packageData.status = Status.SUCCEEDED

        await ctx.stub.putState(
            externalId,
            Buffer.from(stringify(sortKeysRecursive(packageData))),
        )
        ctx.stub.setEvent(
            "TransferToPM3",
            Buffer.from(stringify(sortKeysRecursive({ externalId }))),
        )
    }
}
