
import { Context } from 'fabric-contract-api'
import { z } from 'zod'


/**
 * Zod schema for canonical role names used by the contracts.
 *
 * Canonical roles (ASCII keys):
 * - `pm3`
 * - `ombud`
 * - `transporter` (ASCII form of "leverantör")
 *
 * Use this schema to validate role strings at runtime or when parsing configs.
 */
export const RoleSchema = z.enum(['pm3', 'ombud', 'transporter'])
export type Role = z.infer<typeof RoleSchema>


/**
 * Zod schema for permission strings. Each permission represents a fine-grained
 * action that a role may be allowed to perform inside chaincode.
 *
 * Examples: `package:create`, `transfer:propose`.
 */
export const PermissionSchema = z.enum([
    'package:create',
    'package:read',
    'package:read:private',
    'package:updateStatus',
    'package:delete',
    'transfer:propose',
    'transfer:accept',
    'transfer:execute',
])
export type Permission = z.infer<typeof PermissionSchema>


/**
 * Zod schema for a role->permissions mapping. Keys are canonical roles and
 * values are arrays of permission strings. Validate any loaded config with
 * this schema to ensure you don't have typos in role or permission names.
 */
export const RolePermissionsSchema = z.record(RoleSchema, z.array(PermissionSchema))
export type RolePermissions = z.infer<typeof RolePermissionsSchema>

/**
 * Default role -> permission mapping used when no external config is loaded.
 * Modify this object only when you intentionally change authorization rules.
 */
export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
    pm3: [
        'package:create',
        'package:read',
        'package:read:private',
        'package:updateStatus',
        'package:delete',
        'transfer:propose',
        'transfer:accept',
        'transfer:execute',
    ],
    ombud: [
        'package:read',
        'package:read:private',
        'package:delete',
    ],
    transporter: [
        'package:read',
        'package:read:private',
        'transfer:propose',
        'transfer:accept',
    ],
}


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


export const PM3_MSPID = 'PM3MSP'

function permissionsKey(identityId: string): string {
    return `roleauth:perms:${identityId}`
}

function identityIdentifierFromCtx(ctx: Context): string {
    // Use MSPID + client id to form a unique identifier. getID() returns the
    // Fabric certificate principal string (suitable as a stable identifier).
    return `${ctx.clientIdentity.getMSPID()}:${ctx.clientIdentity.getID()}`
}

/**
 * Get permissions for a specific identity identifier (or the caller when not
 * provided). Returns an empty array when no explicit permissions are set.
 */
export async function getPermissions(
    ctx: Context,
    identityIdentifier?: string,
): Promise<Permission[]> {
    const id = identityIdentifier ?? identityIdentifierFromCtx(ctx)
    const data = await ctx.stub.getState(permissionsKey(id))
    if (!data || data.length === 0) return []
    try {
        const parsed = JSON.parse(data.toString()) as unknown
        return z.array(PermissionSchema).parse(parsed)
    } catch {
        // on corruption/parse error, return empty to be safe
        return []
    }
}

/**
 * Set explicit permissions for an identity. Only callers from the PM3 MSP may
 * update permissions for other identities. This writes the Permission[] into
 * the ledger under a stable key.
 */
export async function setPermissions(
    ctx: Context,
    targetIdentityIdentifier: string,
    permissions: Permission[],
): Promise<void> {
    const callerMsp = ctx.clientIdentity.getMSPID()
    if (callerMsp !== PM3_MSPID) {
        throw new Error('ACCESS DENIED: only PM3 may update permissions')
    }

    const parsed = z.array(PermissionSchema).parse(permissions)
    await ctx.stub.putState(permissionsKey(targetIdentityIdentifier), Buffer.from(JSON.stringify(parsed)))
}

/**
 * Check whether the caller has the supplied permission by reading the caller's
 * stored permissions from the ledger.
 */
export async function hasPermission(ctx: Context, permission: Permission): Promise<boolean> {
    const perms = await getPermissions(ctx)
    return perms.includes(permission)
}