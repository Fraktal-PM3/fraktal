import { type Contract } from "fabric-contract-api"
import { PackageContract } from "./packageContract"
export const contracts: (typeof Contract)[] = [PackageContract]
