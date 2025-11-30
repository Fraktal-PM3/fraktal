import { Context } from "fabric-contract-api"
import {
    BlockchainPackageSchema,
    PackageDetailsSchema,
    PackagePIISchema,
    PrivateTransferTermsSchema,
    Status,
    StoreObjectSchema,
    TransferTermsSchema,
    Urgency,
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

export const proposalKey = (
    ctx: Context,
    pkgId: string,
    proposalId: string
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
        [Status.PENDING]: [Status.PROPOSED],
        [Status.PROPOSED]: [Status.READY_FOR_PICKUP],
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
            `Invalid JSON format for BlockchainPackage: ${(e as Error).message}`
        )
    }
}

export const validateJSONToPackageDetails = (json: string) => {
    try {
        return PackageDetailsSchema.parse(JSON.parse(json))
    } catch (e) {
        throw new Error(
            `Invalid JSON format for PackageDetails: ${(e as Error).message}`
        )
    }
}

export const validateJSONToPII = (json: string) => {
    try {
        return PackagePIISchema.parse(JSON.parse(json))
    } catch (e) {
        throw new Error(
            `Invalid JSON format for PackagePII: ${(e as Error).message}`
        )
    }
}

export const validateJSONToPrivateTransferTerms = (json: string) => {
    try {
        return PrivateTransferTermsSchema.parse(JSON.parse(json))
    } catch (e) {
        throw new Error(
            `Invalid JSON format for PrivateTransferTerms: ${
                (e as Error).message
            }`
        )
    }
}

export const validateJSONToTransferTerms = (json: string) => {
    try {
        return TransferTermsSchema.parse(JSON.parse(json))
    } catch (e) {
        throw new Error(
            `Invalid JSON format for TransferTerms: ${(e as Error).message}`
        )
    }
}

export const validateJSONToStoreObject = (json: string) => {
    try {
        return StoreObjectSchema.parse(JSON.parse(json))
    } catch (e) {
        throw new Error(
            `Invalid JSON format for StoreObject: ${(e as Error).message}`
        )
    }
}

export const isUUID = (str: string): boolean => {
    if (typeof str !== "string") return false
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(str.trim())
}

export const isISODateString = (str: string): boolean => {
    if (typeof str !== "string") return false
    const d = new Date(str)
    return !isNaN(d.getTime()) && d.toISOString() === str
}

/**
 * Get the implicit private data collection name for an organization.
 * Implicit collections follow the naming pattern: _implicit_org_<MSPID>
 * Each organization has its own implicit collection that only they can access.
 */
export const getImplicitCollection = (mspID: string): string => {
    return `_implicit_org_${mspID}`
}

/**
 * Check if the caller has a specific permission by invoking the roleAuth chaincode.
 * Uses cross-chaincode invocation to query the roleAuth contract.
 *
 * @param ctx - The transaction context
 * @param permission - The permission to check (e.g., 'package:delete')
 * @param channelName - The channel name where roleAuth is deployed (defaults to 'pm3')
 * @returns {Promise<boolean>} true if the caller has the permission, false otherwise
 */
export const checkPermission = async (
    ctx: Context,
    permission: string,
    channelName: string = "pm3"
): Promise<boolean> => {
    try {
        console.log(
            `[checkPermission] Invoking pm3roleauth chaincode for permission '${permission}' on channel '${channelName}'`
        )
        const response = await ctx.stub.invokeChaincode(
            "pm3roleauth",
            ["callerHasPermission", permission],
            channelName
        )

        console.log(
            `[checkPermission] Response status: ${response.status}, message: ${response.message}`
        )

        if (response.status !== 200) {
            console.log(
                `[checkPermission] Failed to check permission '${permission}': ${response.message}`
            )
            return false
        }

        if (!response.payload) {
            console.log(
                `[checkPermission] No payload returned for permission '${permission}'`
            )
            return false
        }

        const hasPermission = JSON.parse(response.payload.toString())
        console.log(
            `[checkPermission] Permission '${permission}' check result: ${hasPermission}`
        )
        return hasPermission
    } catch (error) {
        console.log(
            `[checkPermission] Error checking permission '${permission}': ${error}`
        )
        return false
    }
}
