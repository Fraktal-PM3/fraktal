import { createHash, randomUUID } from "crypto"
import {
    Context,
    Contract,
    Info,
    Returns,
    Transaction,
} from "fabric-contract-api"
import stringify from "json-stringify-deterministic"
import sortKeysRecursive from "sort-keys-recursive"
import { BlockchainPackageSchema, PackagePII, Status, TransferTerms } from "./package"
import {
    callerMSP,
    getImplicitCollection,
    isAllowedTransition,
    requireAttr,
    validateJSONPII,
    validateJSONToBlockchainPackage,
    validateJSONToPackageDetails,
} from "./utils"

@Info({
    title: "PackageContract",
    description: "Smart contract for managing packages",
})
export class PackageContract extends Contract {
    // CreatePackage issues a new package to the world state with given details.
    @Transaction()
    public async CreatePackage(ctx: Context, externalId: string): Promise<void> {
        const callerMSPID = callerMSP(ctx)
        console.log(`[CreatePackage] Called by: ${callerMSPID} for package: ${externalId}`)

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
            throw new Error(
                "Missing transient field 'pii'",
            )
        }

        const parsedPII = validateJSONPII(piiBuf.toString())



        const packageDetails = tmap.get("packageDetails")
        if (!packageDetails) {
            throw new Error(
                "Missing transient field 'packageDetails' (must be JSON of PackageDetails)",
            )
        }

        const parsedPackageInfo = validateJSONToPackageDetails(packageDetails.toString())
        const canonicalPackageInfo = stringify(sortKeysRecursive(parsedPackageInfo))
        const packageInfoHash = createHash("sha256").update(canonicalPackageInfo).digest("hex")

        // Store private data in the owner organization's implicit collection
        const ownerCollection = getImplicitCollection(ownerOrgMSPID)
        console.log(`[CreatePackage] Writing private data to collection: ${ownerCollection}`)
        await ctx.stub.putPrivateData(
            ownerCollection,
            externalId,
            Buffer.from(stringify(sortKeysRecursive({ parsedPII, parsedPackageInfo }))),
        )
        console.log(`[CreatePackage] Successfully wrote private data to ${ownerCollection}`)


        const blockchainPackage = BlockchainPackageSchema.parse({
            externalId: externalId,
            ownerOrgMSP: ownerOrgMSPID,
            status: Status.PENDING,
            packageDetailsHash: packageInfoHash,
        })

        const stateBuffer = Buffer.from(
            stringify(sortKeysRecursive(blockchainPackage)),
        )
        const eventBuffer = Buffer.from(
            stringify(sortKeysRecursive({ id: externalId, status: Status.PENDING })),
        )

