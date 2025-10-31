import { Context } from "fabric-contract-api"
import {
    BlockchainPackageSchema,
    PackageDetailsSchema,
    PackagePIISchema,
    PrivateTransferTermsSchema,
    Status,
    TransferTermsSchema,
    Urgency
} from "./package"

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

export const proposalKey = (ctx: Context, pkgId: string, proposalId: string) => {
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

export const validateJSONToBlockchainPackage = (json: string) => {
    try {
        return BlockchainPackageSchema.parse(JSON.parse(json))
    } catch (e) {
        throw new Error(
            `Invalid JSON format for BlockchainPackage: ${(e as Error).message}`,
        )
    }
}

export const validateJSONToPackageDetails = (json: string) => {
    try {
        return PackageDetailsSchema.parse(JSON.parse(json))
    } catch (e) {
        throw new Error(
            `Invalid JSON format for PackageDetails: ${(e as Error).message}`,
        )
    }
}

export const validateJSONToPII = (json: string) => {
    try {
        return PackagePIISchema.parse(JSON.parse(json))
    } catch (e) {
        throw new Error(
            `Invalid JSON format for PackagePII: ${(e as Error).message}`,
        )
    }

}

export const validateJSONToPrivateTransferTerms = (json: string) => {
    try {
        return PrivateTransferTermsSchema.parse(JSON.parse(json))
    } catch (e) {
        throw new Error(
            `Invalid JSON format for PrivateTransferTerms: ${(e as Error).message}`,
        )
    }
}

export const validateJSONToTransferTerms = (json: string) => {
    try {
        return TransferTermsSchema.parse(JSON.parse(json))
    } catch (e) {
        throw new Error(
            `Invalid JSON format for TransferTerms: ${(e as Error).message}`,
        )
    }
}

/**
 * Get the implicit private data collection name for an organization.
 * Implicit collections follow the naming pattern: _implicit_org_<MSPID>
 * Each organization has its own implicit collection that only they can access.
 */
export const getImplicitCollection = (mspID: string): string => {
    return `_implicit_org_${mspID}`
}