
import { Context, Contract, Transaction } from 'fabric-contract-api'
import { z } from 'zod'
import { getPermissionsKey, Permission, PermissionSchema } from './roleUtils'


/**
 * Extract the caller's role from the Fabric identity attributes.
 *
 * This function expects a certificate attribute named `role` containing a
 * single canonical role name (e.g. `pm3`). If the attribute is missing or the
 * value does not match a canonical role the function returns `null`.
 *
 * If you intend to allow multiple roles per identity, update this helper to
 * parse CSV/JSON and validate each element with `RoleSchema`.
 *
 * @param ctx - Fabric transaction context
 * @returns the caller's Role or `null` when unavailable/invalid
 *
 * @example
 * const role = callerRoleFromAttrs(ctx)
 * if (!role) throw new Error('missing role attribute')
 */

// PM3 MSP identifier used to gate administrative actions
export const PM3_MSPID = "Org1MSP"

export class RoleAuthContract extends Contract {

    // helper methods are not chaincode transactions; keep them private
    private permissionsKey(identityId: string): string {
        return `roleauth:perms:${identityId}`
    }

    private identityIdentifierFromCtx(ctx: Context): string {
        // Use MSPID + client id to form a unique identifier. getID() returns the
        // Fabric certificate principal string (suitable as a stable identifier).
        return `${ctx.clientIdentity.getMSPID()}:${ctx.clientIdentity.getID()}`
    }

    /**
     * Get permissions for a specific identity identifier (or the caller when not
     * provided). Returns an empty array when no explicit permissions are set.
     */


