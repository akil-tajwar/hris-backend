import { Request, Response, NextFunction } from 'express'
import {
  createEmploymentType,
  getEmploymentTypes,
  updateEmploymentType,
  deleteEmploymentType,
} from '../services/employmentTypes.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createEmploymentTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_employee_type')
    const { employmentTypeName, createdBy } = req.body
    const employmentType = await createEmploymentType(employmentTypeName, createdBy)
    res.status(201).json({ status: 'success', data: employmentType })
  } catch (err) {
    next(err)
  }
}

export const getEmploymentTypesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_employee_type')
    const employmentTypes = await getEmploymentTypes()
    res.json(employmentTypes)
  } catch (err) {
    next(err)
  }
}

export const updateEmploymentTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_employee_type')
    const { employmentTypeId } = req.params
    const { employmentTypeName, updatedBy } = req.body

    const employmentType = await updateEmploymentType(
      Number(employmentTypeId),
      employmentTypeName,
      updatedBy
    )
    res.json({ status: 'success', data: employmentType })
  } catch (err) {
    next(err)
  }
}

export const deleteEmploymentTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_employee_type')
    const { employmentTypeId } = req.params
    await deleteEmploymentType(Number(employmentTypeId))
    res.json({ status: 'success', message: 'EmploymentType deleted' })
  } catch (err) {
    next(err)
  }
}
