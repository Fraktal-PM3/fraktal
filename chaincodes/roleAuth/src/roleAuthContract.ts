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
     * Only PM3 may call this function. This allows granular permission management.
     *
     * @param ctx - Fabric transaction context
     * @param targetMSP - Target organization's MSP ID (e.g., "Org2MSP")
     * @param permissionsJson - JSON array of permission strings to grant
     * @returns {Promise<void>}
     *
     * @example
     * // Grant package read permissions to Org2MSP
     * await grantPermissionsToOrg(ctx, "Org2MSP", '["package:read"]')
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
                `ACCESS DENIED: only PM3 may grant permissions, caller MSP is ${callerMsp}`
            )
        }

        // Validate permissions input
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

        // Construct the target identity identifier
        const targetIdentityIdentifier = `${targetMSP}`

        console.log(
            `[grantPermissionsToOrg] PM3 granting permissions to ${targetIdentityIdentifier}: ${JSON.stringify(
                permissions
            )}`
        )

        await ctx.stub.putState(
            getPermissionsKey(targetIdentityIdentifier),
            Buffer.from(JSON.stringify(permissions))
        )
    }

    /**
     * Revoke all permissions from a target organization.
     * Only PM3 may call this function.
     *
     * @param ctx - Fabric transaction context
     * @param targetMSP - Target organization's MSP ID
     * @returns {Promise<void>}
     */
    @Transaction()
    public async revokePermissionsFromOrg(
        ctx: Context,
        targetMSP: string
    ): Promise<void> {
        const callerMsp = ctx.clientIdentity.getMSPID()
        if (callerMsp !== PM3_MSPID) {
            throw new Error(
                `ACCESS DENIED: only PM3 may revoke permissions, caller MSP is ${callerMsp}`
            )
        }

        const targetIdentityIdentifier = `${targetMSP}`

        console.log(
            `[revokePermissionsFromOrg] PM3 revoking all permissions from ${targetIdentityIdentifier}`
        )

        // Delete the permissions entry (effectively setting to empty array)
        await ctx.stub.deleteState(getPermissionsKey(targetIdentityIdentifier))
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

        const data = await ctx.stub.getState(key)
        if (!data || data.length === 0) {
            return []
        }

        try {
            const parsed = JSON.parse(data.toString()) as unknown
            // Validate the stored value before returning
            const validated = z.array(PermissionSchema).parse(parsed)
            return validated
        } catch {
            // On corruption/parse error, return empty array to be safe
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
