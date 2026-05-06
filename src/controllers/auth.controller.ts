import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'

import jwt from 'jsonwebtoken'
import { db } from '../config/database'
import { roleModel, userModel } from '../schemas'
import { eq, sql } from 'drizzle-orm'
import {
  changePassword,
  createUser,
  getUsers,
  loginUser,
  updateUser,
} from '../services/auth.service'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const registerSchema = z
  .object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    active: z.boolean().default(true),
    roleId: z.number(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters'),
    confirmNewPassword: z
      .string()
      .min(8, 'Confirm new password must be at least 8 characters'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match",
    path: ['confirmNewPassword'],
  })

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password } = loginSchema.parse(req.body)
    const result = await loginUser(username, password)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password, active, roleId } = registerSchema.parse(
      req.body
    )
    const user = await createUser({ username, password, active, roleId })

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          username: user.username,
          roleId: user.roleId,
          active: user.active,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

export const updateUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params
    const { username, roleId, active } = req.body

    const updateData: {
      username?: string
      roleId?: number
      active?: boolean
    } = {}

    if (username !== undefined) updateData.username = username
    if (roleId !== undefined) updateData.roleId = Number(roleId)
    if (active !== undefined) updateData.active = active

    const updatedUser = await updateUser(Number(userId), updateData)

    if (!updatedUser) {
      res.status(404).json({ status: 'fail', message: 'User not found' })
      return
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: updatedUser.userId,
          username: updatedUser.username,
          roleId: updatedUser.roleId,
          active: updatedUser.active,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

export const changePasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params
    const { currentPassword, newPassword } = changePasswordSchema.parse(
      req.body
    )

    await changePassword(Number(userId), currentPassword, newPassword)

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    })
  } catch (error) {
    next(error)
  }
}

export const getUsersWithRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const usersWithRoles = await db
      .select({
        userId: userModel.userId,
        username: userModel.username,
        active: userModel.active,
        roleName: roleModel.roleName,
      })
      .from(userModel)
      .innerJoin(roleModel, eq(userModel.roleId, roleModel.roleId))

    res.status(200).json({
      status: 'success',
      data: {
        users: usersWithRoles.map((user) => ({
          id: user.userId,
          username: user.username,
          active: user.active,
          roleName: user.roleName,
        })),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getUserList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await getUsers()
    res.json(users)
  } catch (err) {
    next(err)
  }
}
