import { Request, Response, NextFunction } from 'express'
import {
  createEmployeeType,
  getEmployeeTypes,
  updateEmployeeType,
  deleteEmployeeType,
} from '../services/employeeTypes.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createEmployeeTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_employee_type')
    const { employeeTypeName, createdBy } = req.body
    const employeeType = await createEmployeeType(employeeTypeName, createdBy)
    res.status(201).json({ status: 'success', data: employeeType })
  } catch (err) {
    next(err)
  }
}

export const getEmployeeTypesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_employee_type')
    const employeeTypes = await getEmployeeTypes()
    res.json(employeeTypes)
  } catch (err) {
    next(err)
  }
}

export const updateEmployeeTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_employee_type')
    const { employeeTypeId } = req.params
    const { employeeTypeName, updatedBy } = req.body

    const employeeType = await updateEmployeeType(
      Number(employeeTypeId),
      employeeTypeName,
      updatedBy
    )
    res.json({ status: 'success', data: employeeType })
  } catch (err) {
    next(err)
  }
}

export const deleteEmployeeTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_employee_type')
    const { employeeTypeId } = req.params
    await deleteEmployeeType(Number(employeeTypeId))
    res.json({ status: 'success', message: 'EmployeeType deleted' })
  } catch (err) {
    next(err)
  }
}
