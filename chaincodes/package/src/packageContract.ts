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
import { BlockchainPackageSchema, Proposal, Status } from "./package"
import {
    callerMSP,
    getImplicitCollection,
    isAllowedTransition,
    isISODateString,
    isUUID,
    validateJSONToBlockchainPackage,
    validateJSONToPackageDetails,
    validateJSONToPII,
    validateJSONToProposal,
    validateJSONToStoreObject,
    validateJSONToTransferTerms,
} from "./utils"

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
     * ReadPrivateTransferTerms returns the transfer terms stored in the caller's implicit collection.
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier
     * @param {string} termsID - Unique identifier for this transfer proposal (UUID)
     * @returns {Promise<string>} JSON serialized transfer terms array or single object
     */
    @Transaction(false)
    public async ReadPrivateTransferTerms(
        ctx: Context,
        externalId: string,
        termsID: string,
    ): Promise<string> {
        // use the composite key to read the transfer terms from the caller's implicit collection
        if (externalId.trim() === "" && termsID.trim() === "") {
            throw new Error("Either externalId or termsID must be provided")
        }

        const callerMSPID = callerMSP(ctx)

        if (externalId.trim() === "") {
            return await ctx.stub
                .getPrivateDataByPartialCompositeKey(
                    getImplicitCollection(callerMSPID),
                    "terms",
                    [termsID],
                )
                .then(async (iterator) => {
                    const results = []
                    let result = await iterator.next()
                    while (!result.done) {
                        if (result.value.value.length > 0) {
                            results.push(result.value.value.toString())
                        }
                        result = await iterator.next()
                    }
                    return JSON.stringify(results)
                })
        } else if (termsID.trim() === "") {
            return await ctx.stub
                .getPrivateDataByPartialCompositeKey(
                    getImplicitCollection(callerMSPID),
                    "terms",
                    [externalId],
                )
                .then(async (iterator) => {
                    const results = []
                    let result = await iterator.next()
                    while (!result.done) {
                        if (result.value.value.length > 0) {
                            results.push(result.value.value.toString())
                        }
                        result = await iterator.next()
                    }
                    return JSON.stringify(results)
                })
        } else {
            const compositeKey = ctx.stub.createCompositeKey("terms", [
                externalId,
                termsID,
            ])
            const termsBuf = await ctx.stub.getPrivateData(
                getImplicitCollection(callerMSPID),
                compositeKey,
            )
            if (termsBuf.length === 0) {
                throw new Error(
                    `The transfer terms ${termsID} for package ${externalId} do not exist in ${callerMSPID}'s collection`,
                )
            }
            return termsBuf.toString()
        }
    }

    /**
     * ReadPublicProposal returns the proposal stored on the blockchain.
     * @param ctx - Fabric transaction context
     * @param externalId Package external identifier
     * @param termsID Unique identifier for this transfer proposal (UUID)
     * @returns {Promise<string>} JSON serialized proposal array or single object
     */
    @Transaction(false)
    public async ReadPublicProposal(
        ctx: Context,
        externalId: string,
        termsID: string,
    ): Promise<string> {
        if (externalId.trim() === "" && termsID.trim() === "") {
            throw new Error("Either externalId or termsID must be provided")
        }

        if (externalId.trim() === "") {
            return await ctx.stub
                .getStateByPartialCompositeKey("proposal", [termsID])
                .then(async (iterator) => {
                    const results = []
                    let result = await iterator.next()
                    while (!result.done) {
                        if (result.value.value.length > 0) {
                            results.push(result.value.value.toString())
                        }
                        result = await iterator.next()
                    }
                    return JSON.stringify(results)
                })
        } else if (termsID.trim() === "") {
            return await ctx.stub
                .getStateByPartialCompositeKey("proposal", [externalId])
                .then(async (iterator) => {
                    const results = []
                    let result = await iterator.next()
                    while (!result.done) {
                        if (result.value.value.length > 0) {
                            results.push(result.value.value.toString())
                        }
                        result = await iterator.next()
                    }
                    return JSON.stringify(results)
                })
        } else {
            const compositeKey = ctx.stub.createCompositeKey("proposal", [
                externalId,
                termsID,
            ])
            const termsBuf = await ctx.stub.getState(compositeKey)
            if (termsBuf.length === 0) {
                throw new Error(
                    `The transfer terms ${termsID} for package ${externalId} do not exist on the ledger`,
                )
            }
            return termsBuf.toString()
        }
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
     * - Owner can delete if status is PENDING, PROPOSED, or READY_FOR_PICKUP
     * - Does not delete proposal data from PDCs (proposals become orphaned)
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
            // Delete package private data from owner's collection
            const ownerCollection = getImplicitCollection(callerMSPID)
            await ctx.stub.deletePrivateData(ownerCollection, externalId)

            // Delete package from ledger
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
     * ProposeTransfer stores transfer terms in the proposer's implicit collection.
     * Terms are provided via transient map and stored with a composite key.
     * Does NOT update the ledger or require endorsement.
     * Client should call UpdateStatusAfterPropose separately to update package status.
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier
     * @param {string} termsID - Unique identifier for this transfer proposal (UUID)
     * @returns {Promise<void>}
     */
    @Transaction()
    public async ProposeTransfer(
        ctx: Context,
        externalId: string,
        termsID: string,
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

        if (!isUUID(termsID)) {
            throw new Error("Invalid termsID format — must be a UUID string.")
        }

        const tmap = ctx.stub.getTransient()

        const transferTermsData = tmap.get("transferTerms")
        if (!transferTermsData || !transferTermsData.length) {
            throw new Error(
                "Missing transient field 'transferTerms' for transfer terms",
            )
        }

        const transferTerms = validateJSONToTransferTerms(
            transferTermsData.toString(),
        )

        // Validate that externalPackageId in terms matches the parameter
        if (transferTerms.externalPackageId !== externalId) {
            throw new Error(
                `externalPackageId in transfer terms (${transferTerms.externalPackageId}) does not match parameter (${externalId})`,
            )
        }

        // Validate that fromMSP matches caller
        if (transferTerms.fromMSP !== callerMSP(ctx)) {
            throw new Error(
                `fromMSP in transfer terms (${transferTerms.fromMSP}) does not match caller (${callerMSP(ctx)})`,
            )
        }

        // Validate transporter constraint
        if (
            packageData.senderOrgMSP !== callerMSP(ctx) &&
            packageData.recipientOrgMSP !== transferTerms.toMSP
        ) {
            throw new Error(
                "A transporter cannot propose a transfer to other organizations than the intended recipient",
            )
        }

        const compositeKey = ctx.stub.createCompositeKey("terms", [
            externalId,
            termsID,
        ])

        await ctx.stub.putPrivateData(
            getImplicitCollection(callerMSP(ctx)),
            compositeKey,
            Buffer.from(stringify(sortKeysRecursive(transferTerms))),
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
     * AcceptTransfer is called by the proposed recipient to accept a transfer.
     * Terms are provided via transient map and stored with a composite key in acceptor's PDC.
     * Does NOT update the ledger or require endorsement.
     * Client should call UpdateStatusAfterAccept separately to update package status.
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier
     * @param {string} termsID - Transfer proposal identifier (UUID)
     * @returns {Promise<void>}
     */
    @Transaction()
    public async AcceptTransfer(
        ctx: Context,
        externalId: string,
        termsID: string,
    ): Promise<void> {
        const callerMSPID = callerMSP(ctx)
        console.log(
            `[AcceptTransfer] Called by: ${callerMSPID} for termsID: ${termsID} and externalId: ${externalId}`,
        )

        if (!isUUID(termsID)) {
            throw new Error("Invalid termsID format — must be a UUID string.")
        }

        const tmap = ctx.stub.getTransient()

        const transferTermsData = tmap.get("transferTerms")
        if (!transferTermsData || !transferTermsData.length) {
            throw new Error(
                "Missing transient field 'transferTerms' for transfer terms",
            )
        }

        const transferTerms = validateJSONToTransferTerms(
            transferTermsData.toString(),
        )

        // Validate that the acceptor is the intended recipient
        if (transferTerms.toMSP !== callerMSPID) {
            console.log(
                `[AcceptTransfer] ACCESS DENIED: ${callerMSPID} tried to accept transfer intended for ${transferTerms.toMSP}`,
            )
            throw new Error(
                `The caller organization (${callerMSPID}) is not authorized to accept proposal ${termsID} meant for ${transferTerms.toMSP}`,
            )
        }

        // Validate that externalPackageId in terms matches the parameter
        if (transferTerms.externalPackageId !== externalId) {
            console.log(
                `[AcceptTransfer] ERROR: termsID ${termsID} is not for package ${externalId}`,
            )
            throw new Error(
                `The termsID ${termsID} is not for package ${externalId}`,
            )
        }

        // Create composite key for storing accepted terms
        const compositeKey = ctx.stub.createCompositeKey("terms", [
            externalId,
            termsID,
        ])

        // Store transfer terms in acceptor's PDC with composite key
        await ctx.stub.putPrivateData(
            getImplicitCollection(callerMSPID),
            compositeKey,
            Buffer.from(stringify(sortKeysRecursive(transferTerms))),
        )
    }

    /**
     * UpdateStatusAfterPropose updates the package status to PROPOSED.
     * Stores a composite key mapping on the blockchain for proposal lookup.
     * This is a simple status update transaction with no validation.
     * Should be called after ProposeTransfer completes.
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier
     * @param {string} termsID - Transfer proposal identifier (UUID)
     * @returns {Promise<void>}
     */
    @Transaction()
    public async UpdateStatusAfterPropose(
        ctx: Context,
        externalId: string,
        termsID: string,
        toMSP: string,
        expiryISO: string,
    ): Promise<void> {
        const packageJSON = await this.ReadBlockchainPackage(ctx, externalId)
        const packageData = validateJSONToBlockchainPackage(packageJSON)

        if (packageData.ownerOrgMSP !== callerMSP(ctx)) {
            throw new Error(
                `Only the owner organization may update the status for package ${externalId} after proposing a transfer`,
            )
        }

        if (!isISODateString(expiryISO)) {
            throw new Error(
                `Invalid expiryISO format — must be an ISO 8601 date string.`,
            )
        }

        if (packageData.status !== Status.IN_TRANSIT) {
            packageData.status = Status.PROPOSED
        }

        await ctx.stub.putState(
            externalId,
            Buffer.from(stringify(sortKeysRecursive(packageData))),
        )

        // Store composite key mapping on blockchain for proposal lookup
        const proposalKey = ctx.stub.createCompositeKey("proposal", [
            externalId,
            termsID,
        ])

        const proposalData: Proposal = {
            externalId,
            termsID,
            toMSP: toMSP,
            status: "active",
            expiryISO: expiryISO,
        }

        await ctx.stub.putState(
            proposalKey,
            Buffer.from(stringify(sortKeysRecursive(proposalData))),
        )

        ctx.stub.setEvent(
            "StatusUpdatedAfterPropose",
            Buffer.from(
                stringify(
                    sortKeysRecursive({
                        externalId,
                        termsID,
                        toMSP,
                        expiryISO,
                        status: packageData.status,
                        caller: callerMSP(ctx),
                    }),
                ),
            ),
        )
    }

    /**
     * UpdateStatusAfterAccept updates the package status to READY_FOR_PICKUP.
     * Updates the proposal status on the blockchain.
     * This is a simple status update transaction with no validation.
     * Should be called after AcceptTransfer completes.
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier
     * @param {string} termsID - Transfer proposal identifier (UUID)
     * @returns {Promise<void>}
     */
    @Transaction()
    public async UpdateStatusAfterAccept(
        ctx: Context,
        externalId: string,
        termsID: string,
    ): Promise<void> {
        const packageJSON = await this.ReadBlockchainPackage(ctx, externalId)
        const packageData = validateJSONToBlockchainPackage(packageJSON)

        if (packageData.ownerOrgMSP === callerMSP(ctx)) {
            throw new Error(
                `The owner organization cannot update the status for package ${externalId} after acceptance`,
            )
        }

        if (packageData.status === Status.PROPOSED) {
            packageData.status = Status.READY_FOR_PICKUP
        }

        await ctx.stub.putState(
            externalId,
            Buffer.from(stringify(sortKeysRecursive(packageData))),
        )

        // Retrieve proposal from blockchain to validate acceptor
        const proposalIterator = await ctx.stub.getStateByPartialCompositeKey(
            "proposal",
            [externalId, termsID],
        )

        const proposalResult = await proposalIterator.next()

        const proposalData = validateJSONToProposal(
            proposalResult.value.value.toString(),
        )

        if (proposalData.toMSP !== callerMSP(ctx)) {
            throw new Error(
                `The caller organization is not authorized to update the status for package ${externalId} after acceptance`,
            )
        }

        // Update proposal status to accepted
        const proposalKey = ctx.stub.createCompositeKey("proposal", [
            externalId,
            termsID,
        ])

        const updatedProposalData: Proposal = {
            externalId,
            termsID,
            toMSP: proposalData.toMSP,
            status: "accepted",
        }

        await ctx.stub.putState(
            proposalKey,
            Buffer.from(stringify(sortKeysRecursive(updatedProposalData))),
        )

        ctx.stub.setEvent(
            "StatusUpdatedAfterAccept",
            Buffer.from(
                stringify(
                    sortKeysRecursive({
                        externalId,
                        termsID,
                        status: packageData.status,
                        caller: callerMSP(ctx),
                    }),
                ),
            ),
        )
    }

    /**
     * ExecuteTransfer performs the ownership change. Caller must be the current owner (fromMSP).
     * Validates that both proposer and acceptor have matching transfer terms in their PDCs.
     * Moves the package's private details and PII from the owner's implicit collection
     * to the recipient's implicit collection, updates the public package owner on the ledger,
     * and emits a TransferExecuted event.
     *
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier
     * @param {string} termsID - Transfer proposal identifier (UUID)
     * @returns {Promise<void>}
     */
    @Transaction()
    public async ExecuteTransfer(
        ctx: Context,
        externalId: string,
        termsID: string,
    ): Promise<void> {
        const caller = callerMSP(ctx)

        // Read public package and verify ownership
        const packageJSON = await this.ReadBlockchainPackage(ctx, externalId)
        const packageData = validateJSONToBlockchainPackage(packageJSON)

        if (packageData.ownerOrgMSP !== caller) {
            throw new Error(`Package ${externalId} is not owned by ${caller}`)
        }

        // Create composite keys for reading transfer terms from PDCs
        const proposalKey = ctx.stub.createCompositeKey("terms", [
            externalId,
            termsID,
        ])

        const acceptanceKey = ctx.stub.createCompositeKey("terms", [
            externalId,
            termsID,
        ])

        // Read transfer terms from proposer's PDC
        const proposerTermsBuffer = await ctx.stub.getPrivateData(
            getImplicitCollection(caller),
            proposalKey,
        )

        if (proposerTermsBuffer.length === 0) {
            throw new Error(
                `Proposal ${termsID} not found in proposer's collection`,
            )
        }

        const proposerTerms = validateJSONToTransferTerms(
            proposerTermsBuffer.toString(),
        )

        // Verify that the proposer is the caller
        if (proposerTerms.fromMSP !== caller) {
            throw new Error(
                `Only the proposer (${proposerTerms.fromMSP}) may execute the transfer`,
            )
        }

        // Hash both terms and verify they match
        const proposerTermsHash = await ctx.stub.getPrivateDataHash(
            getImplicitCollection(caller),
            proposalKey,
        )

        const acceptorTermsHash = await ctx.stub.getPrivateDataHash(
            getImplicitCollection(proposerTerms.toMSP),
            acceptanceKey,
        )

        if (proposerTermsHash !== acceptorTermsHash) {
            throw new Error(
                `Transfer terms mismatch: proposer and acceptor have different terms for proposal ${termsID}`,
            )
        }

        // Use the matched terms for execution
        const terms = proposerTerms

        if (terms.externalPackageId !== externalId) {
            throw new Error(
                `Transfer terms ${termsID} are not for package ${externalId}`,
            )
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
                    `The transfer terms ${termsID} for package ${externalId} have expired`,
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

        await ctx.stub.putState(
            externalId,
            Buffer.from(stringify(sortKeysRecursive(packageData))),
        )

        ctx.stub.setEvent(
            "TransferExecuted",
            Buffer.from(
                stringify({
                    externalId,
                    termsID,
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
