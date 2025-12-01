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
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)
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
            const recipientOrgMSP = "Org2MSP"
            await ctxPM3.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxPM3 as any, externalId, recipientOrgMSP)
            const pkgStr = await c.ReadBlockchainPackage(
                ctxPM3 as any,
                externalId
            )
            const pkg = JSON.parse(pkgStr)
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
                ctxTransporter as any,
                externalId,
                recipientOrgMSP
            )
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
    describe("UpdatePackageStatus", () => {
        it("Should update the package status", async () => {
            const externalId = "PKG-004"
            const salt = "randomSalt000"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)
            await c.UpdatePackageStatus(
                ctxOmbud as any,
                externalId,
                Status.PROPOSED
            )
            const pkgStr = await c.ReadBlockchainPackage(
                ctxOmbud as any,
                externalId
            )
            const pkg = JSON.parse(pkgStr)
            expect(pkg.status).toBe(Status.PROPOSED)
        })
    })
    describe("DeletePackage", () => {
        it("Should delete the package", async () => {
            const externalId = "PKG-005"
            const salt = "randomSalt999"
            const recipientOrgMSP = "Org1MSP"
            await ctxPM3.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxPM3 as any, externalId, recipientOrgMSP)
            let exists = await c.PackageExists(ctxPM3 as any, externalId)
            expect(exists).toBe(true)
            await c.DeletePackage(ctxPM3 as any, externalId)
            exists = await c.PackageExists(ctxPM3 as any, externalId)
            expect(exists).toBe(false)
        })
    })
    describe("PackageExists", () => {
        it("Should return false for non-existing package", async () => {
            const externalId = "PKG-999"
            const exists = await c.PackageExists(ctxOmbud as any, externalId)
            expect(exists).toBe(false)
        })
    })
    describe("ProposeTransfer", () => {
        it("Owner should be able to propose a transfer", async () => {
            const externalId = "PKG-TRANSFER-001"
            const salt = "transferSalt123"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440000"
            const toMSP = "Org1MSP"
            const createdISO = new Date().toISOString()
            const expiryISO = new Date(Date.now() + 86400000).toISOString()
            const privateTransferTerms = { price: 100.5 }

            await ctxOmbud.stub.setTransient({ privateTransferTerms })

            await c.ProposeTransfer(
                ctxOmbud as any,
                externalId,
                termsId,
                toMSP,
                createdISO,
                expiryISO
            )

            const pkgStr = await c.ReadBlockchainPackage(
                ctxOmbud as any,
                externalId
            )
            const pkg = JSON.parse(pkgStr)
            expect(pkg.status).toBe(Status.PROPOSED)

            const termsStr = await c.ReadTransferTerms(ctxOmbud as any, termsId)
            const terms = JSON.parse(termsStr)
            expect(terms.externalPackageId).toBe(externalId)
            expect(terms.fromMSP).toBe("Org0MSP")
            expect(terms.toMSP).toBe(toMSP)
            expect(terms.createdISO).toBe(createdISO)
            expect(terms.expiryISO).toBe(expiryISO)
        })

        it("Should fail if package does not exist", async () => {
            const externalId = "PKG-NONEXISTENT"
            const termsId = "550e8400-e29b-41d4-a716-446655440001"
            const toMSP = "Org1MSP"
            const createdISO = new Date().toISOString()
            const privateTransferTerms = { price: 100.5 }

            await ctxOmbud.stub.setTransient({ privateTransferTerms })

            await expect(
                c.ProposeTransfer(
                    ctxOmbud as any,
                    externalId,
                    termsId,
                    toMSP,
                    createdISO
                )
            ).rejects.toThrow(`The package ${externalId} does not exist`)
        })

        it("Should fail if caller is not the owner", async () => {
            const externalId = "PKG-TRANSFER-002"
            const salt = "transferSalt456"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            ctxOmbud.clientIdentity.setMSP("Org1MSP")

            const termsId = "550e8400-e29b-41d4-a716-446655440002"
            const toMSP = "Org2MSP"
            const createdISO = new Date().toISOString()
            const privateTransferTerms = { price: 100.5 }

            await ctxOmbud.stub.setTransient({ privateTransferTerms })

            await expect(
                c.ProposeTransfer(
                    ctxOmbud as any,
                    externalId,
                    termsId,
                    toMSP,
                    createdISO
                )
            ).rejects.toThrow(
                `Only the owner organization may propose a transfer for package ${externalId}`
            )
        })

        it("Should fail if termsId is not a valid UUID", async () => {
            const externalId = "PKG-TRANSFER-003"
            const salt = "transferSalt789"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "not-a-valid-uuid"
            const toMSP = "Org1MSP"
            const createdISO = new Date().toISOString()
            const privateTransferTerms = { price: 100.5 }

            await ctxOmbud.stub.setTransient({ privateTransferTerms })

            await expect(
                c.ProposeTransfer(
                    ctxOmbud as any,
                    externalId,
                    termsId,
                    toMSP,
                    createdISO
                )
            ).rejects.toThrow("Invalid termsId format — must be a UUID string.")
        })

        it("Should fail if createdISO is not a valid ISO date", async () => {
            const externalId = "PKG-TRANSFER-004"
            const salt = "transferSalt000"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440003"
            const toMSP = "Org1MSP"
            const createdISO = "not-a-valid-date"
            const privateTransferTerms = { price: 100.5 }

            await ctxOmbud.stub.setTransient({ privateTransferTerms })

            await expect(
                c.ProposeTransfer(
                    ctxOmbud as any,
                    externalId,
                    termsId,
                    toMSP,
                    createdISO
                )
            ).rejects.toThrow(
                "Invalid createdISO format — must be an ISO-8601 string."
            )
        })

        it("Should fail if privateTransferTerms is missing from transient data", async () => {
            const externalId = "PKG-TRANSFER-005"
            const salt = "transferSalt111"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440004"
            const toMSP = "Org1MSP"
            const createdISO = new Date().toISOString()

            await expect(
                c.ProposeTransfer(
                    ctxOmbud as any,
                    externalId,
                    termsId,
                    toMSP,
                    createdISO
                )
            ).rejects.toThrow(
                "Missing transient field 'privateTransferTerms' for private transfer terms"
            )
        })
    })
    describe("CheckPackageDetailsAndPIIHash", () => {
        it("Should return true when hash matches", async () => {
            const externalId = "PKG-HASH-001"
            const salt = "hashTestSalt123"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const pkgStr = await c.ReadBlockchainPackage(
                ctxOmbud as any,
                externalId
            )
            const pkg = JSON.parse(pkgStr)
            const expectedHash = pkg.packageDetailsAndPIIHash

            const result = await c.CheckPackageDetailsAndPIIHash(
                ctxOmbud as any,
                externalId,
                expectedHash
            )
            expect(result).toBe(true)
        })

        it("Should return false when hash does not match", async () => {
            const externalId = "PKG-HASH-002"
            const salt = "hashTestSalt456"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const wrongHash =
                "0000000000000000000000000000000000000000000000000000000000000000"

            const result = await c.CheckPackageDetailsAndPIIHash(
                ctxOmbud as any,
                externalId,
                wrongHash
            )
            expect(result).toBe(false)
        })

        it("Should throw error when package does not exist", async () => {
            const externalId = "PKG-NONEXISTENT-HASH"
            const someHash =
                "1111111111111111111111111111111111111111111111111111111111111111"

            await expect(
                c.CheckPackageDetailsAndPIIHash(
                    ctxOmbud as any,
                    externalId,
                    someHash
                )
            ).rejects.toThrow(`The package ${externalId} does not exist`)
        })
    })
    describe("ReadTransferTerms", () => {
        it("Should read public transfer terms after proposing a transfer", async () => {
            const externalId = "PKG-READ-TERMS-001"
            const salt = "readTermsSalt123"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440010"
            const toMSP = "Org1MSP"
            const createdISO = new Date().toISOString()
            const expiryISO = new Date(Date.now() + 86400000).toISOString()
            const privateTransferTerms = { price: 250.75 }

            await ctxOmbud.stub.setTransient({ privateTransferTerms })
            await c.ProposeTransfer(
                ctxOmbud as any,
                externalId,
                termsId,
                toMSP,
                createdISO,
                expiryISO
            )

            const termsStr = await c.ReadTransferTerms(ctxOmbud as any, termsId)
            const terms = JSON.parse(termsStr)

            expect(terms.externalPackageId).toBe(externalId)
            expect(terms.fromMSP).toBe("Org0MSP")
            expect(terms.toMSP).toBe(toMSP)
            expect(terms.createdISO).toBe(createdISO)
            expect(terms.expiryISO).toBe(expiryISO)
        })

        it("Should throw error when transfer terms do not exist", async () => {
            const nonExistentTermsId = "550e8400-e29b-41d4-a716-446655440999"

            await expect(
                c.ReadTransferTerms(ctxOmbud as any, nonExistentTermsId)
            ).rejects.toThrow(
                `The package ${nonExistentTermsId} does not exist`
            )
        })

        it("Should allow any organization to read public transfer terms", async () => {
            const externalId = "PKG-READ-TERMS-002"
            const salt = "readTermsSalt456"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440011"
            const toMSP = "Org1MSP"
            const createdISO = new Date().toISOString()
            const privateTransferTerms = { price: 100 }

            await ctxOmbud.stub.setTransient({ privateTransferTerms })
            await c.ProposeTransfer(
                ctxOmbud as any,
                externalId,
                termsId,
                toMSP,
                createdISO
            )

            const termsAsOmbud = await c.ReadTransferTerms(
                ctxOmbud as any,
                termsId
            )
            expect(JSON.parse(termsAsOmbud).externalPackageId).toBe(externalId)

            ctxOmbud.clientIdentity.setMSP("Org1MSP")
            const termsAsPM3 = await c.ReadTransferTerms(
                ctxOmbud as any,
                termsId
            )
            expect(JSON.parse(termsAsPM3).externalPackageId).toBe(externalId)
        })
    })
    describe("ReadPrivateTransferTerms", () => {
        it("Recipient should be able to read private transfer terms", async () => {
            const externalId = "PKG-PRIVATE-TERMS-001"
            const salt = "privateTermsSalt123"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            // Propose a transfer to Org1MSP
            const termsId = "550e8400-e29b-41d4-a716-446655440020"
            const toMSP = "Org1MSP"
            const createdISO = new Date().toISOString()
            const privateTransferTerms = { price: 999.99 }

            await ctxOmbud.stub.setTransient({ privateTransferTerms })
            await c.ProposeTransfer(
                ctxOmbud as any,
                externalId,
                termsId,
                toMSP,
                createdISO
            )

            ctxOmbud.clientIdentity.setMSP("Org1MSP")

            const privateTermsStr = await c.ReadPrivateTransferTerms(
                ctxOmbud as any,
                termsId
            )
            const privateTerms = JSON.parse(privateTermsStr)

            expect(privateTerms.price).toBe(999.99)
        })

        it("Should fail if caller is not the recipient", async () => {
            const externalId = "PKG-PRIVATE-TERMS-002"
            const salt = "privateTermsSalt456"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440021"
            const toMSP = "Org1MSP"
            const createdISO = new Date().toISOString()
            const privateTransferTerms = { price: 500 }

            await ctxOmbud.stub.setTransient({ privateTransferTerms })
            await c.ProposeTransfer(
                ctxOmbud as any,
                externalId,
                termsId,
                toMSP,
                createdISO
            )

            ctxOmbud.clientIdentity.setMSP("Org2MSP")

            await expect(
                c.ReadPrivateTransferTerms(ctxOmbud as any, termsId)
            ).rejects.toThrow(
                `The caller organization (Org2MSP) is not authorized to read the private details of terms ${termsId} owned by ${toMSP}`
            )
        })

        it("Should fail if transfer terms do not exist", async () => {
            const nonExistentTermsId = "550e8400-e29b-41d4-a716-446655440999"

            await expect(
                c.ReadPrivateTransferTerms(ctxOmbud as any, nonExistentTermsId)
            ).rejects.toThrow(
                `The package ${nonExistentTermsId} does not exist`
            )
        })

        it("Owner (proposer) should not be able to read private terms", async () => {
            const externalId = "PKG-PRIVATE-TERMS-003"
            const salt = "privateTermsSalt789"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440022"
            const toMSP = "Org1MSP"
            const createdISO = new Date().toISOString()
            const privateTransferTerms = { price: 750.25 }

            await ctxOmbud.stub.setTransient({ privateTransferTerms })
            await c.ProposeTransfer(
                ctxOmbud as any,
                externalId,
                termsId,
                toMSP,
                createdISO
            )

            await expect(
                c.ReadPrivateTransferTerms(ctxOmbud as any, termsId)
            ).rejects.toThrow(
                `The caller organization (Org0MSP) is not authorized to read the private details of terms ${termsId} owned by ${toMSP}`
            )
        })
    })
    describe("AcceptTransfer", () => {
        it("Recipient should be able to accept a transfer", async () => {
            const externalId = "PKG-ACCEPT-001"
            const salt = "acceptSalt123"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440030"
            const toMSP = "Org1MSP"
            const createdISO = new Date().toISOString()
            const privateTransferTerms = { price: 500 }

            await ctxOmbud.stub.setTransient({ privateTransferTerms })
            await c.ProposeTransfer(
                ctxOmbud as any,
                externalId,
                termsId,
                toMSP,
                createdISO
            )

            ctxOmbud.clientIdentity.setMSP("Org1MSP")
            await ctxOmbud.stub.setTransient({ privateTransferTerms })

            await c.AcceptTransfer(ctxOmbud as any, externalId, termsId)

            const pkgStr = await c.ReadBlockchainPackage(
                ctxOmbud as any,
                externalId
            )
            const pkg = JSON.parse(pkgStr)
            expect(pkg.status).toBe(Status.READY_FOR_PICKUP)
        })

        it("Should fail if caller is not the recipient", async () => {
            const externalId = "PKG-ACCEPT-002"
            const salt = "acceptSalt456"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440031"
            const toMSP = "Org1MSP"
            const createdISO = new Date().toISOString()
            const privateTransferTerms = { price: 300 }

            await ctxOmbud.stub.setTransient({ privateTransferTerms })
            await c.ProposeTransfer(
                ctxOmbud as any,
                externalId,
                termsId,
                toMSP,
                createdISO
            )

            ctxOmbud.clientIdentity.setMSP("Org2MSP")
            await ctxOmbud.stub.setTransient({ privateTransferTerms })

            await expect(
                c.AcceptTransfer(ctxOmbud as any, externalId, termsId)
            ).rejects.toThrow(
                `The caller organization (Org2MSP) is not authorized to accept terms ${termsId} meant for ${toMSP}`
            )
        })

        it("Should fail if private transfer terms do not match", async () => {
            const externalId = "PKG-ACCEPT-003"
            const salt = "acceptSalt789"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440032"
            const toMSP = "Org1MSP"
            const createdISO = new Date().toISOString()
            const privateTransferTerms = { price: 750 }

            await ctxOmbud.stub.setTransient({ privateTransferTerms })
            await c.ProposeTransfer(
                ctxOmbud as any,
                externalId,
                termsId,
                toMSP,
                createdISO
            )

            ctxOmbud.clientIdentity.setMSP("Org1MSP")
            const wrongPrivateTerms = { price: 999 }
            await ctxOmbud.stub.setTransient({
                privateTransferTerms: wrongPrivateTerms,
            })

            await expect(
                c.AcceptTransfer(ctxOmbud as any, externalId, termsId)
            ).rejects.toThrow(
                `The provided private transfer terms do not match the stored terms for proposalId ${termsId}`
            )
        })

        it("Should fail if termsId does not match the package", async () => {
            const externalId = "PKG-ACCEPT-004"
            const salt = "acceptSalt000"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440033"
            const toMSP = "Org1MSP"
            const createdISO = new Date().toISOString()
            const privateTransferTerms = { price: 200 }

            await ctxOmbud.stub.setTransient({ privateTransferTerms })
            await c.ProposeTransfer(
                ctxOmbud as any,
                externalId,
                termsId,
                toMSP,
                createdISO
            )

            ctxOmbud.clientIdentity.setMSP("Org1MSP")
            await ctxOmbud.stub.setTransient({ privateTransferTerms })

            const wrongExternalId = "PKG-WRONG"

            await expect(
                c.AcceptTransfer(ctxOmbud as any, wrongExternalId, termsId)
            ).rejects.toThrow(
                `The proposalId ${termsId} is not for package ${wrongExternalId}`
            )
        })
    })
    describe("ExecuteTransfer", () => {
        it("Owner should be able to execute a transfer after acceptance", async () => {
            const externalId = "PKG-EXECUTE-001"
            const salt = "executeSalt123"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440040"
            const toMSP = "Org1MSP"
            const createdISO = new Date().toISOString()
            const privateTransferTerms = { price: 400 }

            await ctxOmbud.stub.setTransient({ privateTransferTerms })
            await c.ProposeTransfer(
                ctxOmbud as any,
                externalId,
                termsId,
                toMSP,
                createdISO
            )

            ctxOmbud.clientIdentity.setMSP("Org1MSP")
            await ctxOmbud.stub.setTransient({ privateTransferTerms })
            await c.AcceptTransfer(ctxOmbud as any, externalId, termsId)

            ctxOmbud.clientIdentity.setMSP("Org0MSP")
            const storeObject = { packageDetails, pii, salt }
            await ctxOmbud.stub.setTransient({ storeObject })
            await c.ExecuteTransfer(ctxOmbud as any, externalId, termsId)

            const pkgStr = await c.ReadBlockchainPackage(
                ctxOmbud as any,
                externalId
            )
            const pkg = JSON.parse(pkgStr)
            expect(pkg.ownerOrgMSP).toBe("Org1MSP")
        })

        it("Should fail if caller is not the owner (fromMSP)", async () => {
            const externalId = "PKG-EXECUTE-002"
            const salt = "executeSalt456"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440041"
            const toMSP = "Org1MSP"
            const createdISO = new Date().toISOString()
            const privateTransferTerms = { price: 350 }

            await ctxOmbud.stub.setTransient({ privateTransferTerms })
            await c.ProposeTransfer(
                ctxOmbud as any,
                externalId,
                termsId,
                toMSP,
                createdISO
            )

            ctxOmbud.clientIdentity.setMSP("Org1MSP")
            await ctxOmbud.stub.setTransient({ privateTransferTerms })
            await c.AcceptTransfer(ctxOmbud as any, externalId, termsId)

            ctxOmbud.clientIdentity.setMSP("Org2MSP")
            const storeObject = { packageDetails, pii, salt }
            await ctxOmbud.stub.setTransient({ storeObject })

            await expect(
                c.ExecuteTransfer(ctxOmbud as any, externalId, termsId)
            ).rejects.toThrow(
                `Only the proposer (Org0MSP) may execute the transfer`
            )
        })
    })
})
