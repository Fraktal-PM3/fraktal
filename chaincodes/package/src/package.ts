import { Object, Property } from "fabric-contract-api"

export type Size = {
    width: number
    height: number
    depth: number
}

export type Location = {
    name: string
    address: string
    lat: number
    lng: number
}

export enum Urgency {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    NONE = "none",
}

export enum Status {
    PENDING = "pending",
    READY_FOR_PICKUP = "ready_for_pickup",
    PICKED_UP = "picked_up",
    IN_TRANSIT = "in_transit",
    DELIVERED = "delivered",
    SUCCEEDED = "succeeded",
    FAILED = "failed",
}

export enum TransferStatus {
    PROPOSED = "proposed",
    ACCEPTED = "accepted",
    EXECUTED = "executed",
    CANCELLED = "cancelled",
    REJECTED = "rejected",
    EXPIRED = "expired",
}

export type PackagePII = { [key: string]: any }

export type PrivateTransferTerms = {
    price: number
}

export type TransferTerms = {
    externalPackageId: string
    fromMSP: string
    toMSP: string
    createdISO: string
    expiryISO: string | null | undefined
}

export type Transfer = {
    terms: TransferTerms
    status: TransferStatus
    transferTermsHash: string
}


export type PackageDetails = {
    pickupLocation: Location
    dropLocation: Location
    address: string
    size: Size
    weightKg: number
    urgency: Urgency
}

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

