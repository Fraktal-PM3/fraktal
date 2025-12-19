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
     * @param {string} termsId - Unique identifier for this transfer proposal (UUID)
     * @returns {Promise<string>} JSON serialized transfer terms array or single object
     */
    @Transaction(false)
    public async ReadPrivateTransferTerms(
        ctx: Context,
        externalId: string,
        termsId: string,
    ): Promise<string> {
        // use the composite key to read the transfer terms from the caller's implicit collection
        if (externalId.trim() === "" && termsId.trim() === "") {
            throw new Error("Either externalId or termsId must be provided")
        }

        const callerMSPID = callerMSP(ctx)

        if (externalId.trim() === "") {
            return await ctx.stub
                .getPrivateDataByPartialCompositeKey(
                    getImplicitCollection(callerMSPID),
                    "proposal",
                    [termsId],
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
        } else if (termsId.trim() === "") {
            return await ctx.stub
                .getPrivateDataByPartialCompositeKey(
                    getImplicitCollection(callerMSPID),
                    "proposal",
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
            const compositeKey = ctx.stub.createCompositeKey("proposal", [
                externalId,
                termsId,
            ])
            const termsBuf = await ctx.stub.getPrivateData(
                getImplicitCollection(callerMSPID),
                compositeKey,
            )
            if (termsBuf.length === 0) {
                throw new Error(
                    `The transfer terms ${termsId} for package ${externalId} do not exist in ${callerMSPID}'s collection`,
                )
            }
            return termsBuf.toString()
        }
    }

    /**
     * ReadPublicProposal returns the proposal stored on the blockchain.
     * @param ctx - Fabric transaction context
     * @param externalId Package external identifier
     * @param termsId Unique identifier for this transfer proposal (UUID)
     * @returns {Promise<string>} JSON serialized proposal array or single object
     */
    @Transaction(false)
    public async ReadPublicProposal(
        ctx: Context,
        externalId: string,
        termsId: string,
    ): Promise<string> {
        if (externalId.trim() === "" && termsId.trim() === "") {
            throw new Error("Either externalId or termsId must be provided")
        }

        if (externalId.trim() === "") {
            return await ctx.stub
                .getStateByPartialCompositeKey("proposal", [termsId])
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
        } else if (termsId.trim() === "") {
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
                termsId,
            ])
            const termsBuf = await ctx.stub.getState(compositeKey)
            if (termsBuf.length === 0) {
                throw new Error(
                    `The transfer terms ${termsId} for package ${externalId} do not exist on the ledger`,
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
     * Does NOT update the ledger.
     * Client should call UpdateStatusAfterPropose separately to update package status.
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier
     * @param {string} termsId - Unique identifier for this transfer proposal (UUID)
     * @returns {Promise<void>}
     */
    @Transaction()
    public async ProposeTransfer(
        ctx: Context,
        externalId: string,
        termsId: string,
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

        if (!isUUID(termsId)) {
            throw new Error("Invalid termsId format — must be a UUID string.")
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

        const proposalKey = ctx.stub.createCompositeKey("proposal", [
            externalId,
            termsId,
        ])
        const proposalData: Proposal = {
            externalId,
            termsId,
            toMSP: transferTerms.toMSP,
            status: "active",
            expiryISO: transferTerms.expiryISO,
            termsHash: createHash("sha256")
                .update(stringify(sortKeysRecursive(transferTerms)))
                .digest("hex")
                .toString(),
        }

        await ctx.stub.putState(
            proposalKey,
            Buffer.from(stringify(sortKeysRecursive(proposalData))),
        )

        // Store transfer terms in the toMSP's PDC with composite key
        await ctx.stub.putPrivateData(
            getImplicitCollection(transferTerms.toMSP),
            proposalKey,
            Buffer.from(stringify(sortKeysRecursive(transferTerms))),
        )

        ctx.stub.setEvent(
            "ProposeTransfer",
            Buffer.from(
                stringify(
                    sortKeysRecursive({
                        externalId,
                        termsId,
                        toMSP: transferTerms.toMSP,
                        caller: callerMSP(ctx),
                    }),
                ),
            ),
        )
    }

    /**
     * CheckPackageDetailsAndPIIHash verifies that the private package blob
     * hash on the chain matches the expected hash.
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

        if (blockchainPackage.packageDetailsAndPIIHash !== expectedHash) {
            console.log(
                `[CheckPackageDetailsAndPIIHash] Hash mismatch: expected ${expectedHash}, got ${blockchainPackage.packageDetailsAndPIIHash}`,
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
     * @param {string} termsId - Transfer proposal identifier (UUID)
     * @returns {Promise<void>}
     */
    @Transaction()
    public async AcceptTransfer(
        ctx: Context,
        externalId: string,
        termsId: string,
    ): Promise<void> {
        const callerMSPID = callerMSP(ctx)

        if (!isUUID(termsId)) {
            throw new Error("Invalid termsId format — must be a UUID string.")
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
            throw new Error(
                `The caller organization (${callerMSPID}) is not authorized to accept proposal ${termsId} meant for ${transferTerms.toMSP}`,
            )
        }

        // Validate that externalPackageId in terms matches the parameter
        if (transferTerms.externalPackageId !== externalId) {
            throw new Error(
                `The termsId ${termsId} is not for package ${externalId}`,
            )
        }

        const proposalKey = ctx.stub.createCompositeKey("proposal", [
            externalId,
            termsId,
        ])

        // Retrieve proposal from blockchain to validate acceptor
        const proposalBuffer = await ctx.stub.getState(proposalKey)
        if (proposalBuffer.length === 0) {
            throw new Error(
                `The proposal for termsId ${termsId} and package ${externalId} does not exist on the ledger`,
            )
        }

        const proposalData = validateJSONToProposal(proposalBuffer.toString())
        if (proposalData.toMSP !== callerMSPID) {
            throw new Error(
                `The caller organization (${callerMSPID}) is not authorized to accept proposal ${termsId} meant for ${proposalData.toMSP}`,
            )
        }

        const inputHash = createHash("sha256")
            .update(stringify(sortKeysRecursive(transferTerms)))
            .digest("hex")
            .toString()
        // Validate that the terms match
        if (!proposalData.termsHash || proposalData.termsHash !== inputHash) {
            throw new Error(
                `The transfer terms provided do not match the original proposal for termsId ${termsId} and package ${externalId}`,
            )
        }

        const updatedProposalData: Proposal = {
            externalId,
            termsId,
            toMSP: transferTerms.toMSP,
            status: "accepted",
            expiryISO: proposalData.expiryISO,
            termsHash: proposalData.termsHash,
        }

        await ctx.stub.putState(
            proposalKey,
            Buffer.from(stringify(sortKeysRecursive(updatedProposalData))),
        )

        ctx.stub.setEvent(
            "AcceptTransfer",
            Buffer.from(
                stringify(
                    sortKeysRecursive({
                        externalId,
                        termsId,
                        caller: callerMSP(ctx),
                    }),
                ),
            ),
        )
    }

    /**
     * UpdateStatusAfterPropose updates the package status to PROPOSED.
     * Stores a composite key mapping on the blockchain for proposal lookup.
     * This is a simple status update transaction with no validation.
     * Should be called after ProposeTransfer completes.
     * @param {Context} ctx - Fabric transaction context
     * @param {string} externalId - External package identifier
     * @param {string} termsId - Transfer proposal identifier (UUID)
     * @returns {Promise<void>}
     */
    @Transaction()
    public async UpdateStatusAfterPropose(
        ctx: Context,
        externalId: string,
        termsId: string,
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

        ctx.stub.setEvent(
            "StatusUpdatedAfterPropose",
            Buffer.from(
                stringify(
                    sortKeysRecursive({
                        externalId,
                        termsId,
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
     * @param {string} termsId - Transfer proposal identifier (UUID)
     * @returns {Promise<void>}
     */
    @Transaction()
    public async UpdateStatusAfterAccept(
        ctx: Context,
        externalId: string,
        termsId: string,
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

        // Retrieve proposal from blockchain to validate acceptor
        const proposalIterator = await ctx.stub.getStateByPartialCompositeKey(
            "proposal",
            [externalId, termsId],
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

        await ctx.stub.putState(
            externalId,
            Buffer.from(stringify(sortKeysRecursive(packageData))),
        )

        ctx.stub.setEvent(
            "StatusUpdatedAfterAccept",
            Buffer.from(
                stringify(
                    sortKeysRecursive({
                        externalId,
                        termsId,
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
     * @param {string} termsId - Transfer proposal identifier (UUID)
     * @returns {Promise<void>}
     */
    @Transaction()
    public async ExecuteTransfer(
        ctx: Context,
        externalId: string,
        termsId: string,
        toMSP: string,
    ): Promise<void> {
        const caller = callerMSP(ctx)

        // Read public package and verify ownership
        const packageJSON = await this.ReadBlockchainPackage(ctx, externalId)
        const packageData = validateJSONToBlockchainPackage(packageJSON)
        const tmap = ctx.stub.getTransient()

        if (packageData.ownerOrgMSP !== caller) {
            throw new Error(`Package ${externalId} is not owned by ${caller}`)
        }

        const proposalKey = ctx.stub.createCompositeKey("proposal", [
            externalId,
            termsId,
        ])

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
            .toString()

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

        // Transfer private package data to toMSP's implicit collection
        const recipientCollection = getImplicitCollection(toMSP)
        await ctx.stub.putPrivateData(
            recipientCollection,
            externalId,
            Buffer.from(stringify(sortKeysRecursive(parsedStoreObject))),
        )

        // remove proposal from acceptor's collection
        await ctx.stub.deletePrivateData(
            getImplicitCollection(toMSP),
            proposalKey,
        )

        // Update public package owner
        packageData.ownerOrgMSP = toMSP

        if (packageData.recipientOrgMSP !== toMSP) {
            // Transporter picks package up
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
