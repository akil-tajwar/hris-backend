import { Request, Response, NextFunction } from 'express'
import {
  createEmployeePreboarding,
  getEmployeePreboarding,
  updateEmployeePreboarding,
  deleteEmployeePreboarding,
} from '../services/employeePreboarding.service'

import { requirePermission } from '../services/utils/jwt.utils'

// CREATE
export const createEmployeePreboardingController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_employee_preboarding')

    const result = await createEmployeePreboarding(req.body)

    res.status(201).json({
      status: 'success',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

// GET ALL
export const getEmployeePreboardingController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_employee_preboarding')

    const result = await getEmployeePreboarding()

    res.json(result)
  } catch (err) {
    next(err)
  }
}

// UPDATE
export const updateEmployeePreboardingController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_employee_preboarding')

    const { preboardingId } = req.params

    const result = await updateEmployeePreboarding({
      preboardingId: Number(preboardingId),
      ...req.body,
    })

    res.json({
      status: 'success',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

// DELETE
export const deleteEmployeePreboardingController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_employee_preboarding')

    const { preboardingId } = req.params

    await deleteEmployeePreboarding(Number(preboardingId))

    res.json({
      status: 'success',
      message: 'Employee preboarding deleted',
    })
  } catch (err) {
    next(err)
  }
}
