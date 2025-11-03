import crypto, { createHash, randomUUID } from "crypto"
import {
    Context,
    Contract,
    Info,
    Returns,
    Transaction,
} from "fabric-contract-api"
import stringify from "json-stringify-deterministic"
import sortKeysRecursive from "sort-keys-recursive"
import {
    BlockchainPackageSchema,
    PackageDetails,
    PackagePII,
    Status,
    TransferTerms
} from "./package"
import {
    callerMSP,
    getImplicitCollection,
    isAllowedTransition,
    requireAttr,
    validateJSONToBlockchainPackage,
    validateJSONToPackageDetails,
    validateJSONToPII,
    validateJSONToPrivateTransferTerms,
    validateJSONToTransferTerms,
} from "./utils"

@Info({
    title: "PackageContract",
    description: "Smart contract for managing packages",
})
export class PackageContract extends Contract {
    // CreatePackage issues a new package to the world state with given details.
    @Transaction()
    public async CreatePackage(
        ctx: Context,
        externalId: string,
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
            throw new Error(
                "Missing transient field 'pii'",
            )
        }

        const parsedPII = validateJSONToPII(piiBuf.toString())

        const packageDetails = tmap.get("packageDetails")
        if (!packageDetails) {
            throw new Error(
                "Missing transient field 'packageDetails' (must be JSON of PackageDetails)",
            )
        }

        const salt = crypto.randomBytes(32).toString("hex")

        const parsedPackageInfo = validateJSONToPackageDetails(
            packageDetails.toString(),
        )
        const storeObject = {
            salt,
            packageDetails: parsedPackageInfo,
            pii: parsedPII,
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
            packageDetailsHash: packageInfoHash,
        })

        const stateBuffer = Buffer.from(
            stringify(sortKeysRecursive(blockchainPackage)),
        )
        const eventBuffer = Buffer.from(
            stringify(
                sortKeysRecursive({ id: externalId, status: Status.PENDING }),
            ),
        )

        await ctx.stub.putState(externalId, stateBuffer)
        ctx.stub.setEvent("CreatePackage", eventBuffer)
    }

    // ReadPackage returns the package stored in the world state with given id.
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
    public async DeletePackage(
        ctx: Context,
        externalId: string,
    ): Promise<void> {
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
    public async PackageExists(
        ctx: Context,
        externalId: string,
    ): Promise<boolean> {
        const data = await ctx.stub.getState(externalId)
        return data.length > 0
    }

    // // ProposeTransfer creates a transfer proposal for an asset to another organization.
    @Transaction()
    public async ProposeTransfer(ctx: Context, externalId: string, toMSP: string, expiryISO?: string): Promise<void> {
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
            createdISO: new Date().toISOString(),
            toMSP,
        }

        const toMSPCollection = getImplicitCollection(toMSP)
        const tmap = ctx.stub.getTransient()

        const privateTransferTermsData = tmap.get("privateTransferTerms")
        if (!privateTransferTermsData || !privateTransferTermsData.length) {
            throw new Error("Missing transient field 'privateTransferTerms' for private transfer terms")
        }

        const privateTransferTerms = validateJSONToPrivateTransferTerms(privateTransferTermsData.toString())

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

    @Transaction(false)
    public async CheckPackageDetailsAndPIIHash(
        ctx: Context,
        externalId: string,
        expectedHash: string,
    ): Promise<boolean> {
        console.log(
            `[CheckPacageDetailsAndPIIHash] Called for package: ${externalId}`,
        )

        const blockchainPackageData = await this.ReadBlockchainPackage(ctx, externalId)

        if (!blockchainPackageData) {
            throw new Error(`The package ${externalId} does not exist`)
        }

        const blockchainPackage = validateJSONToBlockchainPackage(blockchainPackageData)

        // Read the package details and PII
        const ownerCollection = getImplicitCollection(blockchainPackage.ownerOrgMSP)
        console.log(
            `[CheckPackageDetailsAndPIIHash] Collection name: ${ownerCollection}`,
        )
        const packageDetailsAndPII = await ctx.stub.getPrivateData(
            ownerCollection,
            externalId,
        )

        // No need to validate, checked validation on store
        const parsedData = JSON.parse(packageDetailsAndPII.toString()) as {
            salt: string
            packageDetails: PackageDetails
            pii: PackagePII
        }

        const canonicalPackageInfo = stringify(sortKeysRecursive(parsedData))
        const dataHash = createHash("sha256")
            .update(canonicalPackageInfo)
            .digest("hex")

        if (dataHash !== expectedHash) {
            console.log(
                `[CheckPacageDetailsAndPIIHash] Hash mismatch: expected ${expectedHash}, got ${dataHash}`,
            )
            return false
        }
        return true
    }

    @Transaction(false)
    public async ReadTransferTerms(
        ctx: Context,
        termsId: string,
    ): Promise<string> {
        const termsJSON = await ctx.stub.getState(termsId) // get the package from chaincode state
        if (!termsJSON || termsJSON.length === 0) {
            throw new Error(`The package ${termsId} does not exist`)
        }
        return termsJSON.toString()
    }

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
            `[ReadPrivateTransferTerms] Tranfer to: ${parsedTerms.toMSP}, Caller: ${callerMSPID}`,
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

    @Transaction()
    public async AcceptTransfer(
        ctx: Context,
        externalId: string,
        termsId: string,
        packageDetailsAndPIIHash: string,
    ): Promise<void> {
        const callerMSPID = callerMSP(ctx)
        console.log(
            `[AcceptTransfer] Called by: ${callerMSPID} for proposalId: ${termsId} and externalId: ${externalId}`,
        )
        const publictransferTerms = await this.ReadTransferTerms(ctx, termsId)
        const parsedTerms = validateJSONToTransferTerms(publictransferTerms)

        if (parsedTerms.toMSP !== callerMSPID) {
            console.log(
                `[AcceptTransfer] ACCESS DENIED: ${callerMSPID} tried to accept transfer itended for ${parsedTerms.toMSP}`,
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

        // Validate that the package externalId has correct hash as I have recieved
        if (
            !(await this.CheckPackageDetailsAndPIIHash(
                ctx,
                externalId,
                packageDetailsAndPIIHash,
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
        const privateTransferTerms = await this.ReadPrivateTransferTerms(
            ctx,
            termsId,
        )
        const parsedPrivateTerms = validateJSONToPrivateTransferTerms(
            privateTransferTerms,
        )
        const tmap = ctx.stub.getTransient()
        const transferTermsData = tmap.get("privateTransferTerms")

        if (!transferTermsData || !transferTermsData.length) {
            throw new Error(`Missing transient field 'privateTransferTerms'`)
        }

        const parsedInputPrivateTerms = validateJSONToPrivateTransferTerms(
            transferTermsData.toString(),
        )

        if (parsedPrivateTerms.price !== parsedInputPrivateTerms.price) {
            console.log(
                `[AcceptTransfer] ERROR: Private transfer terms mismatch for proposalId ${termsId}`,
            )
            throw new Error(
                `The provided private transfer terms do not match the stored terms for proposalId ${termsId}`,
            )
        }

        ctx.stub.setEvent(
            "AcceptTransfer",
            Buffer.from(stringify(sortKeysRecursive({ externalId, termsId }))),
        )
    }
}
