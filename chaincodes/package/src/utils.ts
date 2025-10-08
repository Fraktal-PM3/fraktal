import stringify from "json-stringify-deterministic"
import sortKeysRecursive from "sort-keys-recursive"
import { Context } from "fabric-contract-api"
import { Status, Urgency } from "./package"
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

export const proposalKey = (ctx: Context, pkgId: string, proposalId: string) => {
    return ctx.stub.createCompositeKey("proposal", [pkgId, proposalId])
}

export const validUrgencies = new Set<string>([
    Urgency.HIGH, Urgency.MEDIUM, Urgency.LOW, Urgency.NONE,
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
    return edges[from]?.includes(to) ?? false
}

export const readAndHashTransientJson = (ctx: Context, key: string): Promise<{ obj: any; canonical: string; hash: string }> => {
    const t = ctx.stub.getTransient()
    const buf = t.get(key)
    if (!buf) throw new Error(`Missing transient field '${key}'`)
    let obj: any
    try {
        obj = JSON.parse(buf.toString())
    } catch (e) {
        throw new Error(`Transient '${key}' invalid JSON: ${(e as Error).message}`)
    }
    const canonical = stringify(sortKeysRecursive(obj))
    const hash = createHash("sha256").update(canonical).digest("hex")
    return Promise.resolve({ obj, canonical, hash })
}
