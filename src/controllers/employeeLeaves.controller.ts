import { Request, Response, NextFunction } from 'express'
import {
  createEmployeeLeave,
  getEmployeeLeaves,
  updateEmployeeLeave,
  deleteEmployeeLeave,
  getEmployeeLeaveTypes,
} from '../services/employeeLeaves.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createEmployeeLeaveController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    requirePermission(req, 'create_employee_leave')
    const employeeLeave = await createEmployeeLeave(req.body)
    res.status(201).json({ status: 'success', data: employeeLeave })
  } catch (err) {
    next(err)
  }
}

export const getEmployeeLeavesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    requirePermission(req, 'view_employee_leave')
    const employeeLeaves = await getEmployeeLeaves()
    res.json(employeeLeaves)
  } catch (err) {
    next(err)
  }
}

export const updateEmployeeLeaveController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    requirePermission(req, 'edit_employee_leave')
    const { employeeLeaveId } = req.params

    const employeeLeave = await updateEmployeeLeave({ employeeLeaveId: Number(employeeLeaveId), ...req.body })
    res.json({ status: 'success', data: employeeLeave })
  } catch (err) {
    next(err)
  }
}

export const deleteEmployeeLeaveController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    requirePermission(req, 'delete_employee_leave')
    const { employeeLeaveId } = req.params
    await deleteEmployeeLeave(Number(employeeLeaveId))
    res.json({ status: 'success', message: 'EmployeeLeave deleted' })
  } catch (err) {
    next(err)
  }
}

export const getEmployeeLeaveTypesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    requirePermission(req, 'view_employee_leave_type')
    const employeeLeaves = await getEmployeeLeaveTypes()
    res.json(employeeLeaves)
  } catch (err) {
    next(err)
  }
}