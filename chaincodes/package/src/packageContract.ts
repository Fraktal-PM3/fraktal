import { callerMSP, isAllowedTransition, proposalKey, requireAttr, validateJSONToPrivatePackage, validateJSONToPublicPackage} from "./utils"
import { Context, Contract, Info, Returns, Transaction } from "fabric-contract-api"
import { PublicPackage, Status, TransferStatus, Transfer } from "./package"
import stringify from "json-stringify-deterministic"
import sortKeysRecursive from "sort-keys-recursive"
import { createHash } from "crypto"

@Info({
    title: "PackageContract",
    description: "Smart contract for managing packages",
})
export class PackageContract extends Contract {
    // CreatePackage issues a new package to the world state with given details.
    @Transaction()
    public async CreatePackage(ctx: Context, packageID: string): Promise<void> {
        if (!packageID || packageID.trim() === "") {
            throw new Error("packageData.id must be a non-empty string")
        }

        const exists = await this.PackageExists(ctx, packageID)
        if (exists) {
            throw new Error(`The package ${packageID} already exists`)
        }

        const ownerOrgMSPID = callerMSP(ctx)

        // Check that the caller has the role of 'ombud'
        const isOmbud = requireAttr(ctx, "role", "ombud")
        if (!isOmbud) {
            throw new Error("The caller is not authorized to issue packages")
        }

        // Read the private details of the package from transient data
        const tmap = ctx.stub.getTransient()
        const piiBuf = tmap.get("pii")
        if (!piiBuf) {
            throw new Error(
                "Missing transient field 'pii' (must be JSON of PrivatePackage)",
            )
        }

        // Validate the private data
        const parsedPII = validateJSONToPrivatePackage(piiBuf.toString())
        const canonicalPII = stringify(sortKeysRecursive(parsedPII))
        const dataHash = createHash("sha256").update(canonicalPII).digest("hex")

        const newPackage: PublicPackage = {
            id: packageID,
            status: Status.PENDING,
            ownerOrgMSP: ownerOrgMSPID,
            dataHash,
        }

        const stateBuffer = Buffer.from(stringify(sortKeysRecursive(newPackage)))
        await ctx.stub.putState(packageID, stateBuffer)
        ctx.stub.setEvent("CreatePackage", stateBuffer)
    }

    // ReadPackage returns the package stored in the world state with given id.
    @Transaction(false)
    public async ReadPackage(ctx: Context, id: string): Promise<string> {
        const packageJSON = await ctx.stub.getState(id) // get the package from chaincode state
        if (packageJSON.length === 0) {
            throw new Error(`The package ${id} does not exist`)
        }
        return packageJSON.toString()
    }

    @Transaction()
    public async UpdatePackageStatus(ctx: Context, id: string, status: Status): Promise<void> {
        const packageJSON = await this.ReadPackage(ctx, id)
        const packageData = validateJSONToPublicPackage(packageJSON)

        const callerMSPID = callerMSP(ctx)
        const isOwner = packageData.ownerOrgMSP === callerMSPID

        // Enforce that only the owner organization can update the package status
        if (!isOwner) {
            throw new Error(`The caller is not authorized to update the package ${id} status`)
        }

        // Enforce valid status transitions
        if (status == Status.SUCCEEDED && !requireAttr(ctx, "role", "pm3")) {
            throw new Error("The caller is not authorized to update the package status to SUCCEEDED")
        }
        if (!isAllowedTransition(packageData.status, status)) {
            throw new Error(`The status transition from ${packageData.status} to ${status} is not allowed`)
        }

        // Set the new status
        packageData.status = status

        const stateBuffer = Buffer.from(stringify(sortKeysRecursive(packageData)))
        const eventBuffer = Buffer.from(stringify(sortKeysRecursive({ id, status })))

        await ctx.stub.putState(id, stateBuffer)
        ctx.stub.setEvent("StatusUpdated", eventBuffer)
    }

    // DeletePackage deletes an given package from the world state.
    @Transaction()
    public async DeletePackage(ctx: Context, id: string): Promise<void> {
        const packageJSON = await this.ReadPackage(ctx, id)
        const packageData = validateJSONToPublicPackage(packageJSON)

        // Check that the caller has the role of 'ombud' if status is PENDING
        const isOmbud = requireAttr(ctx, "role", "ombud")
        const isPM3 = requireAttr(ctx, "role", "pm3")
        if ((isOmbud && packageData.status === Status.PENDING) || isPM3) {
            await ctx.stub.deleteState(id)
            ctx.stub.setEvent("DeletePackage", Buffer.from(stringify(sortKeysRecursive({ id }))))
            return
        }

        throw new Error("Not authorized to delete this package")
    }

    // PackageExists returns true when package with given ID exists in world state.
    @Transaction(false)
    @Returns("boolean")
    public async PackageExists(ctx: Context, id: string): Promise<boolean> {
        const data = await ctx.stub.getState(id)
        return data.length > 0
    }