    @Transaction()
    public async getPermissions(
        ctx: Context,
        identityIdentifier?: string,
    ): Promise<string> {
        const id = identityIdentifier ?? this.identityIdentifierFromCtx(ctx)
        const data = await ctx.stub.getState(this.permissionsKey(id))
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
        permissionsJson: string,
    ): Promise<void> {
        const callerMsp = ctx.clientIdentity.getMSPID()
        if (callerMsp !== PM3_MSPID) {
            throw new Error(`ACCESS DENIED: only PM3 may update permissions, caller MSP is ${callerMsp} and required is ${PM3_MSPID}`)
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

        await ctx.stub.putState(this.permissionsKey(targetIdentityIdentifier), Buffer.from(JSON.stringify(permissions)))
    }

    /**
     * Grant specific permissions to a target organization.
     * Only PM3 may call this function. This allows granular permission management.
     *
     * @param ctx - Fabric transaction context
     * @param targetMSP - Target organization's MSP ID (e.g., "Org2MSP")
     * @param targetCertId - Target user's certificate ID (the result of getID())
     * @param permissionsJson - JSON array of permission strings to grant
     * @returns {Promise<void>}
     *
     * @example
     * // Grant package read permissions to Org2MSP user
     * await grantPermissionsToOrg(ctx, "Org2MSP", "x509::CN=user1...", '["package:read"]')
     */
    @Transaction()
    public async grantPermissionsToOrg(
        ctx: Context,
        targetMSP: string,
        targetCertId: string,
        permissionsJson: string,
    ): Promise<void> {
        const callerMsp = ctx.clientIdentity.getMSPID()
        if (callerMsp !== PM3_MSPID) {
            throw new Error(`ACCESS DENIED: only PM3 may grant permissions, caller MSP is ${callerMsp}`)
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
        const targetIdentityIdentifier = `${targetMSP}:${targetCertId}`

        console.log(
            `[grantPermissionsToOrg] PM3 granting permissions to ${targetIdentityIdentifier}: ${JSON.stringify(permissions)}`
        )

        await ctx.stub.putState(
            this.permissionsKey(targetIdentityIdentifier),
            Buffer.from(JSON.stringify(permissions))
        )
    }

    /**
     * Revoke all permissions from a target organization user.
     * Only PM3 may call this function.
     *
     * @param ctx - Fabric transaction context
     * @param targetMSP - Target organization's MSP ID
     * @param targetCertId - Target user's certificate ID
     * @returns {Promise<void>}
     */
    @Transaction()
    public async revokePermissionsFromOrg(
        ctx: Context,
        targetMSP: string,
        targetCertId: string,
    ): Promise<void> {
        const callerMsp = ctx.clientIdentity.getMSPID()
        if (callerMsp !== PM3_MSPID) {
            throw new Error(`ACCESS DENIED: only PM3 may revoke permissions, caller MSP is ${callerMsp}`)
        }

        const targetIdentityIdentifier = `${targetMSP}:${targetCertId}`

        console.log(
            `[revokePermissionsFromOrg] PM3 revoking all permissions from ${targetIdentityIdentifier}`
        )

        // Delete the permissions entry (effectively setting to empty array)
        await ctx.stub.deleteState(this.permissionsKey(targetIdentityIdentifier))
    }

    /**
     * Check whether the caller has the supplied permission by reading the caller's
     * stored permissions from the ledger.
     */
    @Transaction()
    public async hasPermission(ctx: Context, permission: Permission): Promise<boolean> {
        const permsJson = await this.getPermissions(ctx)
        try {
            const perms = z.array(PermissionSchema).parse(JSON.parse(permsJson))
            return perms.includes(permission)
        } catch {
            return false
        }
    }

    /**
     * Check if anyone on the blockchain has permissions.
     * Returns true if at least one identity has permissions set.
     */
    private async anyoneHasPermissions(ctx: Context): Promise<boolean> {
        // Query all keys with the permissions prefix
        const iterator = await ctx.stub.getStateByRange('roleauth:perms:', 'roleauth:perms:~')

        try {
            let result = await iterator.next()
            // If we get any result, someone has permissions
            if (!result.done && result.value) {
                return true
            }
            return false
        } finally {
            await iterator.close()
        }
    }

    @Transaction()
    public async setDefaultPermissions(ctx: Context, targetIdentityIdentifier: string): Promise<void> {
        const callerMsp = ctx.clientIdentity.getMSPID()

        // Check if no one has permissions on the blockchain
        const hasAnyPermissions = await this.anyoneHasPermissions(ctx)

        if (!hasAnyPermissions) {
            // Bootstrap case: no one has permissions yet
            // Assign default permissions to PM3 org caller
            if (callerMsp !== PM3_MSPID) {
                throw new Error(`Bootstrap failed: first permissions must be assigned to PM3 org, caller MSP is ${callerMsp}`)
            }

            const pm3Identifier = this.identityIdentifierFromCtx(ctx)
            const defaultPermissions: Permission[] = [
                'package:create',
                'package:read',
                'package:read:private',
                'package:updateStatus',
                'package:delete',
                'transfer:propose',
                'transfer:accept',
                'transfer:execute',
            ]

            await ctx.stub.putState(this.permissionsKey(pm3Identifier), Buffer.from(JSON.stringify(defaultPermissions)))
            return
        }

        // Normal case: someone already has permissions, enforce PM3 access control
        if (callerMsp !== PM3_MSPID) {
            throw new Error(`ACCESS DENIED: only PM3 may update permissions, caller MSP is ${callerMsp} and required is ${PM3_MSPID}`)
        }

        const defaultPermissions: Permission[] = [
            'package:create',
            'package:read',
            'package:read:private',
            'package:updateStatus',
            'package:delete',
            'transfer:propose',
            'transfer:accept',
            'transfer:execute',
        ]

        await ctx.stub.putState(this.permissionsKey(targetIdentityIdentifier), Buffer.from(JSON.stringify(defaultPermissions)))
    }

    /**
     * Helper function to get the caller's identity identifier.
     * This matches the format used by RoleAuthContract.
     *
     * @param ctx - Fabric transaction context
     * @returns Identity identifier in format "MSPID:certificateId"
     */
    @Transaction(false)
    public getCallerIdentifier(ctx: Context): string {
        return `${ctx.clientIdentity.getMSPID()}:${ctx.clientIdentity.getID()}`
    }

    /**
     * Fetch the caller's permissions from the blockchain.
     * Returns an array of Permission strings that the caller has been granted.
     * Returns an empty array if the caller has no permissions set.
     *
     * This helper can be used in other contracts (like PackageContract) to check
     * permissions without needing to invoke the RoleAuthContract.
     *
     * @param ctx - Fabric transaction context
     * @returns Array of permissions the caller has
     *
     * @example
     * ```typescript
     * import { getCallerPermissions } from './roleAuth/src/roleUtils'
     *
     * // In your contract method:
     * const permissions = await getCallerPermissions(ctx)
     * if (!permissions.includes('package:create')) {
     *   throw new Error('ACCESS DENIED: missing package:create permission')
     * }
     * ```
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
     *
     * @example
     * ```typescript
     * import { callerHasPermission } from './roleAuth/src/roleUtils'
     *
     * // In your contract method:
     * if (!await callerHasPermission(ctx, 'package:create')) {
     *   throw new Error('ACCESS DENIED: missing package:create permission')
     * }
     * ```
     */
    @Transaction(false)
    public async callerHasPermission(ctx: Context, permission: Permission): Promise<boolean> {
        const permissions = await this.getCallerPermissions(ctx)
        return permissions.includes(permission)
    }

    /**
     * Require that the caller has a specific permission, throwing an error if they don't.
     * Use this at the start of contract methods that need permission checks.
     *
     * @param ctx - Fabric transaction context
     * @param permission - The required permission
     * @throws Error if the caller doesn't have the permission
     *
     * @example
     * ```typescript
     * import { requirePermission } from './roleAuth/src/roleUtils'
     *
     * @Transaction()
     * public async createPackage(ctx: Context, ...args: any[]): Promise<void> {
     *   await requirePermission(ctx, 'package:create')
     *   // ... rest of the method
     * }
     * ```
     */
    @Transaction(false)
    public async requirePermission(ctx: Context, permission: Permission): Promise<void> {
        const hasPermission = await this.callerHasPermission(ctx, permission)
        if (!hasPermission) {
            const identityId = this.getCallerIdentifier(ctx)
            throw new Error(`ACCESS DENIED: Identity ${identityId} does not have permission '${permission}'`)
        }
    }

}