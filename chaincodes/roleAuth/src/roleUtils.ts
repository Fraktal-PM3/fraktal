import z from 'zod'

/**
 * Zod schema for permission strings. Each permission represents a fine-grained
 * action that a user may be allowed to perform inside chaincode.
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
 * Helper function to construct the permissions key for a given identity.
 * This matches the key format used by RoleAuthContract.
 *
 * @param identityId - Identity identifier in format "MSPID:certificateId"
 * @returns The state key for the identity's permissions
 */
export function getPermissionsKey(identityId: string): string {
    return `roleauth:perms:${identityId}`
}



