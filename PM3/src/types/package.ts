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

export interface PrivatePackage {
    id: string
    pickupLocation: Location
    dropLocation: Location
    address: string
    size: Size
    weightKg: number
    urgency: Urgency
}
