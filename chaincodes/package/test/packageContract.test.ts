import { describe, it, expect, beforeEach, vi } from "vitest"
import { PackageContract } from "../src/packageContract"
import { MockContext } from "./helpers/mockContext"
import { Status, Urgency, PackageDetails, PackagePII } from "../src/package"

// Mock the fabric-contract-api decorators before importing classes that use them
vi.mock("fabric-contract-api", async (importOriginal: any) => {
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

const packageDetails: PackageDetails = {
    pickupLocation: { address: "A st", lat: 1.1, lng: 2.2 },
    dropLocation: { address: "B st", lat: 3.3, lng: 4.4 },
    size: { width: 10, height: 20, depth: 30 },
    weightKg: 5.5,
    urgency: Urgency.MEDIUM,
}

const pii: PackagePII = {
    whateverwesend: "hello",
    whatever: true,
    anything: 123,
}

describe("PackageContract (unit)", () => {
    let c: PackageContract
    let ctxOmbud: MockContext
    let ctxPM3: MockContext
    let ctxTransporter: MockContext

    beforeEach(() => {
        c = new PackageContract()
        ctxOmbud = new MockContext({
            mspId: "Org0MSP",
            transient: { packageDetails, pii },
        })
        ctxPM3 = new MockContext({
            mspId: "Org1MSP",
            transient: { packageDetails, pii },
        })
        ctxTransporter = new MockContext({
            mspId: "Org2MSP",
            transient: { packageDetails, pii },
        })
    })
    // Tests go here
    describe("CreatePackage", () => {
        it("Anyone can create a package test", async () => {
            const externalId = "PKG-001"
            const salt = "randomSalt123"
            await c.CreatePackage(ctxOmbud as any, externalId, salt)
            const exists = await c.PackageExists(ctxOmbud as any, externalId)
            expect(exists).toBe(true)
            // prettier-ignore
            const readPkg = await c.ReadPackageDetailsAndPII(ctxOmbud as any,externalId)
            const parsedPkg = JSON.parse(readPkg)
            expect(parsedPkg.salt).toBe(salt)
            expect(parsedPkg.packageDetails).toEqual(packageDetails)
            expect(parsedPkg.pii).toEqual(pii)
        })
    })
    describe("ReadBlockchainPackage", () => {
        it("Should read back the created package", async () => {
            const externalId = "PKG-002"
            const salt = "randomSalt456"
            await c.CreatePackage(ctxPM3 as any, externalId, salt)
            const pkgStr = await c.ReadBlockchainPackage(
                ctxPM3 as any,
                externalId
            )
            const pkg = JSON.parse(pkgStr)
            expect(pkg.externalId).toBe(externalId)
            expect(pkg.status).toBe(Status.PENDING)
            expect(pkg.ownerOrgMSP).toBe("Org1MSP")
            expect(pkg.packageDetailsAndPIIHash).toBeDefined()
            expect(pkg.packageDetailsAndPIIHash).toMatch(/^[a-f0-9]{64}$/) // SHA256 hash format
        })
    })
    describe("ReadPackageDetailsAndPII", () => {
        it("Should read back the package details and PII", async () => {
            const externalId = "PKG-003"
            const salt = "randomSalt789"
            await c.CreatePackage(ctxTransporter as any, externalId, salt)
            const pkgStr = await c.ReadPackageDetailsAndPII(
                ctxTransporter as any,
                externalId
            )
            const pkg = JSON.parse(pkgStr)
            expect(pkg.salt).toBe(salt)
            expect(pkg.packageDetails).toEqual(packageDetails)
            expect(pkg.pii).toEqual(pii)
        })
    })
    describe.skip("UpdatePackageStatus", () => {})
    describe.skip("DeletePackage", () => {})
    describe.skip("PackageExists", () => {})
    describe.skip("ProposeTransfer", () => {})
    describe.skip("CheckPackageDetailsAndPIIHash", () => {})
    describe.skip("ReadTransferTerms", () => {})
    describe.skip("ReadPrivateTransferTerms", () => {})
    describe.skip("AcceptTransfer", () => {})
    describe.skip("ExecuteTransfer", () => {})
})
