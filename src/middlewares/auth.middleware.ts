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
import rateLimit from 'express-rate-limit'

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
    // console.log("🚀 ~ authenticateUser ~ decoded:", decoded)

    const [user] = await db
      .select({ tenantId: userModel.tenantId })
      .from(userModel)
      .where(eq(userModel.userId, decoded.userId))

    if (!user || user.tenantId === null) {
      return next(UnauthorizedError('Invalid token'))
    }

    // Super Admin doesn't need permission lookup
    const permissions =
      decoded.role === 1 ? [] : await getUserPermissions(decoded.userId, user.tenantId)

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      tenantId: user.tenantId,
      permissions: permissions,
      hasPermission: (perm: string) => {
        // Super Admin has access to everything
        if (decoded.role === 1) return true

        return permissions.includes(perm)
      },
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


//for general api rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // per ip 15 minutes 300 requests
  standardHeaders: true, // sends to RateLimit-* headers response
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
})

//for login and register api
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // per ip 15 minutes 10 requests
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only counts failed requests
  message: {
    status: 'fail',
    message: 'Too many login attempts, please try again after 15 minutes',
  },
})