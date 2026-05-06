import { Request, Response, NextFunction } from 'express'
import {
  createDesignation,
  getDesignations,
  updateDesignation,
  deleteDesignation,
} from '../services/designations.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createDesignationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_designation')
    const { designationName, createdBy } = req.body
    const designation = await createDesignation(designationName, createdBy)
    res.status(201).json({ status: 'success', data: designation })
  } catch (err) {
    next(err)
  }
}

export const getDesignationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_designation')
    const designations = await getDesignations()
    res.json(designations)
  } catch (err) {
    next(err)
  }
}

export const updateDesignationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_designation')
    const { designationId } = req.params
    const { designationName, updatedBy } = req.body

    const designation = await updateDesignation(
      Number(designationId),
      designationName,
      updatedBy
    )
    res.json({ status: 'success', data: designation })
  } catch (err) {
    next(err)
  }
}

export const deleteDesignationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_designation')
    const { designationId } = req.params
    await deleteDesignation(Number(designationId))
    res.json({ status: 'success', message: 'Designation deleted' })
  } catch (err) {
    next(err)
  }
}
