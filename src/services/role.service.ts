// service.ts
import { eq, inArray, sql } from 'drizzle-orm'
import { db } from '../config/database'
import { permissionsModel, roleModel, rolePermissionsModel } from '../schemas'
import { BadRequestError } from './utils/errors.utils'

// Get all roles
export const getAllRoles = async () => {
  const roles = await db
    .select({
      roleId: roleModel.roleId,
      roleName: roleModel.roleName,
      permissions: sql<
        number[]
      >`json_arrayagg(${rolePermissionsModel.permissionId})`,
    })
    .from(roleModel)
    .leftJoin(
      rolePermissionsModel,
      eq(roleModel.roleId, rolePermissionsModel.roleId)
    )
    .groupBy(roleModel.roleId, roleModel.roleName)

  return roles
}

// Update role permissions
export const updateRolePermissions = async (
  roleId: number,
  permissions: number[]
) => {
  if (!Array.isArray(permissions)) {
    throw new Error('Permissions must be an array of numbers')
  }

  // Check if role exists
  const roleExists = await db
    .select()
    .from(roleModel)
    .where(eq(roleModel.roleId, roleId))
    .limit(1)

  if (!roleExists.length) {
    throw BadRequestError('Role not found')
  }

  // Verify all permissions exist
  if (permissions.length > 0) {
    const existingPermissions = await db
      .select({ id: permissionsModel.id })
      .from(permissionsModel)
      .where(inArray(permissionsModel.id, permissions))

    if (existingPermissions.length !== permissions.length) {
      throw BadRequestError('One or more permissions do not exist')
    }
  }

  // Delete existing role-permissions associations
  await db
    .delete(rolePermissionsModel)
    .where(eq(rolePermissionsModel.roleId, roleId))

  // Insert new role-permissions associations
  if (permissions.length > 0) {
    const rolePermissionsData = permissions.map((permissionId) => ({
      roleId: roleId,
      permissionId: permissionId,
    }))

    await db.insert(rolePermissionsModel).values(rolePermissionsData)
  }

  // Fetch updated role
  const updated = await db
    .select()
    .from(roleModel)
    .where(eq(roleModel.roleId, roleId))

  return updated[0]
}

// Get all permissions
export const getAllPermission = async () => {
  const permission = await db.select().from(permissionsModel)
  return permission
}

// Helper function to get role by ID
export const getRoleById = async (roleId: number) => {
  const role = await db
    .select()
    .from(roleModel)
    .where(eq(roleModel.roleId, roleId))
    .limit(1)

  if (!role.length) {
    throw BadRequestError('Role not found')
  }

  return role[0]
}
