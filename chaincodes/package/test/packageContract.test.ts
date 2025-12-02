import { describe, it, expect, beforeEach, vi } from "vitest"
import { PackageContract } from "../src/packageContract"
import { MockContext } from "./helpers/mockContext"
import {
    Status,
    Urgency,
    PackageDetails,
    PackagePII,
    BlockchainPackageType,
    StoreObjectSchema,
} from "../src/package"
import { Context } from "fabric-contract-api"

type ClassDecorator = (target: unknown) => unknown
type PropertyDecorator = (
    target: unknown,
    propertyKey: string | symbol,
) => unknown
type MethodDecorator = (
    target: unknown,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
) => unknown

interface FabricContractAPI {
    Object: () => ClassDecorator
    Info: () => ClassDecorator
    Property: () => PropertyDecorator
    Transaction: () => MethodDecorator
    Returns: () => MethodDecorator
}

// Mock the fabric-contract-api decorators before importing classes that use them
vi.mock(
    "fabric-contract-api",
    async (importOriginal: () => Promise<Record<string, unknown>>) => {
        const actual = await importOriginal()
        return {
            ...actual,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            Object: () => (target: unknown) => target,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            Info: () => (target: unknown) => target,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            Property:
                () => (target: unknown, propertyKey: string | symbol) => {},
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            Transaction:
                () =>
                (
                    target: unknown,
                    propertyKey: string | symbol,
                    descriptor: PropertyDescriptor,
                ) =>
                    descriptor,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            Returns:
                () => (target: unknown, propertyKey: string | symbol) => {},
        } as FabricContractAPI
    },
)

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
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(
                ctxOmbud as unknown as Context,
                externalId,
                recipientOrgMSP,
            )
            const exists = await c.PackageExists(
                ctxOmbud as unknown as Context,
                externalId,
            )
            expect(exists).toBe(true)
            const readPkg = await c.ReadPackageDetailsAndPII(
                ctxOmbud as unknown as Context,
                externalId,
            )
            const parsedPkg = StoreObjectSchema.parse(JSON.parse(readPkg))
            expect(parsedPkg.salt).toBe(salt)
            expect(parsedPkg.packageDetails).toEqual(packageDetails)
            expect(parsedPkg.pii).toEqual(pii)
        })
    })
    describe("ReadBlockchainPackage", () => {
        it("Should read back the created package", async () => {
            const externalId = "PKG-002"
            const salt = "randomSalt456"
            const recipientOrgMSP = "Org2MSP"
            await ctxPM3.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(
                ctxPM3 as unknown as Context,
                externalId,
                recipientOrgMSP,
            )
            const pkgStr = await c.ReadBlockchainPackage(
                ctxPM3 as unknown as Context,
                externalId,
            )
            const pkg = JSON.parse(pkgStr) as BlockchainPackageType
            expect(pkg.externalId).toBe(externalId)
            expect(pkg.status).toBe(Status.PENDING)
            expect(pkg.ownerOrgMSP).toBe("Org1MSP")
            expect(pkg.recipientOrgMSP).toBe(recipientOrgMSP)
            expect(pkg.packageDetailsAndPIIHash).toBeDefined()
            expect(pkg.packageDetailsAndPIIHash).toMatch(/^[a-f0-9]{64}$/) // SHA256 hash format
        })
    })
    describe("ReadPackageDetailsAndPII", () => {
        it("Should read back the package details and PII", async () => {
            const externalId = "PKG-003"
            const salt = "randomSalt789"
            const recipientOrgMSP = "Org1MSP"
            await ctxTransporter.stub.setTransient({
                packageDetails,
                pii,
                salt,
            })
            await c.CreatePackage(
                ctxTransporter as unknown as Context,
                externalId,
                recipientOrgMSP,
            )
            const pkgStr = await c.ReadPackageDetailsAndPII(
                ctxTransporter as unknown as Context,
                externalId,
            )
            const pkg = StoreObjectSchema.parse(JSON.parse(pkgStr))
            expect(pkg.salt).toBe(salt)
            expect(pkg.packageDetails).toEqual(packageDetails)
            expect(pkg.pii).toEqual(pii)
        })
    })
    describe("UpdatePackageStatus", () => {
        it("Should update package status from PICKED_UP to IN_TRANSIT", async () => {
            const externalId = "PKG-004"
            const salt = "randomSalt000"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(
                ctxOmbud as unknown as Context,
                externalId,
                recipientOrgMSP,
            )
            // Manually set status to PICKED_UP to test the transition to IN_TRANSIT
            const pkgStr = await c.ReadBlockchainPackage(
                ctxOmbud as unknown as Context,
                externalId,
            )
            const pkg = JSON.parse(pkgStr) as BlockchainPackageType
            pkg.status = Status.PICKED_UP
            await ctxOmbud.stub.putState(
                externalId,
                Buffer.from(JSON.stringify(pkg)),
            )
            // Now update from PICKED_UP to IN_TRANSIT
            await c.UpdatePackageStatus(
                ctxOmbud as unknown as Context,
                externalId,
                Status.IN_TRANSIT,
            )
            const updatedPkgStr = await c.ReadBlockchainPackage(
                ctxOmbud as unknown as Context,
                externalId,
            )
            const updatedPkg = JSON.parse(
                updatedPkgStr,
            ) as BlockchainPackageType
            expect(updatedPkg.status).toBe(Status.IN_TRANSIT)
        })

        it("Should update package status from any status to FAILED", async () => {
            const externalId = "PKG-004B"
            const salt = "randomSalt000B"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(
                ctxOmbud as unknown as Context,
                externalId,
                recipientOrgMSP,
            )
            // Update from PENDING to FAILED
            await c.UpdatePackageStatus(
                ctxOmbud as unknown as Context,
                externalId,
                Status.FAILED,
            )
            const pkgStr = await c.ReadBlockchainPackage(
                ctxOmbud as unknown as Context,
                externalId,
            )
            const pkg = JSON.parse(pkgStr) as BlockchainPackageType
            expect(pkg.status).toBe(Status.FAILED)
        })
    })
    describe("DeletePackage", () => {
        it("Should delete the package", async () => {
            const externalId = "PKG-005"
            const salt = "randomSalt999"
            const recipientOrgMSP = "Org1MSP"
            await ctxPM3.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(
                ctxPM3 as unknown as Context,
                externalId,
                recipientOrgMSP,
            )
            let exists = await c.PackageExists(
                ctxPM3 as unknown as Context,
                externalId,
            )
            expect(exists).toBe(true)
            await c.DeletePackage(ctxPM3 as unknown as Context, externalId)
            exists = await c.PackageExists(
                ctxPM3 as unknown as Context,
                externalId,
            )
            expect(exists).toBe(false)
        })
    })
    describe("PackageExists", () => {
        it("Should return false for non-existing package", async () => {
            const externalId = "PKG-999"
            const exists = await c.PackageExists(
                ctxOmbud as unknown as Context,
                externalId,
            )
            expect(exists).toBe(false)
        })
    })
    describe.skip("ProposeTransfer", () => {})
    describe.skip("CheckPackageDetailsAndPIIHash", () => {})
    describe.skip("ReadTransferTerms", () => {})
    describe.skip("ReadPrivateTransferTerms", () => {})
    describe.skip("AcceptTransfer", () => {})
    describe.skip("ExecuteTransfer", () => {})
})
