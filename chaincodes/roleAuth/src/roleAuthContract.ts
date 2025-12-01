import { Context, Contract, Transaction } from "fabric-contract-api"
import { z } from "zod"
import { getPermissionsKey, Permission, PermissionSchema } from "./roleUtils"

// PM3 MSP identifier used to gate administrative actions
export const PM3_MSPID = "Org1MSP"

export class RoleAuthContract extends Contract {
    /**
     * Get permissions for a specific identity identifier (or the caller when not
     * provided). Returns a JSON string containing the permissions array.
     */
    @Transaction()
    public async getPermissions(
        ctx: Context,
        identityIdentifier?: string
    ): Promise<string> {
        const id = identityIdentifier ?? this.getCallerIdentifier(ctx)
        const data = await ctx.stub.getState(getPermissionsKey(id))
        if (!data || data.length === 0) return JSON.stringify([])
        try {
            const parsed = JSON.parse(data.toString()) as unknown
            // validate stored value before returning; return canonical JSON string
            const validated = z.array(PermissionSchema).parse(parsed)
            return JSON.stringify(validated)
        } catch {
            // on corruption/parse error, return empty array JSON to be safe
            return JSON.stringify([])
        }
    }

    /**
     * Set explicit permissions for an identity. Only callers from the PM3 MSP may
     * update permissions for other identities. This writes the Permission[] into
     * the ledger under a stable key.
     */
    @Transaction()
    public async setPermissions(
        ctx: Context,
        targetIdentityIdentifier: string,
        permissionsJson: string
    ): Promise<void> {
        const callerMsp = ctx.clientIdentity.getMSPID()
        if (callerMsp !== PM3_MSPID) {
            throw new Error(
                `ACCESS DENIED: only PM3 may update permissions, caller MSP is ${callerMsp} and required is ${PM3_MSPID}`
            )
        }

        let permissions: Permission[]
        try {
            const parsed = JSON.parse(permissionsJson)
            permissions = z.array(PermissionSchema).parse(parsed)
        } catch (err: any) {
            throw new Error(
                `Invalid permissions JSON. Expected array of permission strings. ` +
                    `Error: ${err?.message ?? String(err)}`
            )
        }

        await ctx.stub.putState(
            getPermissionsKey(targetIdentityIdentifier),
            Buffer.from(JSON.stringify(permissions))
        )
    }

    /**
     * Grant specific permissions to a target organization.
     * Only PM3 may call this function. This adds permissions to existing ones without removing any.
     *
     * @param ctx - Fabric transaction context
     * @param targetMSP - Target organization's MSP ID (e.g., "Org2MSP")
     * @param permissionsJson - JSON array of permission strings to grant
     * @returns {Promise<void>}
     *
     * @example
     * // Grant package:create permission to Org2MSP
     * await grantPermissionsToOrg(ctx, "Org2MSP", '["package:create"]')
     */
    @Transaction()
    public async grantPermissionsToOrg(
        ctx: Context,
        targetMSP: string,
        permissionsJson: string
    ): Promise<void> {
        const callerMsp = ctx.clientIdentity.getMSPID()
        if (callerMsp !== PM3_MSPID) {
            throw new Error(
                "ACCESS DENIED: only PM3 may grant permissions, caller MSP is" +
                    `${callerMsp}`
            )
        }

        let permissionsToAdd: Permission[]
        try {
            const parsed = JSON.parse(permissionsJson)
            permissionsToAdd = z.array(PermissionSchema).parse(parsed)
        } catch (err: any) {
            throw new Error(
                "Invalid permissions JSON. Expected array of permission strings."
            )
        }

        const TargetMSP = `${targetMSP}`

        const currentPermissionsJson = await this.getPermissions(ctx, TargetMSP)
        const currentPermissions: Permission[] = JSON.parse(
            currentPermissionsJson
        )

        const updatedPermissions = currentPermissions.concat(
            permissionsToAdd.filter(
                (perm) => !currentPermissions.includes(perm)
            )
        )

        console.log(
            `[grantPermissionsToOrg] PM3 granting permissions to ${TargetMSP}: ${JSON.stringify(
                permissionsToAdd
            )}. Updated permissions: ${JSON.stringify(updatedPermissions)}`
        )
        await this.setPermissions(
            ctx,
            TargetMSP,
            JSON.stringify(updatedPermissions)
        )
    }