        await ctx.stub.putState(externalId, stateBuffer)
        ctx.stub.setEvent("CreatePackage", eventBuffer)
    }

    // ReadPackage returns the package stored in the world state with given id.
    @Transaction(false)
    public async ReadBlockchainPackage(ctx: Context, externalId: string): Promise<string> {
        const packageJSON = await ctx.stub.getState(externalId) // get the package from chaincode state
        if (packageJSON.length === 0) {
            throw new Error(`The package ${externalId} does not exist`)
        }
        return packageJSON.toString()
    }

    @Transaction(false)
    public async ReadPackageDetailsAndPII(ctx: Context, externalId: string): Promise<string> {
        const callerMSPID = callerMSP(ctx)
        console.log(`[ReadPackageDetailsAndPII] Called by: ${callerMSPID} for package: ${externalId}`)

        const blockchainPackageString = await this.ReadBlockchainPackage(ctx, externalId) // Verify package exists
        const blockchainPackage = validateJSONToBlockchainPackage(blockchainPackageString)

        console.log(`[ReadPackageDetailsAndPII] Package owner: ${blockchainPackage.ownerOrgMSP}, Caller: ${callerMSPID}`)

        // CRITICAL: Only the owner organization can read private data from their implicit collection
        if (blockchainPackage.ownerOrgMSP !== callerMSPID) {
            console.log(`[ReadPackageDetailsAndPII] ACCESS DENIED: ${callerMSPID} tried to read package owned by ${blockchainPackage.ownerOrgMSP}`)
            throw new Error(
                `The caller organization (${callerMSPID}) is not authorized to read the private details of package ${externalId} owned by ${blockchainPackage.ownerOrgMSP}`,
            )
        }

        console.log(`[ReadPackageDetailsAndPII] ACCESS GRANTED: Reading from ${callerMSPID}'s implicit collection`)

        // Read from the owner's implicit collection (which is also the caller's collection after the check above)
        const ownerCollection = getImplicitCollection(callerMSPID)
        console.log(`[ReadPackageDetailsAndPII] Collection name: ${ownerCollection}`)

        const privateBuf = await ctx.stub.getPrivateData(ownerCollection, externalId)
        if (privateBuf.length === 0) {
            console.log(`[ReadPackageDetailsAndPII] ERROR: No data found in collection ${ownerCollection} for key ${externalId}`)
            throw new Error(
                `The private package information for package ${externalId} does not exist in ${callerMSPID}'s collection`,
            )
        }

        console.log(`[ReadPackageDetailsAndPII] SUCCESS: Retrieved private data for ${externalId}`)
        return privateBuf.toString()
    }

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

        // Enforce valid status transitions
        if (status == Status.SUCCEEDED && !requireAttr(ctx, "role", "pm3")) {
            throw new Error(
                "The caller is not authorized to update the package status to SUCCEEDED",
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
            stringify(sortKeysRecursive({ id: externalId, status })),
        )

        await ctx.stub.putState(externalId, stateBuffer)
        ctx.stub.setEvent("StatusUpdated", eventBuffer)
    }

    // DeletePackage deletes an given package from the world state.
    @Transaction()
    public async DeletePackage(ctx: Context, externalId: string): Promise<void> {
        const packageJSON = await this.ReadBlockchainPackage(ctx, externalId)
        const packageData = validateJSONToBlockchainPackage(packageJSON)

        // Check that the caller has the role of 'ombud' if status is PENDING
        const isOmbud = requireAttr(ctx, "role", "ombud")
        const isPM3 = requireAttr(ctx, "role", "pm3")
        if ((isOmbud && packageData.status === Status.PENDING) || isPM3) {
            await ctx.stub.deleteState(externalId)
            ctx.stub.setEvent(
                "DeletePackage",
                Buffer.from(stringify(sortKeysRecursive({ id: externalId }))),
            )
            return
        }

        throw new Error("Not authorized to delete this package")
    }

    // PackageExists returns true when package with given ID exists in world state.
    @Transaction(false)
    @Returns("boolean")
    public async PackageExists(ctx: Context, externalId: string): Promise<boolean> {
        const data = await ctx.stub.getState(externalId)
        return !!data && data.length > 0
    }

    // // ProposeTransfer creates a transfer proposal for an asset to another organization.
    @Transaction()
    public async ProposeTransfer(ctx: Context, externalId: string, toMSP: string, createdISO: string, expiryISO?: string): Promise<void> {
        const exists = await this.PackageExists(ctx, externalId)
        if (!exists) {
            throw new Error(`The package ${externalId} does not exist`)
        }

        const packageJSON = await this.ReadBlockchainPackage(ctx, externalId)
        const packageData = validateJSONToBlockchainPackage(packageJSON)

        if (packageData.ownerOrgMSP !== callerMSP(ctx)) {
            throw new Error(`Only the owner organization may propose a transfer for package ${externalId}`)
        }

        const termsId = randomUUID()
        const terms: TransferTerms = {
            externalPackageId: externalId,
            fromMSP: callerMSP(ctx),
            expiryISO: expiryISO || null,
            createdISO,
            toMSP,
        }

        const toMSPCollection = getImplicitCollection(toMSP)
        const tmap = ctx.stub.getTransient()

        const privateTransferTermsData = tmap.get("privateTransferTerms")
        if (!privateTransferTermsData || !privateTransferTermsData.length) {
            throw new Error("Missing transient field 'privateTransferTerms' for private transfer terms")
        }
        
        const privateTransferTerms = JSON.parse(privateTransferTermsData.toString())
        
        // Store private data in the recipient organization's implicit collection
        await ctx.stub.putPrivateData(
            toMSPCollection,
            termsId,
            Buffer.from(stringify(sortKeysRecursive(privateTransferTerms))),
        )

        await ctx.stub.putState(termsId, Buffer.from(stringify(sortKeysRecursive(terms))))
        ctx.stub.setEvent(
            "TransferProposed",
            Buffer.from(stringify({ externalId, termsId })),
        )
    }

    // // AcceptTransfer accepts a transfer proposal for an asset from another organization.
    // @Transaction()
    // public async AcceptTransfer(
    //     ctx: Context,
    //     pkgId: string,
    //     proposalId: string,
    // ): Promise<void> {
    //     // PDC collection name must be passed via transient
    //     const pdc = ctx.stub.getTransient().get("pdcCollection")?.toString()
    //     if (!pdc) {
    //         throw new Error(
    //             "Missing transient field 'pdcCollection' for private transfer terms",
    //         )
    //     }

    //     const pKey = proposalKey(ctx, pkgId, proposalId)

    //     // Read the private transfer (PDC only)
    //     const privateBuf = await ctx.stub.getPrivateData(pdc, pKey)
    //     if (!privateBuf.length) {
    //         throw new Error(
    //             `The private transfer proposal ${proposalId} for package ${pkgId} does not exist`,
    //         )
    //     }

    //     // Parse and validate structure
    //     const transfer = JSON.parse(privateBuf.toString()) as Transfer

    //     // Sanity checks on terms core fields
    //     const terms = transfer.terms
    //     if (
    //         !terms ||
    //         terms.proposalId !== proposalId ||
    //         terms.pkgId !== pkgId
    //     ) {
    //         throw new Error(
    //             "Transfer terms are missing or inconsistent (proposalId/pkgId mismatch)",
    //         )
    //     }

    //     // Only proposed recipient may accept
    //     const caller = callerMSP(ctx)
    //     if (caller !== terms.toMSP) {
    //         throw new Error(
    //             "Only the proposed recipient may accept the transfer",
    //         )
    //     }

    //     // Expiry validation (if provided)
    //     if (terms.expiryISO) {
    //         const exp = new Date(terms.expiryISO)
    //         if (isNaN(exp.getTime())) {
    //             throw new Error(
    //                 `Invalid expiryISO on transfer terms: ${terms.expiryISO}`,
    //             )
    //         }
    //         if (exp < new Date()) {
    //             // Mark EXPIRED privately
    //             const expiredCanonical = stringify(
    //                 sortKeysRecursive({
    //                     terms,
    //                     hash: transfer.hash,
    //                     status: TransferStatus.EXPIRED,
    //                 }),
    //             )
    //             await ctx.stub.putPrivateData(
    //                 pdc,
    //                 pKey,
    //                 Buffer.from(expiredCanonical),
    //             )
    //             throw new Error(
    //                 `The transfer proposal ${proposalId} for package ${pkgId} has expired`,
    //             )
    //         }
    //     }

    //     // Recompute canonical hash of terms to verify integrity
    //     const canonicalTermsJSON = stringify(sortKeysRecursive(terms))
    //     const recomputedHash = createHash("sha256")
    //         .update(canonicalTermsJSON, "utf8")
    //         .digest("hex")
    //     if (recomputedHash !== transfer.hash) {
    //         throw new Error("Private transfer terms hash mismatch")
    //     }

    //     // Status must be PROPOSED to accept
    //     if (transfer.status !== TransferStatus.PROPOSED) {
    //         throw new Error(
    //             `Cannot accept transfer in status ${transfer.status}`,
    //         )
    //     }

    //     // Update status to ACCEPTED (privately)
    //     transfer.status = TransferStatus.ACCEPTED

    //     const updatedTransferJSON = stringify(sortKeysRecursive(transfer))
    //     await ctx.stub.putPrivateData(
    //         pdc,
    //         pKey,
    //         Buffer.from(updatedTransferJSON),
    //     )

    //     // Event (avoid leaking more than needed)
    //     ctx.stub.setEvent(
    //         "TransferAccepted",
    //         Buffer.from(stringify({ pkgId, proposalId })),
    //     )
    // }

    // // ExecuteTransfer executes a transfer for an asset from one organization to another.
    // @Transaction()
    // public async ExecuteTransfer(
    //     ctx: Context,
    //     pkgId: string,
    //     proposalId: string,
    // ): Promise<void> {
    //     // Public package read
    //     const packageJSON = await this.ReadBlockchainPackage(ctx, pkgId)
    //     const packageData = validateJSONToPublicPackage(packageJSON)

    //     // PDC collection
    //     const pdc = ctx.stub.getTransient().get("pdcCollection")?.toString()
    //     if (!pdc) {
    //         throw new Error(
    //             "Missing transient field 'pdcCollection' for private transfer terms",
    //         )
    //     }

    //     const pKey = proposalKey(ctx, pkgId, proposalId)

    //     // Read private transfer
    //     const privateBuf = await ctx.stub.getPrivateData(pdc, pKey)
    //     if (!privateBuf.length) {
    //         throw new Error(
    //             `The private transfer proposal ${proposalId} for package ${pkgId} does not exist`,
    //         )
    //     }

    //     const transfer = JSON.parse(privateBuf.toString()) as Transfer
    //     const { terms, hash } = transfer

    //     // Basic consistency checks
    //     if (
    //         !terms ||
    //         terms.proposalId !== proposalId ||
    //         terms.pkgId !== pkgId
    //     ) {
    //         throw new Error(
    //             "Transfer terms are missing or inconsistent (proposalId/pkgId mismatch)",
    //         )
    //     }

    //     // Must be ACCEPTED to execute
    //     if (transfer.status !== TransferStatus.ACCEPTED) {
    //         throw new Error(
    //             `The transfer proposal ${proposalId} for package ${pkgId} is not ACCEPTED`,
    //         )
    //     }

    //     // Ensure not expired
    //     if (terms.expiryISO) {
    //         const exp = new Date(terms.expiryISO)
    //         if (isNaN(exp.getTime())) {
    //             throw new Error(
    //                 `Invalid expiryISO on transfer terms: ${terms.expiryISO}`,
    //             )
    //         }
    //         if (exp < new Date()) {
    //             transfer.status = TransferStatus.EXPIRED
    //             const expiredJSON = stringify(sortKeysRecursive(transfer))
    //             await ctx.stub.putPrivateData(
    //                 pdc,
    //                 pKey,
    //                 Buffer.from(expiredJSON),
    //             )
    //             throw new Error(
    //                 `The transfer proposal ${proposalId} for package ${pkgId} has expired`,
    //             )
    //         }
    //     }

    //     // Recompute and verify hash again
    //     const canonicalTermsJSON = stringify(sortKeysRecursive(terms))
    //     const recomputedHash = createHash("sha256")
    //         .update(canonicalTermsJSON, "utf8")
    //         .digest("hex")
    //     if (recomputedHash !== hash) {
    //         throw new Error("Private transfer terms hash mismatch")
    //     }

    //     // Ownership checks
    //     if (packageData.ownerOrgMSP !== terms.fromMSP) {
    //         throw new Error(`Package ${pkgId} is not owned by ${terms.fromMSP}`)
    //     }
    //     if (callerMSP(ctx) !== terms.fromMSP) {
    //         throw new Error("Only the current owner may execute the transfer")
    //     }

    //     // Perform the public ownership change
    //     packageData.ownerOrgMSP = terms.toMSP
    //     await ctx.stub.putState(
    //         pkgId,
    //         Buffer.from(stringify(sortKeysRecursive(packageData))),
    //     )

    //     // Mark proposal EXECUTED in PDC
    //     transfer.status = TransferStatus.EXECUTED
    //     const executedJSON = stringify(sortKeysRecursive(transfer))
    //     await ctx.stub.putPrivateData(pdc, pKey, Buffer.from(executedJSON))

    //     // Public event that reveals only pkgId + newOwner
    //     ctx.stub.setEvent(
    //         "TransferExecuted",
    //         Buffer.from(
    //             stringify({
    //                 pkgId,
    //                 proposalId,
    //                 newOwner: packageData.ownerOrgMSP,
    //             }),
    //         ),
    //     )
    // }
}
