// import { createHash } from "crypto"
// import stringify from "json-stringify-deterministic"
// import sortKeysRecursive from "sort-keys-recursive"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { PackageContract } from "../src/packageContract"
import { MockContext } from "./helpers/mockContext"
import { PublicPackage, PrivatePackage, Status, Urgency } from "../src/package"

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

const CreatePackage = (
    contract: PackageContract,
    ctx: MockContext,
    packageData: PublicPackage
) => {
    // @ts-ignore
    return contract.CreatePackage(ctx, packageData)
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

    describe("Package Creation tests", () => {
        describe("Ombud role", () => {
            it("should create package", async () => {
                // input only needs id; contract fills the rest
                const packageData: PublicPackage = { id: "pkg1" } as any
                await CreatePackage(c, ctxOmbud, packageData)

                // duplicate id fails -- move this to separate test
                const packageDataDuplicate: PublicPackage = {
                    id: "pkg1",
                } as any
                await CreatePackage(c, ctxOmbud, packageDataDuplicate).catch(
                    (err) => {
                        expect(err.message).toBe(
                            "The package pkg1 already exists"
                        )
                    }
                )

                // Since createPackage returns void, we check state change and world state and event emission

                // world state written?
                const buf = await ctxOmbud.stub.getState("pkg1")
                expect(buf.length).toBeGreaterThan(0)

                // basic shape checks from contract behavior
                const stored = JSON.parse(buf.toString())
                expect(stored.id).toBe("pkg1")
                expect(stored.status).toBe(Status.PENDING) // contract sets PENDING
                expect(stored.ownerOrgMSP).toBe("Org0MSP") // caller MSP from ctxOmbud
                expect(typeof stored.dataHash).toBe("string")
                expect(stored.dataHash.length).toBeGreaterThan(0)

                // optional: event emitted
                const ev = ctxOmbud.stub.events.at(-1)
                expect(ev?.name).toBe("CreatePackage")

                // Check role?
                expect(ctxOmbud.clientIdentity.getAttributeValue("role")).toBe(
                    "ombud"
                )
            })

            it("should fail to create package with missing PII", async () => {
                const ctxOmbudNoPii = new MockContext({
                    mspId: "Org0MSP",
                    attrs: { role: "ombud" },
                    transient: {}, // no pii
                })
                const packageData: PublicPackage = { id: "pkg-no-pii" } as any
                await CreatePackage(c, ctxOmbudNoPii, packageData).catch(
                    (err) => {
                        expect(err.message).toBe(
                            "Missing transient field 'pii' (must be JSON of PrivatePackage)"
                        )
                    }
                )
            })
            it("should fail when pii is invalid JSON", async () => {
                const ctxOmbudInvalidPii = new MockContext({
                    mspId: "Org0MSP",
                    attrs: { role: "ombud" },
                    transient: { pii: "invalid-json" }, // invalid JSON
                })
                const packageData: PublicPackage = {
                    id: "pkg-invalid-json",
                } as any
                await expect(
                    CreatePackage(c, ctxOmbudInvalidPii, packageData)
                ).rejects.toThrow(/Invalid JSON format|not valid JSON/i) // Cant be too specific due to JSON.parse error messages varying
            })
        })
        describe("PM3 role", () => {
            it("PM3 should fail to create package", async () => {
                const packageData: PublicPackage = { id: "pkg2" } as any
                await CreatePackage(c, ctxPM3, packageData).catch((err) => {
                    expect(err.message).toBe(
                        "The caller is not authorized to issue packages"
                    )
                })
            })
        })

        describe("transporter role", () => {
            it("transporter should fail to create package", async () => {
                const packageData: PublicPackage = { id: "pkg3" } as any
                await CreatePackage(c, ctxTransporter, packageData).catch(
                    (err) => {
                        expect(err.message).toBe(
                            "The caller is not authorized to issue packages"
                        )
                    }
                )
            })
        })
    })

    describe("Package update tests", () => {
        describe("Ombud role", () => {
            it("should update package status", async () => {
                const packageData: PublicPackage = { id: "pkg-update" } as any
                await CreatePackage(c, ctxOmbud, packageData)
                const createdBuf = await ctxOmbud.stub.getState("pkg-update")
                const created = JSON.parse(createdBuf.toString())
                expect(created.ownerOrgMSP).toBe("Org0MSP")
                expect(created.status).toBe(Status.PENDING)

                // prettier-ignore
                await UpdatePackageStatus(c, ctxOmbud, "pkg-update", Status.READY_FOR_PICKUP)
                const updatedBuf = await ctxOmbud.stub.getState("pkg-update")
                const updated = JSON.parse(updatedBuf.toString())
                expect(updated.status).toBe(Status.READY_FOR_PICKUP)
                expect(updated.ownerOrgMSP).toBe("Org0MSP") // still same owner
            })
            it("should reject update package status when not authorized", async () => {
                // prettier-ignore
                const packageData: PublicPackage = { id: "pkg-update-noauth" } as any
                await CreatePackage(c, ctxOmbud, packageData)
                // Make both contexts share the same in-memory ledger
                // @ts-ignore
                ctxPM3.stub = ctxOmbud.stub
                // prettier-ignore
                await expect(
                    UpdatePackageStatus(c, ctxPM3, "pkg-update-noauth", Status.READY_FOR_PICKUP)
                ).rejects.toThrow(/The caller is not authorized to update the package/)
            })
        })
        describe.skip("PM3 role", () => {
            // cant actually test this since we have to transfer ownership status inorder for PM3 to update to succeded
            it("PM3 should sucessfully update package status to succeded", async () => {
                // prettier-ignore
                const packageData: PublicPackage = { id: "pkg-update-pm3" } as any
                await CreatePackage(c, ctxOmbud, packageData)
                // ts-ignore
                ctxPM3.stub = ctxOmbud.stub // share ledger
                // prettier-ignore
                await UpdatePackageStatus(c, ctxOmbud, "pkg-update-pm3", Status.READY_FOR_PICKUP)
                // prettier-ignore
                await UpdatePackageStatus(c, ctxOmbud, "pkg-update-pm3", Status.PICKED_UP)
                // prettier-ignore
                await UpdatePackageStatus(c, ctxOmbud, "pkg-update-pm3", Status.IN_TRANSIT)
                // prettier-ignore
                await UpdatePackageStatus(c, ctxOmbud, "pkg-update-pm3", Status.DELIVERED)
                // prettier-ignore
                await UpdatePackageStatus(c, ctxPM3, "pkg-update-pm3", Status.SUCCEEDED)
            })
        })

        describe.skip("transporter role", () => {})
    })

    describe.skip("Delete package tests", () => {
        describe.skip("Ombud role", () => {})
        describe.skip("PM3 role", () => {})
        describe.skip("transporter role", () => {})
    })
    describe.skip("Propose transfer tests", () => {
        describe.skip("Ombud role", () => {})
        describe.skip("PM3 role", () => {})
        describe.skip("transporter role", () => {})
    })
    describe.skip("Accept transfer tests", () => {
        describe.skip("Ombud role", () => {})
        describe.skip("PM3 role", () => {})
        describe.skip("transporter role", () => {})
    })
})
