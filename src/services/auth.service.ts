import { eq } from 'drizzle-orm'
import { db } from '../config/database'
import { BadRequestError, UnauthorizedError } from './utils/errors.utils'
import { generateAccessToken } from './utils/jwt.utils'
import {
  comparePassword,
  hashPassword,
  validatePassword,
} from './utils/password.utils'
import { NewUser, userModel } from '../schemas'

// Find user by username
export const findUserByUsername = async (username: string) => {
  const [user] = await db
    .select()
    .from(userModel)
    .where(eq(userModel.username, username))
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
export const createUser = async (userData: NewUser) => {
  const existingUser = await findUserByUsername(userData.username)

  if (existingUser) {
    throw BadRequestError('Username already registered, Please Try Another')
  }

  validatePassword(userData.password)
  const hashedPassword = await hashPassword(userData.password)

  // SQLite does not support $returningId(); use lastInsertRowid
  const result = await db.insert(userModel).values({
    username: userData.username,
    password: hashedPassword,
    active: userData.active ? true : false,
    isPasswordResetRequired: userData.isPasswordResetRequired ? true : false,
    roleId: userData.roleId,
  })

  const newUserId = result[0] // Drizzle returns array with inserted row ID

  return {
    id: newUserId,
    username: userData.username,
    password: userData.password,
    active: userData.active,
    roleId: userData.roleId,
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
export const loginUser = async (username: string, password: string) => {
  const user = await findUserByUsername(username)

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

  const userDetails = await getUserDetailsByUserId(user.userId)

  const permissions =
    userDetails?.role?.rolePermissions.map((ur) => ur.permission.name) || []

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
