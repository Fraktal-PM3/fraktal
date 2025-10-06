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
    BROADCASTED = "broadcasted",
    PICKED_UP = "picked_up",
    IN_TRANSIT = "in_transit",
    DELIVERED = "delivered",
    SUCCEEDED = "succeeded",
    FAILED = "failed",
}

export type TransferTerms = {
    id: string
    fromMSP: string
    toMSP: string
    // No PII here either, just the business fields needed for consent:
    price?: number
    conditions?: string
    expiry?: string // ISO
    termsHash: string // hash of the exact terms or full doc sections as needed
    salt: string
}

export type PrivatePackage = {
    pickupLocation: Location
    dropLocation: Location
    address: string
    size: Size
    weightKg: number
    urgency: Urgency
}

@Object()
export class PublicPackage {
    @Property()
    public id: string = ""

    @Property()
    public ownerOrgMSP: string = ""

    @Property()
    public status: Status = Status.PENDING

    @Property()
    public dataHash: string = ""

}

