import { Request, Response, NextFunction } from 'express'
import {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
} from '../services/departments.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createDepartmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    requirePermission(req, 'create_department')
    const { departmentName, createdBy } = req.body
    const department = await createDepartment(departmentName, createdBy)
    res.status(201).json({ status: 'success', data: department })
  } catch (err) {
    next(err)
  }
}

export const getDepartmentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    requirePermission(req, 'view_department')
    const departments = await getDepartments()
    res.json(departments)
  } catch (err) {
    next(err)
  }
}

export const updateDepartmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    requirePermission(req, 'edit_department')
    const { departmentId } = req.params
    const { departmentName, updatedBy } = req.body

    const department = await updateDepartment(Number(departmentId), departmentName, updatedBy)
    res.json({ status: 'success', data: department })
  } catch (err) {
    next(err)
  }
}

export const deleteDepartmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    requirePermission(req, 'delete_department')
    const { departmentId } = req.params
    await deleteDepartment(Number(departmentId))
    res.json({ status: 'success', message: 'Department deleted' })
  } catch (err) {
    next(err)
  }
}
