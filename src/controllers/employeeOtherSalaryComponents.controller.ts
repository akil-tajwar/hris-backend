import { NextFunction, Request, Response } from 'express'
import { createInsertSchema } from 'drizzle-zod'
import { employeeOtherSalaryComponentsModel } from '../schemas'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  createEmployeeOtherSalaryComponent,
  deleteEmployeeOtherSalaryComponent,
  editEmployeeOtherSalaryComponent,
  getAllEmployeeOtherSalaryComponents,
  getEmployeeOtherSalaryComponentById,
} from '../services/employeeOtherSalaryComponents.service'

// Schema validation
const createEmployeeOtherSalaryComponentSchema = createInsertSchema(
  employeeOtherSalaryComponentsModel
).omit({
  employeeOtherSalaryComponentId: true,
})

const editEmployeeOtherSalaryComponentSchema =
  createEmployeeOtherSalaryComponentSchema.partial()

export const createEmployeeOtherSalaryComponentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_employee_other_salary_component')

    const body = req.body

    // Accept both object & array without validation
    const dataArray = Array.isArray(body) ? body : [body]

    // Parse each item individually (same schema)
    const parsedData = dataArray.map((item) =>
      createEmployeeOtherSalaryComponentSchema.parse(item)
    )

    const result = await createEmployeeOtherSalaryComponent(parsedData)

    res.status(201).json({
      status: 'success',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export const getAllEmployeeOtherSalaryComponentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_employee_other_salary_component')
    const employeeOtherSalaryComponents =
      await getAllEmployeeOtherSalaryComponents()

    res.status(200).json(employeeOtherSalaryComponents)
  } catch (error) {
    next(error)
  }
}

export const getEmployeeOtherSalaryComponentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_employee_other_salary_component')
    const id = Number(req.params.id)
    const employeeOtherSalaryComponent =
      await getEmployeeOtherSalaryComponentById(id)

    res.status(200).json(employeeOtherSalaryComponent)
  } catch (error) {
    next(error)
  }
}

export const editEmployeeOtherSalaryComponentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_employee_other_salary_component')
    const id = Number(req.params.id)
    const employeeOtherSalaryComponentData =
      editEmployeeOtherSalaryComponentSchema.parse(req.body)
    const employeeOtherSalaryComponent = await editEmployeeOtherSalaryComponent(
      id,
      employeeOtherSalaryComponentData
    )

    res.status(200).json(employeeOtherSalaryComponent)
  } catch (error) {
    next(error)
  }
}

export const deleteEmployeeOtherSalaryComponentController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'delete_employee_other_salary_component')
    const employeeOtherSalaryComponentId = Number(req.params.id)

    const result = await deleteEmployeeOtherSalaryComponent(
      employeeOtherSalaryComponentId
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
