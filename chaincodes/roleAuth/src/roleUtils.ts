import z from 'zod'

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