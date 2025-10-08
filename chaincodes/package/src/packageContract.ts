import { Context, Contract, Info, Returns, Transaction } from "fabric-contract-api"
import { callerMSP, isAllowedTransition, proposalKey, readAndHashTransientJson, requireAttr, validUrgencies } from "./utils"
import { PrivatePackage, PublicPackage, Status, TransferStatus, TransferTerms } from "./package"
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
    public async CreatePackage(ctx: Context, packageData: PublicPackage): Promise<void> {

        if (!packageData?.id || typeof packageData.id !== "string") {
            throw new Error("packageData.id must be a non-empty string");
        }

        const exists = await this.PackageExists(ctx, packageData.id)
        if (exists) throw new Error(`The package ${packageData.id} already exists`)

        const ownerOrgMSPID = callerMSP(ctx)

        // Check that the caller has the role of 'ombud'
        const isOmbud = requireAttr(ctx, "role", "ombud")
        if (!isOmbud) throw new Error("The caller is not authorized to issue packages")

        // Read the private details of the package from transient data
        const tmap = ctx.stub.getTransient()
        const piiBuf = tmap.get("pii")
        if (!piiBuf) {
            throw new Error("Missing transient field 'pii' (must be JSON of PrivatePackage)")
        }

        let pii: PrivatePackage
        try {
            pii = JSON.parse(piiBuf.toString()) as PrivatePackage
        } catch (err) {
            throw new Error(`Transient 'pii' is not valid JSON: ${(err as Error).message}`)
        }

        // Validate the private data
        const fail = (msg: string) => new Error(`PII schema validation failed: ${msg}`)
        const isNum = (v: unknown) => typeof v === "number" && Number.isFinite(v)
        const isStr = (v: unknown) => typeof v === "string" && v.length > 0
        const isLoc = (v: any) => v && isStr(v.name) && isStr(v.address) && isNum(v.lat) && isNum(v.lng)

        if (!pii || typeof pii !== "object") throw fail("root must be an object")
        if (!isLoc((pii as any).pickupLocation)) throw fail("pickupLocation is invalid")
        if (!isLoc((pii as any).dropLocation)) throw fail("dropLocation is invalid")
        if (!isStr((pii as any).address)) throw fail("address must be a non-empty string")
        if (!(pii as any).size || typeof (pii as any).size !== "object") throw fail("size is required")
        if (!isNum((pii as any).size.width) || !isNum((pii as any).size.height) || !isNum((pii as any).size.depth)) {
            throw fail("size.width/height/depth must be numbers")
        }
        if (!isNum((pii as any).weightKg)) throw fail("weightKg must be a number")
        if (!isStr((pii as any).urgency)) throw fail("urgency must be one of: high|medium|low|none")
        if (!validUrgencies.has((pii as any).urgency)) throw fail("urgency must be one of: high|medium|low|none")

        const canonicalPII = stringify(sortKeysRecursive(pii))
        const dataHash = createHash("sha256").update(canonicalPII).digest("hex")

        const newPackage: PublicPackage = {
            ...packageData,
            status: Status.PENDING,
            ownerOrgMSP: ownerOrgMSPID,
            dataHash
        }

        const stateBuffer = Buffer.from(stringify(sortKeysRecursive(newPackage)))
        await ctx.stub.putState(packageData.id, stateBuffer)
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
        const packageData: PublicPackage = JSON.parse(packageJSON)
        if (!packageData) throw new Error(`The package ${id} does not exist`)
        

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
        await ctx.stub.putState(id, stateBuffer)
        ctx.stub.setEvent("StatusUpdated", Buffer.from(stringify(sortKeysRecursive({ id, status }))))        
    }

    // DeletePackage deletes an given package from the world state.
    @Transaction()
    public async DeletePackage(ctx: Context, id: string): Promise<void> {
        const packageJSON = await this.ReadPackage(ctx, id)
        const packageData: PublicPackage = JSON.parse(packageJSON)

        if (!packageData) {
            throw new Error(`The package ${id} does not exist`)
        }

        // Check that the caller has the role of 'ombud' if status is PENDING
        const isOmbud = requireAttr(ctx, "role", "ombud")
        const isPM3 = requireAttr(ctx, "role", "pm3")
        if (isOmbud && packageData.status === Status.PENDING || isPM3) {
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
        return !!data && data.length > 0
    }

    // ProposeTransfer creates a transfer proposal for an asset to another organization.
    @Transaction()
    public async ProposeTransfer(ctx: Context, pkgId: string, proposalId: string, toMSP: string): Promise<void> {
        const packageJSON = await this.ReadPackage(ctx, pkgId)
        const packageData: PublicPackage = JSON.parse(packageJSON)
        if (!packageData) throw new Error(`The package ${pkgId} does not exist`)

        const ownerOrgMSPID = callerMSP(ctx)

        if (packageData.ownerOrgMSP !== ownerOrgMSPID) {
            throw new Error(`The caller is not authorized to propose transfer for the package ${pkgId}`)
        }

        const { obj: terms, canonical, hash: termsHash } = await readAndHashTransientJson(ctx, "terms")

        const pKey = proposalKey(ctx, pkgId, proposalId)
        const exists = await ctx.stub.getState(pKey)

        if (exists && exists.length) {
            throw new Error(`The transfer proposal ${proposalId} for package ${pkgId} already exists`)
        }

        const pdc = ctx.stub.getTransient().get("pdcCollection")?.toString()
        if (!pdc) {
            throw new Error("Missing transient field 'pdcCollection' for private transfer terms")
        }

        await ctx.stub.putPrivateData(pdc, pKey, Buffer.from(canonical))

        const createdISO = new Date().toISOString()
        const expiryISO = terms.expiryISO

        const proposalStub: TransferTerms = {
            proposalId,
            pkgId,
            fromMSP: ownerOrgMSPID,
            toMSP,
            termsHash,
            createdISO,
            expiryISO,
            status: TransferStatus.PROPOSED
        }

        const stateBuffer = Buffer.from(stringify(sortKeysRecursive(proposalStub)))
        await ctx.stub.putState(pKey, stateBuffer)
        ctx.stub.setEvent("TransferProposed", stateBuffer)
    }

    // AcceptTransfer accepts a transfer proposal for an asset from another organization.
    @Transaction()
    public async AcceptTransfer(ctx: Context, pkgId: string, proposalId: string): Promise<void> {
        const pKey = proposalKey(ctx, pkgId, proposalId)
        const proposalBuf = await ctx.stub.getState(pKey)
        if (!proposalBuf || !proposalBuf.length) {
            throw new Error(`The transfer proposal ${proposalId} for package ${pkgId} does not exist`)
        }

        const proposal: TransferTerms = JSON.parse(proposalBuf.toString())
        if (proposal.status !== TransferStatus.PROPOSED) {
            throw new Error(`The transfer proposal ${proposalId} for package ${pkgId} is not in PROPOSED status`)
        }

        if (callerMSP(ctx) !== proposal.toMSP) {
            throw new Error("Only the proposed recipient may accept the transfer")
        }

        if (proposal.expiryISO && new Date(proposal.expiryISO) < new Date()) {
            proposal.status = TransferStatus.EXPIRED
            const stateBuffer = Buffer.from(stringify(sortKeysRecursive(proposal)))
            await ctx.stub.putState(pKey, stateBuffer)
            throw new Error(`The transfer proposal ${proposalId} for package ${pkgId} has expired`)
        }

        // Validate we see the terms privately
        const pdc = ctx.stub.getTransient().get("pdcCollection")?.toString()
        if (!pdc) {
            throw new Error("Missing transient field 'pdcCollection' for private transfer terms")
        }

        const privateBuf = await ctx.stub.getPrivateData(pdc, pKey)
        if (!privateBuf || !privateBuf.length) {
            throw new Error("The private transfer terms have not been submitted")
        }

        const termsHash = createHash("sha256").update(privateBuf).digest("hex")
        if (termsHash !== proposal.termsHash) {
            throw new Error("The private transfer terms do not match the proposal")
        }

        proposal.status = TransferStatus.ACCEPTED

        const stateBuffer = Buffer.from(stringify(sortKeysRecursive(proposal)))
        await ctx.stub.putState(pKey, stateBuffer)
        ctx.stub.setEvent("TransferAccepted", Buffer.from(stringify({ pkgId, proposalId })))
    }

    // ExecuteTransfer executes a transfer for an asset from one organization to another.
    @Transaction()
    public async ExecuteTransfer(ctx: Context, pkgId: string, proposalId: string): Promise<void> {
        const packageJSON = await this.ReadPackage(ctx, pkgId)
        const packageData: PublicPackage = JSON.parse(packageJSON)
        if (!packageData) throw new Error(`The package ${pkgId} does not exist`)

        const pKey = proposalKey(ctx, pkgId, proposalId)
        const proposalBuf = await ctx.stub.getState(pKey)
        if (!proposalBuf || !proposalBuf.length) {
            throw new Error(`The transfer proposal ${proposalId} for package ${pkgId} does not exist`)
        }

        const proposal: TransferTerms = JSON.parse(proposalBuf.toString())
        
        if (proposal.status !== TransferStatus.ACCEPTED) {
            throw new Error(`The transfer proposal ${proposalId} for package ${pkgId} is not ACCEPTED`)
        }

        if (proposal.expiryISO && new Date(proposal.expiryISO) < new Date()) {
            proposal.status = TransferStatus.EXPIRED
            const stateBuffer = Buffer.from(stringify(sortKeysRecursive(proposal)))
            await ctx.stub.putState(pKey, stateBuffer)
            throw new Error(`The transfer proposal ${proposalId} for package ${pkgId} has expired`)
        }

        if (packageData.ownerOrgMSP !== proposal.fromMSP) {
            throw new Error(`The package ${pkgId} is not owned by ${proposal.fromMSP}`)
        }

        if (callerMSP(ctx) !== proposal.fromMSP) {
            throw new Error("Only current owner may execute transfer")
        }

        packageData.ownerOrgMSP = proposal.toMSP
        
        await ctx.stub.putState(pkgId, Buffer.from(stringify(sortKeysRecursive(packageData))))
        proposal.status = TransferStatus.EXECUTED
        await ctx.stub.putState(pKey, Buffer.from(stringify(sortKeysRecursive(proposal))))
        
        ctx.stub.setEvent("TransferExecuted", Buffer.from(stringify({ pkgId, proposalId, newOwner: packageData.ownerOrgMSP })))
    }
}