    /**
     * Remove specific permissions from an organization's identity.
     * Only the PM3 organization is authorized to remove permissions.
     *
     * @param {Context} ctx - Fabric transaction context.
     * @param {string} targetMSP - MSP ID of the target organization.
     * @param {string} permissionsJson - JSON array of permission strings to remove.
     * @returns {Promise<void>}
     * @throws {Error} If the caller is not PM3 or if the permissionsJson is invalid.
     */

    @Transaction()
    public async removePermissionsFromOrg(
        ctx: Context,
        targetMSP: string,
        permissionsJson: string
    ): Promise<void> {
        const callerMsp = ctx.clientIdentity.getMSPID()
        if (callerMsp !== PM3_MSPID) {
            throw new Error(
                "ACCESS DENIED: only PM3 may remove permissions, caller MSP is" +
                    `${callerMsp}`
            )
        }

        let permissionsToRemove: Permission[]
        try {
            const parsed = JSON.parse(permissionsJson)
            permissionsToRemove = z.array(PermissionSchema).parse(parsed)
        } catch (err: any) {
            throw new Error(
                "Invalid permissions JSON. Expected array of permission strings."
            )
        }

        const TargetMSP = `${targetMSP}`

        const currentPermissionsJson = await this.getPermissions(ctx, TargetMSP)
        const currentPermissions: Permission[] = JSON.parse(
            currentPermissionsJson
        )

        const updatedPermissions = currentPermissions.filter(
            (perm) => !permissionsToRemove.includes(perm)
        )

        console.log(
            `[removePermissionsFromOrg] removing permissions from ${TargetMSP}: ${JSON.stringify(
                permissionsToRemove
            )}. Updated permissions: ${JSON.stringify(updatedPermissions)}`
        )

        // Use setPermissions to save the updated permissions
        await this.setPermissions(
            ctx,
            TargetMSP,
            JSON.stringify(updatedPermissions)
        )
    }

    /**
     * Get the caller's identity identifier.
     *
     * @param ctx - Fabric transaction context
     * @returns Identity identifier (MSP ID only, e.g., "Org1MSP")
     */
    @Transaction(false)
    public getCallerIdentifier(ctx: Context): string {
        return `${ctx.clientIdentity.getMSPID()}`
    }

    /**
     * Fetch the caller's permissions from the blockchain.
     * Returns an array of Permission strings that the caller has been granted.
     * Returns an empty array if the caller has no permissions set.
     *
     * @param ctx - Fabric transaction context
     * @returns Array of permissions the caller has
     */
    @Transaction(false)
    public async getCallerPermissions(ctx: Context): Promise<Permission[]> {
        const identityId = this.getCallerIdentifier(ctx)
        const key = getPermissionsKey(identityId)

        console.log(`[getCallerPermissions] Identity ID: ${identityId}`)
        console.log(`[getCallerPermissions] Looking up key: ${key}`)

        const data = await ctx.stub.getState(key)
        console.log(
            `[getCallerPermissions] Data found: ${
                data && data.length > 0 ? "YES" : "NO"
            }`
        )

        if (!data || data.length === 0) {
            console.log(
                `[getCallerPermissions] No permissions found for ${identityId}`
            )
            return []
        }

        console.log(`[getCallerPermissions] Raw data: ${data.toString()}`)

        try {
            const parsed = JSON.parse(data.toString()) as unknown
            console.log(`[getCallerPermissions] Parsed data:`, parsed)
            // Validate the stored value before returning
            const validated = z.array(PermissionSchema).parse(parsed)
            console.log(
                `[getCallerPermissions] Validated permissions:`,
                validated
            )
            return validated
        } catch (err) {
            // On corruption/parse error, return empty array to be safe
            console.log(
                `[getCallerPermissions] Error parsing/validating permissions:`,
                err
            )
            return []
        }
    }

    /**
     * Check if the caller has a specific permission.
     * Convenience wrapper around getCallerPermissions.
     *
     * @param ctx - Fabric transaction context
     * @param permission - The permission to check for
     * @returns true if the caller has the permission, false otherwise
     */
    @Transaction(false)
    public async callerHasPermission(
        ctx: Context,
        permission: Permission
    ): Promise<boolean> {
        const permissions = await this.getCallerPermissions(ctx)
        return permissions.includes(permission)
    }
}
