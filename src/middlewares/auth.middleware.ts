import { NextFunction, Request, Response } from 'express'
import { UnauthorizedError } from '../services/utils/errors.utils'
import {
  getUserPermissions,
  verifyAccessToken,
} from '../services/utils/jwt.utils'
import { db } from '../config/database'
import { userModel } from '../schemas'
import { eq } from 'drizzle-orm'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token

    if (!token) {
      return next(UnauthorizedError('Not authenticated'))
    }

    const decoded = verifyAccessToken(token)

    const [user] = await db
      .select({ tenantId: userModel.tenantId })
      .from(userModel)
      .where(eq(userModel.userId, decoded.userId))

    if (!user || user.tenantId === null) {
      return next(UnauthorizedError('Invalid token'))
    }

    const permissions =
      decoded.role === 1
        ? []
        : await getUserPermissions(decoded.userId, user.tenantId)

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      tenantId: user.tenantId,
      permissions: permissions,
      hasPermission: (perm: string) => {
        if (decoded.role === 1) return true
        return permissions.includes(perm)
      },
      hasRole: (role: number) => decoded.role === role,
    }
    next()
  } catch (error) {
    console.error(error)
    return next(UnauthorizedError('Invalid token'))
  }
}

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message:
      'Too many requests from this IP, please try again after 15 minutes',
  },
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many login attempts, please try again after 15 minutes',
  },
  keyGenerator: (req: Request) => {
    const ip = ipKeyGenerator(
      req.ip || req.connection.remoteAddress || 'unknown'
    )
    const username = req.body?.email || req.body?.username || 'unknown'
    return `${ip}:${username}`
  },
  skip: (req) => req.method === 'OPTIONS',
})
