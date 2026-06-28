import { NextFunction, Request, Response } from 'express'
import { UnauthorizedError } from '../services/utils/errors.utils'
import {
  extractTokenFromHeader,
  getUserPermissions,
  verifyAccessToken,
} from '../services/utils/jwt.utils'
import { db } from '../config/database'
import { userModel } from '../schemas'
import { eq } from 'drizzle-orm'

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)
    // console.log(token);
    const decoded = verifyAccessToken(token)

    const permissions = await getUserPermissions(decoded.userId)

    const [user] = await db
      .select({ tenantId: userModel.tenantId })
      .from(userModel)
      .where(eq(userModel.userId, decoded.userId))

    if (!user || user.tenantId === null) {
      return next(UnauthorizedError('Invalid token'))
    }

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      tenantId: user.tenantId,
      permissions: permissions,
      hasPermission: (perm: string) => permissions.includes(perm),
      hasRole: (role: number) => decoded.role === role,
    }
    // console.log('🚀 ~ authenticateUser ~ req.user:', req.user)
    // console.log('permissions',permissions)
    next()
  } catch (error) {
    console.error(error)
    return next(UnauthorizedError('Invalid token'))
  }
}

// utils/getUserPermissions.ts
