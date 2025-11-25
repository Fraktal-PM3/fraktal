
import { Context, Contract, Transaction } from 'fabric-contract-api'
import { z } from 'zod'
import { Permission, PermissionSchema } from './roleUtils'


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

}