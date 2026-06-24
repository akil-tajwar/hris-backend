import { eq } from 'drizzle-orm'
import { db } from '../config/database'
import { BadRequestError, UnauthorizedError } from './utils/errors.utils'
import { generateAccessToken } from './utils/jwt.utils'
import {
  comparePassword,
  hashPassword,
  validatePassword,
} from './utils/password.utils'
import { NewUser, roleModel, userModel } from '../schemas'

// Find user by username
export const findUserByEmail = async (email: string) => {
  const [user] = await db
    .select()
    .from(userModel)
    .where(eq(userModel.email, email))

  return user
}

// Get user with relations
export const getUserDetailsByUserId = async (userId: number) => {
  const user = await db.query.userModel.findFirst({
    where: eq(userModel.userId, userId),
    with: {
      role: {
        with: {
          rolePermissions: {
            with: {
              permission: true,
            },
          },
        },
      },
    },
  })

  return user
}

// Create new user
export const createUser = async (
  dbInstance: typeof db,
  userData: NewUser & {
    userCompanies?: number[]
    createdBy: number
  }
) => {
  const [existingUser] = await dbInstance
    .select()
    .from(userModel)
    .where(eq(userModel.username, userData.username))

  if (existingUser) {
    throw BadRequestError('Username already registered, Please Try Another')
  }

  validatePassword(userData.password)

  const hashedPassword = await hashPassword(userData.password)

  const result = await dbInstance.insert(userModel).values({
    username: userData.username,
    password: hashedPassword,
    active: userData.active ?? true,
    isPasswordResetRequired: userData.isPasswordResetRequired ?? true,
    roleId: userData.roleId,
    tenantId: userData.tenantId,
    email: userData.email,
  })

  const newUserId = result[0].insertId

  return {
    userId: newUserId,
    username: userData.username,
    email: userData.email,
    roleId: userData.roleId,
    tenantId: userData.tenantId,
    active: userData.active,
    isPasswordResetRequired: userData.isPasswordResetRequired,
    userCompanies: userData.userCompanies ?? [],
  }
}

// Get all users
export const getUsers = async () => {
  const userList = await db.select().from(userModel)
  return userList
}

// Update user
export const updateUser = async (
  userId: number,
  updateData: {
    username?: string
    roleId?: number
    active?: boolean
  }
) => {
  await db.update(userModel).set(updateData).where(eq(userModel.userId, userId))

  const updatedUser = await db
    .select({
      userId: userModel.userId,
      username: userModel.username,
      roleId: userModel.roleId,
      active: userModel.active,
    })
    .from(userModel)
    .where(eq(userModel.userId, userId))
    .limit(1)

  return updatedUser[0]
}

// Login user
export const loginUser = async (email: string, password: string) => {
  const user = await findUserByEmail(email)
  console.log('🚀 ~ loginUser ~ user:', user)

  if (!user) {
    throw UnauthorizedError(
      'Wrong username/password. Please Contact with Administrator'
    )
  }

  validatePassword(password)

  const isValidPassword = await comparePassword(password, user.password)

  if (!isValidPassword) {
    throw UnauthorizedError(
      'Wrong username/password. Please Contact with Administrator'
    )
  }

  const userDetails = (await getUserDetailsByUserId(user.userId)) as {
    role?: {
      rolePermissions?: Array<{
        permission: {
          name: string
        }
        userCompanies?: {
          companyId: number[]
        }
      }>
    }
  }

  const permissions =
    userDetails?.role?.rolePermissions?.map((ur) => ur.permission.name) || []

  const token = generateAccessToken({
    userId: user.userId,
    username: user.username,
    role: user.roleId || 0,
    permissions,
    hasPermission: (perm: string) => permissions.includes(perm),
  })

  return {
    token,
    user: userDetails,
  }
}

// Change password
export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
) => {
  const [user] = await db
    .select()
    .from(userModel)
    .where(eq(userModel.userId, userId))

  if (!user) {
    throw UnauthorizedError('User not found')
  }

  const isValidPassword = await comparePassword(currentPassword, user.password)

  if (!isValidPassword) {
    throw UnauthorizedError('Current password is incorrect')
  }

  validatePassword(newPassword)
  const hashedPassword = await hashPassword(newPassword)

  await db
    .update(userModel)
    .set({ password: hashedPassword })
    .where(eq(userModel.userId, userId))
}

export const getRoles = async () => {
  return await db.select().from(roleModel)
}
