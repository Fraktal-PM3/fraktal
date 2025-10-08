import stringify from "json-stringify-deterministic"
import sortKeysRecursive from "sort-keys-recursive"
import { Context } from "fabric-contract-api"
import {
    PrivatePackage,
    PublicPackage,
    Status,
    TransferTerms,
    Urgency,
} from "./package"
import { createHash } from "crypto"

export const callerMSP = (ctx: Context) => {
    return ctx.clientIdentity.getMSPID()
}

export const requireAttr = (ctx: Context, k: string, v: string) => {
    return ctx.clientIdentity.assertAttributeValue(k, v)
}

export const requireMSP = (ctx: Context, expected: string) => {
    const msp = ctx.clientIdentity.getMSPID()
    return msp !== expected
}

export const proposalKey = (
    ctx: Context,
    pkgId: string,
    proposalId: string,
) => {
    return ctx.stub.createCompositeKey("proposal", [pkgId, proposalId])
}

export const validUrgencies = new Set<string>([
    Urgency.HIGH,
    Urgency.MEDIUM,
    Urgency.LOW,
    Urgency.NONE,
])

export const isAllowedTransition = (from: Status, to: Status): boolean => {
    const edges: Record<Status, Status[]> = {
        [Status.PENDING]: [Status.READY_FOR_PICKUP],
        [Status.READY_FOR_PICKUP]: [Status.PICKED_UP],
        [Status.PICKED_UP]: [Status.IN_TRANSIT],
        [Status.IN_TRANSIT]: [Status.DELIVERED],
        [Status.DELIVERED]: [Status.SUCCEEDED, Status.FAILED],
        [Status.SUCCEEDED]: [],
        [Status.FAILED]: [],
    }
    return edges[from].includes(to)
}

export const readAndHashTransientJson = (
    ctx: Context,
    key: string,
): Promise<{ terms: TransferTerms; canonical: string; hash: string }> => {
    const t = ctx.stub.getTransient()
    const buf = t.get(key)
    const terms = validateJSONToTransferTerms(buf?.toString() ?? "")
    const canonical = stringify(sortKeysRecursive(terms))
    const hash = createHash("sha256").update(canonical).digest("hex")
    return Promise.resolve({ terms, canonical, hash })
}

export const validateJSONToTransferTerms = (json: string) => {
    try {
        const terms = JSON.parse(json) as TransferTerms
        const parsedTerms: TransferTerms = {
            proposalId: terms.proposalId,
            pkgId: terms.pkgId,
            fromMSP: terms.fromMSP,
            toMSP: terms.toMSP,
            termsHash: terms.termsHash,
            createdISO: terms.createdISO,
            expiryISO: terms.expiryISO,
            status: terms.status,
        }
        return parsedTerms
    } catch (e) {
        throw new Error(`TransferTerms invalid JSON: ${(e as Error).message}`)
    }
}

export const validateJSONToPublicPackage = (json: string) => {
    try {
        const packageData = JSON.parse(json) as PublicPackage
        const parsedPackage: PublicPackage = {
            id: packageData.id,
            ownerOrgMSP: packageData.ownerOrgMSP,
            status: packageData.status,
            dataHash: packageData.dataHash,
        }
        return parsedPackage
    } catch (e) {
        throw new Error(
            `Invalid JSON format for PublicPackage: ${(e as Error).message}`,
        )
    }
}

export const validateJSONToPrivatePackage = (json: string) => {
    try {
        const packageData = JSON.parse(json) as PrivatePackage
        const parsedPackage: PrivatePackage = {
            pickupLocation: packageData.pickupLocation,
            dropLocation: packageData.dropLocation,
            address: packageData.address,
            size: packageData.size,
            weightKg: packageData.weightKg,
            urgency: packageData.urgency,
        }
        return parsedPackage
    } catch (e) {
        throw new Error(
            `Invalid JSON format for PrivatePackage: ${(e as Error).message}`,
        )
    }
}
