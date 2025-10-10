// import { createHash } from "crypto"
// import stringify from "json-stringify-deterministic"
// import sortKeysRecursive from "sort-keys-recursive"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { PackageContract } from "../src/packageContract"
import { MockContext } from "./helpers/mockContext"
import { PrivatePackage, Status, Urgency } from "../src/package"

// Mock the fabric-contract-api decorators before importing classes that use them
vi.mock("fabric-contract-api", async (importOriginal) => {
    const actual = await importOriginal()
    const actualAny = actual as any
    return {
        ...actualAny,
        Object: () => (target: any) => target,
        Info: () => (target: any) => target,
        Property: () => (target: any, propertyKey: string) => {},
        Transaction:
            () =>
            (
                target: any,
                propertyKey: string,
                descriptor: PropertyDescriptor
            ) =>
                descriptor,
        Returns: () => (target: any, propertyKey: string) => {},
    }
})

const pii: PrivatePackage = {
    pickupLocation: { name: "A", address: "A st", lat: 1.1, lng: 2.2 },
    dropLocation: { name: "B", address: "B st", lat: 3.3, lng: 4.4 },
    address: "Sender addr",
    size: { width: 10, height: 20, depth: 30 },
    weightKg: 5.5,
    urgency: Urgency.MEDIUM,
}

// Helper function to call UpdatePackageStatus with proper typing
const UpdatePackageStatus = (
    contract: PackageContract,
    ctx: MockContext,
    packageId: string,
    status: Status
) => {
    // @ts-ignore
    return contract.UpdatePackageStatus(ctx, packageId, status)
}

// Got to do the same for the other functions from packageContract
// e.g., CreatePackage, GetPackage, etc.

// TODO: add tests for different roles
// pm3, transporter, ombud roles

describe("PackageContract (unit)", () => {
    let c: PackageContract
    let ctxOmbud: MockContext
    let ctxPM3: MockContext
    let ctxTransporter: MockContext

    beforeEach(() => {
        c = new PackageContract()
        ctxOmbud = new MockContext({
            mspId: "Org0MSP",
            attrs: { role: "ombud" },
            transient: { pii },
        })
        ctxPM3 = new MockContext({
            mspId: "Org1MSP",
            attrs: { role: "pm3" },
            transient: { pii },
        })
        ctxTransporter = new MockContext({
            mspId: "Org2MSP",
            attrs: { role: "transporter" },
            transient: { pii },
        })
    })

    // Ombud role tests

    // pm3

    // transporter
})
