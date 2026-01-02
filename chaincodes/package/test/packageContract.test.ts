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
    propertyKey: string | symbol
) => unknown
type MethodDecorator = (
    target: unknown,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
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
                    descriptor: PropertyDescriptor
                ) =>
                    descriptor,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            Returns:
                () => (target: unknown, propertyKey: string | symbol) => {},
        } as FabricContractAPI
    }
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
                recipientOrgMSP
            )
            const exists = await c.PackageExists(
                ctxOmbud as unknown as Context,
                externalId
            )
            expect(exists).toBe(true)
            const readPkg = await c.ReadPackageDetailsAndPII(
                ctxOmbud as unknown as Context,
                externalId
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
                recipientOrgMSP
            )
            const pkgStr = await c.ReadBlockchainPackage(
                ctxPM3 as unknown as Context,
                externalId
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
                recipientOrgMSP
            )
            const pkgStr = await c.ReadPackageDetailsAndPII(
                ctxTransporter as unknown as Context,
                externalId
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
                recipientOrgMSP
            )

            const pkgStr = await c.ReadBlockchainPackage(
                ctxOmbud as unknown as Context,
                externalId
            )
            const pkg = JSON.parse(pkgStr) as BlockchainPackageType
            pkg.status = Status.PICKED_UP
            await ctxOmbud.stub.putState(
                externalId,
                Buffer.from(JSON.stringify(pkg))
            )

            await c.UpdatePackageStatus(
                ctxOmbud as unknown as Context,
                externalId,
                Status.IN_TRANSIT
            )
            const updatedPkgStr = await c.ReadBlockchainPackage(
                ctxOmbud as unknown as Context,
                externalId
            )
            const updatedPkg = JSON.parse(
                updatedPkgStr
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
                recipientOrgMSP
            )

            await c.UpdatePackageStatus(
                ctxOmbud as unknown as Context,
                externalId,
                Status.FAILED
            )
            const pkgStr = await c.ReadBlockchainPackage(
                ctxOmbud as unknown as Context,
                externalId
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
                recipientOrgMSP
            )
            let exists = await c.PackageExists(
                ctxPM3 as unknown as Context,
                externalId
            )
            expect(exists).toBe(true)
            await c.DeletePackage(ctxPM3 as unknown as Context, externalId)
            exists = await c.PackageExists(
                ctxPM3 as unknown as Context,
                externalId
            )
            expect(exists).toBe(false)
        })
    })
    describe("PackageExists", () => {
        it("Should return false for non-existing package", async () => {
            const externalId = "PKG-999"
            const exists = await c.PackageExists(
                ctxOmbud as unknown as Context,
                externalId
            )
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
            const expiryISO = new Date(Date.now() + 86400000).toISOString()
            const transferTerms = {
                externalPackageId: externalId,
                fromMSP: "Org0MSP",
                toMSP: toMSP,
                expiryISO: expiryISO,
                price: 100.5,
                salt: "termsSalt123",
            }

            await ctxOmbud.stub.setTransient({ transferTerms })

            await c.ProposeTransfer(ctxOmbud as any, externalId, termsId)

            const proposalStr = await c.ReadPublicProposal(
                ctxOmbud as any,
                externalId,
                termsId
            )
            const proposal = JSON.parse(proposalStr)
            expect(proposal.externalId).toBe(externalId)
            expect(proposal.termsId).toBe(termsId)
            expect(proposal.toMSP).toBe(toMSP)
            expect(proposal.status).toBe("active")
        })

        it("Should fail if package does not exist", async () => {
            const externalId = "PKG-NONEXISTENT"
            const termsId = "550e8400-e29b-41d4-a716-446655440001"
            const toMSP = "Org1MSP"
            const transferTerms = {
                externalPackageId: externalId,
                fromMSP: "Org0MSP",
                toMSP: toMSP,
                expiryISO: null,
                price: 100.5,
                salt: "termsSalt456",
            }

            await ctxOmbud.stub.setTransient({ transferTerms })

            await expect(
                c.ProposeTransfer(ctxOmbud as any, externalId, termsId)
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
            const transferTerms = {
                externalPackageId: externalId,
                fromMSP: "Org1MSP",
                toMSP: toMSP,
                expiryISO: null,
                price: 100.5,
                salt: "termsSalt789",
            }

            await ctxOmbud.stub.setTransient({ transferTerms })

            await expect(
                c.ProposeTransfer(ctxOmbud as any, externalId, termsId)
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
            const transferTerms = {
                externalPackageId: externalId,
                fromMSP: "Org0MSP",
                toMSP: toMSP,
                expiryISO: null,
                price: 100.5,
                salt: "termsSalt000",
            }

            await ctxOmbud.stub.setTransient({ transferTerms })

            await expect(
                c.ProposeTransfer(ctxOmbud as any, externalId, termsId)
            ).rejects.toThrow("Invalid termsId format — must be a UUID string.")
        })

        it("Should fail if privateTransferTerms is missing from transient data", async () => {
            const externalId = "PKG-TRANSFER-005"
            const salt = "transferSalt111"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440004"

            await expect(
                c.ProposeTransfer(ctxOmbud as any, externalId, termsId)
            ).rejects.toThrow(
                "Missing transient field 'transferTerms' for transfer terms"
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
            const expiryISO = new Date(Date.now() + 86400000).toISOString()
            const transferTerms = {
                externalPackageId: externalId,
                fromMSP: "Org0MSP",
                toMSP: toMSP,
                expiryISO: expiryISO,
                price: 250.75,
                salt: "termsSalt222",
            }

            await ctxOmbud.stub.setTransient({ transferTerms })
            await c.ProposeTransfer(ctxOmbud as any, externalId, termsId)

            const proposalStr = await c.ReadPublicProposal(
                ctxOmbud as any,
                externalId,
                termsId
            )
            const proposal = JSON.parse(proposalStr)

            expect(proposal.externalId).toBe(externalId)
            expect(proposal.termsId).toBe(termsId)
            expect(proposal.toMSP).toBe(toMSP)
            expect(proposal.status).toBe("active")
        })

        it("Should throw error when transfer terms do not exist", async () => {
            const nonExistentTermsId = "550e8400-e29b-41d4-a716-446655440999"
            const nonExistentExternalId = "PKG-NONEXISTENT"

            await expect(
                c.ReadPublicProposal(
                    ctxOmbud as any,
                    nonExistentExternalId,
                    nonExistentTermsId
                )
            ).rejects.toThrow(
                `The transfer terms ${nonExistentTermsId} for package ${nonExistentExternalId} do not exist on the ledger`
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
            const transferTerms = {
                externalPackageId: externalId,
                fromMSP: "Org0MSP",
                toMSP: toMSP,
                expiryISO: null,
                price: 100,
                salt: "termsSalt333",
            }

            await ctxOmbud.stub.setTransient({ transferTerms })
            await c.ProposeTransfer(ctxOmbud as any, externalId, termsId)

            const proposalAsOmbud = await c.ReadPublicProposal(
                ctxOmbud as any,
                externalId,
                termsId
            )
            expect(JSON.parse(proposalAsOmbud).externalId).toBe(externalId)

            ctxOmbud.clientIdentity.setMSP("Org1MSP")
            const proposalAsPM3 = await c.ReadPublicProposal(
                ctxOmbud as any,
                externalId,
                termsId
            )
            expect(JSON.parse(proposalAsPM3).externalId).toBe(externalId)
        })
    })
    describe("ReadPrivateTransferTerms", () => {
        it("Recipient should be able to read private transfer terms", async () => {
            const externalId = "PKG-PRIVATE-TERMS-001"
            const salt = "privateTermsSalt123"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440020"
            const toMSP = "Org1MSP"
            const transferTerms = {
                externalPackageId: externalId,
                fromMSP: "Org0MSP",
                toMSP: toMSP,
                expiryISO: null,
                price: 999.99,
                salt: "termsSalt444",
            }

            await ctxOmbud.stub.setTransient({ transferTerms })
            await c.ProposeTransfer(ctxOmbud as any, externalId, termsId)

            ctxOmbud.clientIdentity.setMSP("Org1MSP")

            const privateTermsStr = await c.ReadPrivateTransferTerms(
                ctxOmbud as any,
                externalId,
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
            const transferTerms = {
                externalPackageId: externalId,
                fromMSP: "Org0MSP",
                toMSP: toMSP,
                expiryISO: null,
                price: 500,
                salt: "termsSalt555",
            }

            await ctxOmbud.stub.setTransient({ transferTerms })
            await c.ProposeTransfer(ctxOmbud as any, externalId, termsId)

            ctxOmbud.clientIdentity.setMSP("Org2MSP")

            await expect(
                c.ReadPrivateTransferTerms(ctxOmbud as any, externalId, termsId)
            ).rejects.toThrow(
                `The transfer terms ${termsId} for package ${externalId} do not exist in Org2MSP's collection`
            )
        })

        it("Should fail if transfer terms do not exist", async () => {
            const nonExistentTermsId = "550e8400-e29b-41d4-a716-446655440999"
            const nonExistentExternalId = "PKG-NONEXISTENT"

            await expect(
                c.ReadPrivateTransferTerms(
                    ctxOmbud as any,
                    nonExistentExternalId,
                    nonExistentTermsId
                )
            ).rejects.toThrow()
        })

        it("Owner (proposer) should not be able to read private terms", async () => {
            const externalId = "PKG-PRIVATE-TERMS-003"
            const salt = "privateTermsSalt789"
            const recipientOrgMSP = "Org2MSP"
            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440022"
            const toMSP = "Org1MSP"
            const transferTerms = {
                externalPackageId: externalId,
                fromMSP: "Org0MSP",
                toMSP: toMSP,
                expiryISO: null,
                price: 750.25,
                salt: "termsSalt666",
            }

            await ctxOmbud.stub.setTransient({ transferTerms })
            await c.ProposeTransfer(ctxOmbud as any, externalId, termsId)

            await expect(
                c.ReadPrivateTransferTerms(ctxOmbud as any, externalId, termsId)
            ).rejects.toThrow(
                `The transfer terms ${termsId} for package ${externalId} do not exist in Org0MSP's collection`
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
            const transferTerms = {
                externalPackageId: externalId,
                fromMSP: "Org0MSP",
                toMSP: toMSP,
                expiryISO: null,
                price: 500,
                salt: "termsSalt777",
            }

            await ctxOmbud.stub.setTransient({ transferTerms })
            await c.ProposeTransfer(ctxOmbud as any, externalId, termsId)

            await c.UpdateStatusAfterPropose(
                ctxOmbud as any,
                externalId,
                termsId,
                toMSP,
                new Date().toISOString()
            )

            ctxOmbud.clientIdentity.setMSP("Org1MSP")
            await ctxOmbud.stub.setTransient({ transferTerms })

            await c.AcceptTransfer(ctxOmbud as any, externalId, termsId)

            await c.UpdateStatusAfterAccept(
                ctxOmbud as any,
                externalId,
                termsId
            )

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
            const transferTerms = {
                externalPackageId: externalId,
                fromMSP: "Org0MSP",
                toMSP: toMSP,
                expiryISO: null,
                price: 300,
                salt: "termsSalt888",
            }

            await ctxOmbud.stub.setTransient({ transferTerms })
            await c.ProposeTransfer(ctxOmbud as any, externalId, termsId)

            ctxOmbud.clientIdentity.setMSP("Org2MSP")
            await ctxOmbud.stub.setTransient({ transferTerms })

            await expect(
                c.AcceptTransfer(ctxOmbud as any, externalId, termsId)
            ).rejects.toThrow(
                `The caller organization (Org2MSP) is not authorized to accept proposal ${termsId} meant for ${toMSP}`
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
            const transferTerms = {
                externalPackageId: externalId,
                fromMSP: "Org0MSP",
                toMSP: toMSP,
                expiryISO: null,
                price: 750,
                salt: "termsSalt999",
            }

            await ctxOmbud.stub.setTransient({ transferTerms })
            await c.ProposeTransfer(ctxOmbud as any, externalId, termsId)

            ctxOmbud.clientIdentity.setMSP("Org1MSP")
            const wrongTransferTerms = {
                ...transferTerms,
                price: 999,
            }
            await ctxOmbud.stub.setTransient({
                transferTerms: wrongTransferTerms,
            })

            await expect(
                c.AcceptTransfer(ctxOmbud as any, externalId, termsId)
            ).rejects.toThrow(
                `The transfer terms provided do not match the original proposal for termsId ${termsId} and package ${externalId}`
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
            const transferTerms = {
                externalPackageId: externalId,
                fromMSP: "Org0MSP",
                toMSP: toMSP,
                expiryISO: null,
                price: 200,
                salt: "termsSaltABC",
            }

            await ctxOmbud.stub.setTransient({ transferTerms })
            await c.ProposeTransfer(ctxOmbud as any, externalId, termsId)

            ctxOmbud.clientIdentity.setMSP("Org1MSP")
            await ctxOmbud.stub.setTransient({ transferTerms })

            const wrongExternalId = "PKG-WRONG"

            await expect(
                c.AcceptTransfer(ctxOmbud as any, wrongExternalId, termsId)
            ).rejects.toThrow(
                `The termsId ${termsId} is not for package ${wrongExternalId}`
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
            const transferTerms = {
                externalPackageId: externalId,
                fromMSP: "Org0MSP",
                toMSP: toMSP,
                expiryISO: null,
                price: 400,
                salt: "termsSaltDDD",
            }

            await ctxOmbud.stub.setTransient({ transferTerms })
            await c.ProposeTransfer(ctxOmbud as any, externalId, termsId)

            ctxOmbud.clientIdentity.setMSP("Org1MSP")
            await ctxOmbud.stub.setTransient({ transferTerms })
            await c.AcceptTransfer(ctxOmbud as any, externalId, termsId)

            ctxOmbud.clientIdentity.setMSP("Org0MSP")
            const storeObject = { packageDetails, pii, salt }
            await ctxOmbud.stub.setTransient({ storeObject })
            await c.ExecuteTransfer(ctxOmbud as any, externalId, termsId, toMSP)

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
            const transferTerms = {
                externalPackageId: externalId,
                fromMSP: "Org0MSP",
                toMSP: toMSP,
                expiryISO: null,
                price: 350,
                salt: "termsSaltEEE",
            }

            await ctxOmbud.stub.setTransient({ transferTerms })
            await c.ProposeTransfer(ctxOmbud as any, externalId, termsId)

            ctxOmbud.clientIdentity.setMSP("Org1MSP")
            await ctxOmbud.stub.setTransient({ transferTerms })
            await c.AcceptTransfer(ctxOmbud as any, externalId, termsId)

            ctxOmbud.clientIdentity.setMSP("Org2MSP")
            const storeObject = { packageDetails, pii, salt }
            await ctxOmbud.stub.setTransient({ storeObject })

            await expect(
                c.ExecuteTransfer(ctxOmbud as any, externalId, termsId, toMSP)
            ).rejects.toThrow(`Package ${externalId} is not owned by Org2MSP`)
        })
    })

    describe("TransferToPM3", () => {
        it("Should transfer a delivered package to PM3", async () => {
            const externalId = "PKG-PM3-001"
            const salt = "pm3Salt123"
            const recipientOrgMSP = "Org2MSP"

            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440099"
            const transferTerms = {
                externalPackageId: externalId,
                fromMSP: "Org0MSP",
                toMSP: recipientOrgMSP,
                expiryISO: null,
                price: 500,
                salt: "pm3TermsSalt",
            }

            await ctxOmbud.stub.setTransient({ transferTerms })
            await c.ProposeTransfer(ctxOmbud as any, externalId, termsId)

            ctxOmbud.clientIdentity.setMSP("Org2MSP")
            await ctxOmbud.stub.setTransient({ transferTerms })
            await c.AcceptTransfer(ctxOmbud as any, externalId, termsId)

            ctxOmbud.clientIdentity.setMSP("Org0MSP")
            const storeObject = { packageDetails, pii, salt }
            await ctxOmbud.stub.setTransient({ storeObject })
            await c.ExecuteTransfer(
                ctxOmbud as any,
                externalId,
                termsId,
                recipientOrgMSP
            )

            ctxOmbud.clientIdentity.setMSP("Org2MSP")
            await c.TransferToPM3(ctxOmbud as any, externalId)

            const pkgStr = await c.ReadBlockchainPackage(
                ctxOmbud as any,
                externalId
            )
            const pkg = JSON.parse(pkgStr)
            expect(pkg.ownerOrgMSP).toBe("Org1MSP")
            expect(pkg.status).toBe(Status.SUCCEEDED)
        })

        it("Should fail if package does not exist", async () => {
            const nonExistentId = "PKG-NONEXISTENT-PM3"

            await expect(
                c.TransferToPM3(ctxOmbud as any, nonExistentId)
            ).rejects.toThrow(`The package ${nonExistentId} does not exist`)
        })

        it("Should fail if caller is not the owner", async () => {
            const externalId = "PKG-PM3-002"
            const salt = "pm3Salt456"
            const recipientOrgMSP = "Org2MSP"

            await ctxOmbud.stub.setTransient({ packageDetails, pii, salt })
            await c.CreatePackage(ctxOmbud as any, externalId, recipientOrgMSP)

            const termsId = "550e8400-e29b-41d4-a716-446655440088"
            const transferTerms = {
                externalPackageId: externalId,
                fromMSP: "Org0MSP",
                toMSP: recipientOrgMSP,
                expiryISO: null,
                price: 500,
                salt: "pm3TermsSalt2",
            }

            await ctxOmbud.stub.setTransient({ transferTerms })
            await c.ProposeTransfer(ctxOmbud as any, externalId, termsId)

            ctxOmbud.clientIdentity.setMSP("Org2MSP")
            await ctxOmbud.stub.setTransient({ transferTerms })
            await c.AcceptTransfer(ctxOmbud as any, externalId, termsId)

            ctxOmbud.clientIdentity.setMSP("Org0MSP")
            const storeObject = { packageDetails, pii, salt }
            await ctxOmbud.stub.setTransient({ storeObject })
            await c.ExecuteTransfer(
                ctxOmbud as any,
                externalId,
                termsId,
                recipientOrgMSP
            )

            ctxOmbud.clientIdentity.setMSP("Org0MSP")

            await expect(
                c.TransferToPM3(ctxOmbud as any, externalId)
            ).rejects.toThrow(
                `Only the owner organization may transfer the package ${externalId} to PM3`
            )
        })

        it("Should fail if package is not in DELIVERED status", async () => {
            const externalId = "PKG-PM3-004"
            const salt = "pm3Salt000"
            const recipientOrgMSP = "Org2MSP"

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

            await expect(
                c.TransferToPM3(ctxTransporter as any, externalId)
            ).rejects.toThrow(
                `The package ${externalId} must be in DELIVERED status to transfer to PM3`
            )
        })
    })
})
