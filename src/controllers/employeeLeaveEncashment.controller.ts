import { NextFunction, Request, Response } from 'express'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  createEmployeeLeaveEncashment,
  getAllEmployeeLeaveEncashments,
} from '../services/employeeLeaveEncashment.service'

export const createEmployeeLeaveEncashmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_employee_leave_encashment')

    const tenantId = req.user?.tenantId

    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const data = {
      ...req.body,
      tenantId,
    }

    const encashment = await createEmployeeLeaveEncashment(data)

    res.status(201).json({
      status: 'success',
      data: encashment,
    })
  } catch (err) {
    next(err)
  }
}

export const getEmployeeLeaveEncashmentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_employee_leave_encashment')

    const tenantId = req.user?.tenantId

    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const encashments = await getAllEmployeeLeaveEncashments(tenantId)

    res.json(encashments)
  } catch (err) {
    next(err)
  }
}
