import { Context, Contract, Info, Returns, Transaction } from "fabric-contract-api"
import stringify from "json-stringify-deterministic"
import sortKeysRecursive from "sort-keys-recursive"
import { PublicPackage, Status } from "./package"

@Info({
    title: "PackageContract",
    description: "Smart contract for trading assets",
})
export class PackageContract extends Contract {
    // CreatePackage issues a new package to the world state with given details.
    // @Transaction()
    // public async CreatePackage(ctx: Context, packageData: PublicPackage): Promise<void> {

    // }

    // ReadPackage returns the package stored in the world state with given id.
    // @Transaction(false)
    // public async ReadPackage(ctx: Context, id: string): Promise<string> {
        
    // }

    @Transaction(false)
    public async UpdatePackageStatus(ctx: Context, id: string, status: Status): Promise<void> {
        
    }

    // DeletePackage deletes an given package from the world state.
    @Transaction()
    public async DeletePackage(ctx: Context, id: string): Promise<void> {

    }

    // PackageExists returns true when package with given ID exists in world state.
    // @Transaction(false)
    // @Returns("boolean")
    // public async PackageExists(ctx: Context, id: string): Promise<boolean> {

    // }

    // ProposeTransfer creates a transfer proposal for an asset to another organization.
    @Transaction(false)
    public async ProposeTransfer(ctx: Context, id: string, toMSP: string, termsHash: string): Promise<void> {
    
    }

    // AcceptTransfer accepts a transfer proposal for an asset from another organization.
    @Transaction()
    async AcceptTransfer(ctx: Context, id: string, fromMSP: string, expectedTermsHash: string): Promise<void> {
    
    }

    // ExecuteTransfer executes a transfer for an asset from one organization to another.
    @Transaction()
    async ExecuteTransfer(ctx: Context, id: string, toMSP: string): Promise<void> {
    
    }
}
