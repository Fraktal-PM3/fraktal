import { type Contract } from "fabric-contract-api"
import { RoleAuthContract } from "./roleAuthContract"
export const contracts: (typeof Contract)[] = [RoleAuthContract]