    // ProposeTransfer creates a transfer proposal for an asset to another organization.
    @Transaction()
    public async ProposeTransfer(ctx: Context, pkgId: string): Promise<void> {
        const packageJSON = await this.ReadPackage(ctx, pkgId)
        const packageData = JSON.parse(packageJSON) as PublicPackage

        const fromMSP = callerMSP(ctx)

        if (packageData.ownerOrgMSP !== fromMSP) {
            throw new Error(`The caller is not authorized to propose transfer for the package ${pkgId}`)
        }

        const tmap = ctx.stub.getTransient()
        
        const pdc = tmap.get("pdcCollection")?.toString();
        if (!pdc) {
          throw new Error("Missing transient field 'pdcCollection' for private transfer terms");
        }

        const termsBuf = tmap.get("terms")?.toString()

        if (!termsBuf) {
            throw new Error("Missing transient field 'terms' for private transfer terms")
        }

        let raw: any
        try {
            raw = JSON.parse(termsBuf.toString())
        } catch (e) {
            throw new Error(`Invalid JSON for 'terms': ${(e as Error).message}`)
        }
        
        // Validate that terms has the required fields [proposalId, pkgId, fromMSP, toMSP, expiryISO (optional)]
        const missing: string[] = []
        const req = ["proposalId", "pkgId", "fromMSP", "toMSP"] as const
        for (const k of req) if (raw[k] == null || raw[k] === "") missing.push(k)
        if (missing.length) {
            throw new Error(`Missing required term field(s): ${missing.join(", ")}`)
        }

        // Verify if expiryISO is valid if provided
        if (raw.expiryISO) {
            const d = new Date(raw.expiryISO)
            if (isNaN(d.getTime())) {
                throw new Error(`Invalid expiryISO date: ${raw.expiryISO}`)
            }
            if (d < new Date()) {
                throw new Error(`expiryISO must be in the future: ${raw.expiryISO}`)
            }
        }
      
        // pkgId must match the function arg
        if (raw.pkgId !== pkgId) {
            throw new Error(`terms.pkgId (${raw.pkgId}) does not match argument pkgId (${pkgId})`)
        }
      
        // fromMSP must be the caller & current owner
        if (raw.fromMSP !== fromMSP) {
            throw new Error(`terms.fromMSP (${raw.fromMSP}) must equal caller MSP (${fromMSP})`)
        }
        if (raw.fromMSP !== packageData.ownerOrgMSP) {
            throw new Error(`terms.fromMSP (${raw.fromMSP}) must equal current owner (${packageData.ownerOrgMSP})`)
        }
        if (raw.toMSP === fromMSP) {
            throw new Error("toMSP must differ from fromMSP");
        }

        const createdISO = new Date().toISOString()
        const status = TransferStatus.PROPOSED

        const terms = {
            proposalId: raw.proposalId,
            pkgId,
            fromMSP,
            toMSP: raw.toMSP,
            createdISO,
            expiryISO: raw.expiryISO || null,
        }
        const canonicalTerms = stringify(sortKeysRecursive(terms))
        const termsHash = createHash("sha256").update(canonicalTerms).digest("hex")

        const transfer: Transfer = {
            terms,
            hash: termsHash,
            status,
        }
        const pKey = proposalKey(ctx, pkgId, terms.proposalId)
        
        const exists = await ctx.stub.getPrivateData(pdc, pKey)
        if (exists && exists.length) {
            throw new Error(`A transfer proposal '${terms.proposalId}' for package '${pkgId}' already exists`);
        }

        const stateBuffer = Buffer.from(stringify(sortKeysRecursive(transfer)))
        await ctx.stub.putPrivateData(pdc, pKey, stateBuffer)
        ctx.stub.setEvent("TransferProposed", Buffer.from(stringify({ pkgId, proposalId: terms.proposalId })))
    }

