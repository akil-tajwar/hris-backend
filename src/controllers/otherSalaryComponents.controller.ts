import { NextFunction, Request, Response } from 'express'
import { createInsertSchema } from 'drizzle-zod'
import { otherSalaryComponentsModel } from '../schemas'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  createOtherSalaryComponent,
  deleteOtherSalaryComponent,
  editOtherSalaryComponent,
  getAllOtherSalaryComponents,
  getOtherSalaryComponentById,
} from '../services/otherSalaryComponents.service'

// Schema validation
const createOtherSalaryComponentSchema = createInsertSchema(otherSalaryComponentsModel).omit({
  otherSalaryComponentId: true,
})

const editOtherSalaryComponentSchema = createOtherSalaryComponentSchema.partial()

export const createOtherSalaryComponentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_other_salary_component')
    const otherSalaryComponentData = createOtherSalaryComponentSchema.parse(req.body)
    console.log("🚀 ~ createOtherSalaryComponentController ~ otherSalaryComponentData:", otherSalaryComponentData)
    const otherSalaryComponent = await createOtherSalaryComponent(otherSalaryComponentData)

    res.status(201).json({
      status: 'success',
      data: otherSalaryComponent,
    })
  } catch (error) {
    next(error)
  }
}

export const getAllOtherSalaryComponentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_other_salary_component')
    const otherSalaryComponents = await getAllOtherSalaryComponents()

    res.status(200).json(otherSalaryComponents)
  } catch (error) {
    next(error)
  }
}

export const getOtherSalaryComponentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_other_salary_component')
    const id = Number(req.params.id)
    const otherSalaryComponent = await getOtherSalaryComponentById(id)

    res.status(200).json(otherSalaryComponent)
  } catch (error) {
    next(error)
  }
}

export const editOtherSalaryComponentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_other_salary_component')
    const id = Number(req.params.id)
    const otherSalaryComponentData = editOtherSalaryComponentSchema.parse(req.body)
    const otherSalaryComponent = await editOtherSalaryComponent(id, otherSalaryComponentData)

    res.status(200).json(otherSalaryComponent)
  } catch (error) {
    next(error)
  }
}

export const deleteOtherSalaryComponentController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'delete_other_salary_component')
    const otherSalaryComponentId = Number(req.params.id);

    const result = await deleteOtherSalaryComponent(otherSalaryComponentId);

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
