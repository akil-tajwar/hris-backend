import { eq } from 'drizzle-orm'
import { db } from '../config/database'
import { BadRequestError, UnauthorizedError } from './utils/errors.utils'
import { generateAccessToken } from './utils/jwt.utils'
import {
  comparePassword,
  hashPassword,
  validatePassword,
} from './utils/password.utils'
import { NewUser, roleModel, userModel, userRolesModel } from '../schemas'
import { redis } from '../middlewares/redis'

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

  if (userData.roleId == null) {
    throw BadRequestError('Role ID is required')
  }

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

  await dbInstance.insert(userRolesModel).values({
    userId: newUserId,
    roleId: userData.roleId,
  })

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
export const getUsers = async (tenantId: number) => {
  const userList = await db
    .select()
    .from(userModel)
    .where(eq(userModel.tenantId, tenantId))
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

const getLoginDelay = async (identifier: string): Promise<number> => {
  const attempts = await redis.get(`login_attempts:${identifier}`)
  const count = parseInt(attempts || '0')

  // Progressive delay: 1s, 5s, 15s, 30s, 1min, 5min...
  const delays = [1000, 5000, 15000, 30000, 60000, 300000]
  const index = Math.min(count, delays.length - 1)
  return delays[index]
}

const trackFailedAttempt = async (identifier: string) => {
  const key = `login_attempts:${identifier}`
  const attempts = await redis.incr(key)
  await redis.expire(key, 900) // 15 minutes

  // Lock account after 5 failed attempts
  if (attempts >= 5) {
    await redis.setex(`locked:${identifier}`, 1800, 'true') // 30 minutes
  }

  // Store last attempt time for progressive delay
  await redis.setex(`last_attempt:${identifier}`, 300, Date.now().toString())
}

// Login user
export const loginUser = async (email: string, password: string) => {
  const identifier = `${email}`

  // ✅ Check if account is locked
  const isLocked = await redis.get(`locked:${identifier}`)
  if (isLocked) {
    throw new Error('Account is temporarily locked. Please try again later.')
  }

  // ✅ Progressive delay
  const delay = await getLoginDelay(identifier)
  await new Promise((resolve) => setTimeout(resolve, delay))

  // Find user
  const user = await findUserByEmail(email)

  if (!user) {
    // ✅ Track failed attempts
    await trackFailedAttempt(identifier)
    throw UnauthorizedError('Invalid credentials')
  }

  // Validate password
  const isValidPassword = await comparePassword(password, user.password)

  if (!isValidPassword) {
    // ✅ Track failed attempts
    await trackFailedAttempt(identifier)
    throw UnauthorizedError('Invalid credentials')
  }

  // ✅ Reset attempts on success
  await redis.del(`login_attempts:${identifier}`)
  await redis.del(`locked:${identifier}`)

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
    // permissions,
    // hasPermission: (perm: string) => permissions.includes(perm),
  })

  const { password: _password, ...safeUser } = userDetails as any

  return {
    token,
    user: safeUser,
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
