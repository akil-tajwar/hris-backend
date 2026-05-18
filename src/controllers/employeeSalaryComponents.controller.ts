import { NextFunction, Request, Response } from 'express'
import { createInsertSchema } from 'drizzle-zod'
import { employeeSalaryComponentsModel } from '../schemas'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  createEmployeeSalaryComponent,
  deleteEmployeeSalaryComponent,
  editEmployeeSalaryComponent,
  getAllEmployeeSalaryComponents,
  getEmployeeSalaryComponentById,
} from '../services/employeeSalaryComponents.service'

// Schema validation
const createEmployeeSalaryComponentSchema = createInsertSchema(
  employeeSalaryComponentsModel
).omit({
  employeeSalaryComponentId: true,
})

const editEmployeeSalaryComponentSchema =
  createEmployeeSalaryComponentSchema.partial()

export const createEmployeeSalaryComponentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_employee_salary_component')

    const body = req.body

    // Accept both object & array without validation
    const dataArray = Array.isArray(body) ? body : [body]

    // Parse each item individually (same schema)
    const parsedData = dataArray.map((item) =>
      createEmployeeSalaryComponentSchema.parse(item)
    )

    const result = await createEmployeeSalaryComponent(parsedData)

    res.status(201).json({
      status: 'success',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export const getAllEmployeeSalaryComponentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_employee_salary_component')
    const employeeSalaryComponents =
      await getAllEmployeeSalaryComponents()

    res.status(200).json(employeeSalaryComponents)
  } catch (error) {
    next(error)
  }
}

export const getEmployeeSalaryComponentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_employee_salary_component')
    const id = Number(req.params.id)
    const employeeSalaryComponent =
      await getEmployeeSalaryComponentById(id)

    res.status(200).json(employeeSalaryComponent)
  } catch (error) {
    next(error)
  }
}

export const editEmployeeSalaryComponentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_employee_salary_component')
    const id = Number(req.params.id)
    const employeeSalaryComponentData =
      editEmployeeSalaryComponentSchema.parse(req.body)
    const employeeSalaryComponent = await editEmployeeSalaryComponent(
      id,
      employeeSalaryComponentData
    )

    res.status(200).json(employeeSalaryComponent)
  } catch (error) {
    next(error)
  }
}

export const deleteEmployeeSalaryComponentController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'delete_employee_salary_component')
    const employeeSalaryComponentId = Number(req.params.id)

    const result = await deleteEmployeeSalaryComponent(
      employeeSalaryComponentId
    )

    res.status(200).json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Something went wrong',
    })
  }
}
