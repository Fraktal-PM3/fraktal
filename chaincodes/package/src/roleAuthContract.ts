
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
export function callerRoleFromAttrs(ctx: Context): Role | null {
    // this assumes certificate attribute 'role' exists and is a single value
    // adapt if you allow multiple roles, then parse CSV/JSON
    const attr = ctx.clientIdentity.getAttributeValue('role')
    if (!attr) return null
    // normalize and validate
    try {
        return RoleSchema.parse(attr)
    } catch {
        return null
    }
}

/**
 * Returns true if the caller (as determined from identity attributes) has the
 * specified permission according to the provided mapping (or the default
 * mapping when none is provided).
 *
 * @param ctx - Fabric transaction context
 * @param permission - Permission to check
 * @param mapping - Optional role->permission mapping to consult
 * @returns boolean indicating whether the caller has the permission
 *
 * @example
 * if (!hasPermission(ctx, 'package:create')) {
 *   throw new Error('not authorized')
 * }
 */
export function hasPermission(
    ctx: Context,
    permission: Permission,
    mapping: RolePermissions = DEFAULT_ROLE_PERMISSIONS,
): boolean {
    const role = callerRoleFromAttrs(ctx)
    if (!role) return false
    const perms = mapping[role] || []
    return perms.includes(permission)
}

/**
 * Require that the caller has a given permission and throw an Error when they
 * do not. Use this at the start of transaction handlers to enforce role-based
 * access control.
 *
 * @param ctx - Fabric transaction context
 * @param permission - Permission required for the operation
 * @param mapping - Optional role->permission mapping (defaults to built-in mapping)
 * @throws {Error} when the caller lacks the permission
 *
 * @example
 * // inside a transaction method
 * requirePermission(ctx, 'package:updateStatus')
 */
export function requirePermission(
    ctx: Context,
    permission: Permission,
    mapping: RolePermissions = DEFAULT_ROLE_PERMISSIONS,
): void {
    if (!hasPermission(ctx, permission, mapping)) {
        throw new Error(
            `ACCESS DENIED: caller (role=${ctx.clientIdentity.getAttributeValue(
                'role',
            )}) lacks permission ${permission}`,
        )
    }
}