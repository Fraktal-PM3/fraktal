import { Object, Property } from "fabric-contract-api"
import z from "zod"

export enum Status {
    PENDING = "pending",
    READY_FOR_PICKUP = "ready_for_pickup",
    PICKED_UP = "picked_up",
    IN_TRANSIT = "in_transit",
    DELIVERED = "delivered",
    SUCCEEDED = "succeeded",
    FAILED = "failed",
    PROPOSED = "proposed",
}

export enum Urgency {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    NONE = "none",
}

export enum TransferStatus {
    PROPOSED = "proposed",
    ACCEPTED = "accepted",
    EXECUTED = "executed",
    CANCELLED = "cancelled",
    REJECTED = "rejected",
    EXPIRED = "expired",
}

export const StatusEnumSchema = z.enum(Status)
export const UrgencyEnumSchema = z.enum(Urgency)
export const TransferStatusEnumSchema = z.enum(TransferStatus)

export const SizeSchema = z
    .object({
        width: z.number().positive(),
        height: z.number().positive(),
        depth: z.number().positive(),
    })
    .strict()

export const LocationSchema = z
    .object({
        address: z.string().nonempty(),
        lat: z.number().optional(),
        lng: z.number().optional(),
    })
    .strict()

export const PackageDetailsSchema = z
    .object({
        pickupLocation: LocationSchema,
        dropLocation: LocationSchema,
        size: SizeSchema,
        weightKg: z.number().positive(),
        urgency: UrgencyEnumSchema,
    })
    .strict()

export const TransferTermsSchema = z
    .object({
        externalPackageId: z.string().nonempty(),
        fromMSP: z.string().nonempty(),
        toMSP: z.string().nonempty(),
        createdISO: z.iso.datetime(),
        expiryISO: z.iso.datetime().nullable().optional(),
    })
    .strict()

export const TransferSchema = z
    .object({
        terms: TransferTermsSchema,
        status: TransferStatusEnumSchema,
        transferTermsHash: z.hash("sha256"),
    })
    .strict()

export const PrivateTransferTermsSchema = z
    .object({
        price: z.number().nonnegative(),
    })
    .strict()

export const PackagePIISchema = z.record(z.string(), z.any())

export const BlockchainPackageSchema = z
    .object({
        externalId: z.string().nonempty(),
        ownerOrgMSP: z.string().nonempty(),
        status: StatusEnumSchema,
        packageDetailsAndPIIHash: z.hash("sha256"),
    })
    .strict()

export const StoreObjectSchema = z.object({
    salt: z.string().nonempty(),
    pii: PackagePIISchema,
    packageDetails: PackageDetailsSchema,
})

export type Size = z.infer<typeof SizeSchema>
export type Location = z.infer<typeof LocationSchema>
export type PackageDetails = z.infer<typeof PackageDetailsSchema>
export type TransferTerms = z.infer<typeof TransferTermsSchema>
export type Transfer = z.infer<typeof TransferSchema>
export type PrivateTransferTerms = z.infer<typeof PrivateTransferTermsSchema>
export type PackagePII = z.infer<typeof PackagePIISchema>
export type BlockchainPackageType = z.infer<typeof BlockchainPackageSchema>

@Object()
export class BlockchainPackage {
    @Property()
    public externalId: string = ""

    @Property()
    public ownerOrgMSP: string = ""

    @Property()
    public status: Status = Status.PENDING

    @Property()
    public packageDetailsHash: string = ""
}