    // AcceptTransfer accepts a transfer proposal for an asset from another organization.
    @Transaction()
    public async AcceptTransfer(ctx: Context, pkgId: string, proposalId: string): Promise<void> {
        // PDC collection name must be passed via transient
        const pdc = ctx.stub.getTransient().get("pdcCollection")?.toString()
        if (!pdc) {
            throw new Error("Missing transient field 'pdcCollection' for private transfer terms")
        }

        const pKey = proposalKey(ctx, pkgId, proposalId)

        // Read the private transfer (PDC only)
        const privateBuf = await ctx.stub.getPrivateData(pdc, pKey)
        if (!privateBuf.length) {
            throw new Error(`The private transfer proposal ${proposalId} for package ${pkgId} does not exist`)
        }

        // Parse and validate structure
        const transfer = JSON.parse(privateBuf.toString()) as Transfer

        // Sanity checks on terms core fields
        const terms = transfer.terms
        if (!terms || terms.proposalId !== proposalId || terms.pkgId !== pkgId) {
            throw new Error("Transfer terms are missing or inconsistent (proposalId/pkgId mismatch)")
        }

        // Only proposed recipient may accept
        const caller = callerMSP(ctx)
        if (caller !== terms.toMSP) {
            throw new Error("Only the proposed recipient may accept the transfer")
        }

        // Expiry validation (if provided)
        if (terms.expiryISO) {
            const exp = new Date(terms.expiryISO)
            if (isNaN(exp.getTime())) {
                throw new Error(`Invalid expiryISO on transfer terms: ${terms.expiryISO}`)
            }
            if (exp < new Date()) {
                // Mark EXPIRED privately
                const expiredCanonical = stringify(sortKeysRecursive({ terms, hash: transfer.hash, status: TransferStatus.EXPIRED }))
                await ctx.stub.putPrivateData(pdc, pKey, Buffer.from(expiredCanonical))
                throw new Error(`The transfer proposal ${proposalId} for package ${pkgId} has expired`)
            }
        }

        // Recompute canonical hash of terms to verify integrity
        const canonicalTermsJSON = stringify(sortKeysRecursive(terms))
        const recomputedHash = createHash("sha256").update(canonicalTermsJSON, "utf8").digest("hex")
        if (recomputedHash !== transfer.hash) {
            throw new Error("Private transfer terms hash mismatch")
        }

        // Status must be PROPOSED to accept
        if (transfer.status !== TransferStatus.PROPOSED) {
            throw new Error(`Cannot accept transfer in status ${transfer.status}`)
        }

        // Update status to ACCEPTED (privately)
        transfer.status = TransferStatus.ACCEPTED

        const updatedTransferJSON = stringify(sortKeysRecursive(transfer))
        await ctx.stub.putPrivateData(pdc, pKey, Buffer.from(updatedTransferJSON))

        // Event (avoid leaking more than needed)
        ctx.stub.setEvent("TransferAccepted", Buffer.from(stringify({ pkgId, proposalId })))
    }


    // ExecuteTransfer executes a transfer for an asset from one organization to another.
    @Transaction()
    public async ExecuteTransfer(ctx: Context, pkgId: string, proposalId: string): Promise<void> {
        // Public package read
        const packageJSON = await this.ReadPackage(ctx, pkgId)
        const packageData = validateJSONToPublicPackage(packageJSON)

        // PDC collection
        const pdc = ctx.stub.getTransient().get("pdcCollection")?.toString()
        if (!pdc) {
            throw new Error("Missing transient field 'pdcCollection' for private transfer terms")
        }

        const pKey = proposalKey(ctx, pkgId, proposalId)

        // Read private transfer
        const privateBuf = await ctx.stub.getPrivateData(pdc, pKey)
        if (!privateBuf.length) {
            throw new Error(`The private transfer proposal ${proposalId} for package ${pkgId} does not exist`)
        }

        const transfer = JSON.parse(privateBuf.toString()) as Transfer
        const { terms, hash } = transfer

        // Basic consistency checks
        if (!terms || terms.proposalId !== proposalId || terms.pkgId !== pkgId) {
            throw new Error("Transfer terms are missing or inconsistent (proposalId/pkgId mismatch)")
        }

        // Must be ACCEPTED to execute
        if (transfer.status !== TransferStatus.ACCEPTED) {
            throw new Error(`The transfer proposal ${proposalId} for package ${pkgId} is not ACCEPTED`)
        }

        // Ensure not expired
        if (terms.expiryISO) {
            const exp = new Date(terms.expiryISO)
            if (isNaN(exp.getTime())) {
                throw new Error(`Invalid expiryISO on transfer terms: ${terms.expiryISO}`)
            }
            if (exp < new Date()) {
                transfer.status = TransferStatus.EXPIRED
                const expiredJSON = stringify(sortKeysRecursive(transfer))
                await ctx.stub.putPrivateData(pdc, pKey, Buffer.from(expiredJSON))
                throw new Error(`The transfer proposal ${proposalId} for package ${pkgId} has expired`)
            }
        }

        // Recompute and verify hash again
        const canonicalTermsJSON = stringify(sortKeysRecursive(terms))
        const recomputedHash = createHash("sha256").update(canonicalTermsJSON, "utf8").digest("hex")
        if (recomputedHash !== hash) {
            throw new Error("Private transfer terms hash mismatch")
        }

        // Ownership checks
        if (packageData.ownerOrgMSP !== terms.fromMSP) {
            throw new Error(`Package ${pkgId} is not owned by ${terms.fromMSP}`)
        }
        if (callerMSP(ctx) !== terms.fromMSP) {
            throw new Error("Only the current owner may execute the transfer")
        }

        // Perform the public ownership change
        packageData.ownerOrgMSP = terms.toMSP
        await ctx.stub.putState(pkgId, Buffer.from(stringify(sortKeysRecursive(packageData))))

        // Mark proposal EXECUTED in PDC
        transfer.status = TransferStatus.EXECUTED
        const executedJSON = stringify(sortKeysRecursive(transfer))
        await ctx.stub.putPrivateData(pdc, pKey, Buffer.from(executedJSON))

        // Public event that reveals only pkgId + newOwner
        ctx.stub.setEvent(
            "TransferExecuted",
            Buffer.from(stringify({ pkgId, proposalId, newOwner: packageData.ownerOrgMSP }))
        )
    }

}
