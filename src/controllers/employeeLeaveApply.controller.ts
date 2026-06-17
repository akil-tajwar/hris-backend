import { Request, Response, NextFunction } from 'express'
import {
  createEmployeeLeaveApply,
  getEmployeeLeaveApplications,
  updateEmployeeLeaveApply,
  deleteEmployeeLeaveApply,
  approveLeaveByRepAuth,
  approveLeaveByHr,
  calculateLeaveDaysService,
} from '../services/employeeLeaveApply.service'
import { requirePermission } from '../services/utils/jwt.utils'

// CREATE
export const createEmployeeLeaveApplyController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_employee_leave_apply')

    const leaveApply = await createEmployeeLeaveApply(req.body)

    res.status(201).json({
      status: 'success',
      data: leaveApply,
    })
  } catch (err) {
    next(err)
  }
}

// GET ALL
export const getEmployeeLeaveApplicationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_employee_leave_apply')

    const leaveApplications = await getEmployeeLeaveApplications()

    res.json(leaveApplications)
  } catch (err) {
    next(err)
  }
}

// UPDATE
export const updateEmployeeLeaveApplyController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_employee_leave_apply')

    const { employeeLeaveApplyId } = req.params

    const leaveApply = await updateEmployeeLeaveApply(
      Number(employeeLeaveApplyId),
      req.body
    )

    res.json({
      status: 'success',
      data: leaveApply,
    })
  } catch (err) {
    next(err)
  }
}

// APPROVE BY REPORTING AUTHORITY
export const approveLeaveByRepAuthController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'approve_leave_rep_auth')

    const { employeeLeaveApplyId } = req.params
    const { updatedBy } = req.body

    const result = await approveLeaveByRepAuth(
      Number(employeeLeaveApplyId),
      updatedBy
    )

    res.json({
      status: 'success',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

// APPROVE BY HR
export const approveLeaveByHrController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'approve_leave_hr')

    const { employeeLeaveApplyId } = req.params
    const { updatedBy } = req.body

    const result = await approveLeaveByHr(
      Number(employeeLeaveApplyId),
      updatedBy
    )

    res.json({
      status: 'success',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

// DELETE
export const deleteEmployeeLeaveApplyController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_employee_leave_apply')

    const { employeeLeaveApplyId } = req.params

    await deleteEmployeeLeaveApply(Number(employeeLeaveApplyId))

    res.json({
      status: 'success',
      message: 'Leave application deleted',
    })
  } catch (err) {
    next(err)
  }
}

export const calculateLeaveDaysController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId, leaveTypeId, fromDate, toDate } = req.query

    const result = await calculateLeaveDaysService({
      userId: Number(userId),
      leaveTypeId: Number(leaveTypeId),
      fromDate: String(fromDate),
      toDate: String(toDate),
    })

    res.status(200).json(result)
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
