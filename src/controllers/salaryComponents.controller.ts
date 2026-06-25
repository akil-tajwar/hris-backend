import { NextFunction, Request, Response } from 'express'
import { createInsertSchema } from 'drizzle-zod'
import { salaryComponentsModel } from '../schemas'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  createSalaryComponent,
  deleteSalaryComponent,
  editSalaryComponent,
  getAllSalaryComponents,
  getSalaryComponentById,
} from '../services/salaryComponents.service'

// Schema validation
const createSalaryComponentSchema = createInsertSchema(salaryComponentsModel).omit({
  salaryComponentId: true,
})

const editSalaryComponentSchema = createSalaryComponentSchema.partial()

export const createSalaryComponentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_salary_component')
    const salaryComponentData = createSalaryComponentSchema.parse(req.body)
    
    const tenantId = req.user?.tenantId
    const data = {
      ...salaryComponentData,
      tenantId,
    }

    const salaryComponent = await createSalaryComponent(data)

    res.status(201).json({
      status: 'success',
      data: salaryComponent,
    })
  } catch (error) {
    next(error)
  }
}

export const getAllSalaryComponentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_salary_component')

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const salaryComponents = await getAllSalaryComponents(tenantId)

    res.status(200).json(salaryComponents)
  } catch (error) {
    next(error)
  }
}

export const getSalaryComponentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_salary_component')
    const id = Number(req.params.id)
    const salaryComponent = await getSalaryComponentById(id)

    res.status(200).json(salaryComponent)
  } catch (error) {
    next(error)
  }
}

export const editSalaryComponentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_salary_component')
    const id = Number(req.params.id)
    const salaryComponentData = editSalaryComponentSchema.parse(req.body)
    const salaryComponent = await editSalaryComponent(id, salaryComponentData)

    res.status(200).json(salaryComponent)
  } catch (error) {
    next(error)
  }
}

export const deleteSalaryComponentController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'delete_salary_component')
    const salaryComponentId = Number(req.params.id);

    const result = await deleteSalaryComponent(salaryComponentId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
