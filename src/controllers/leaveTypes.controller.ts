import { Request, Response, NextFunction } from 'express'
import {
  createLeaveType,
  getLeaveTypes,
  updateLeaveType,
  deleteLeaveType,
} from '../services/leaveTypes.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createLeaveTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_leave_type')

    const tenantId = req.user?.tenantId
    const data = {
      ...req.body,
      tenantId,
    }

    const leaveTypes = await createLeaveType(data)

    res.status(201).json({
      status: 'success',
      data: leaveTypes,
    })
  } catch (err) {
    next(err)
  }
}

export const getLeaveTypesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_leave_type')

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const leaveTypes = await getLeaveTypes(tenantId)
    res.json(leaveTypes)
  } catch (err) {
    next(err)
  }
}

export const updateLeaveTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_leave_type')

    const { leaveTypeId } = req.params

    const leaveType = await updateLeaveType(Number(leaveTypeId), req.body)

    res.json({
      status: 'success',
      data: leaveType,
    })
  } catch (err) {
    next(err)
  }
}

export const deleteLeaveTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_leave_type')
    const { leaveTypeId } = req.params
    await deleteLeaveType(Number(leaveTypeId))
    res.json({ status: 'success', message: 'Leave type deleted' })
  } catch (err) {
    next(err)
  }
}
