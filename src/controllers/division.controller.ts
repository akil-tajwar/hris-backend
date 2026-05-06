import { Request, Response, NextFunction } from 'express'
import {
  createDivision,
  getDivisions,
  getDivisionById,
  updateDivision,
  deleteDivision,
} from '../services/division.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createDivisionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_division')
    const { divisionName, divisionId, createdBy } = req.body
    const division = await createDivision(divisionName, divisionId, createdBy)
    res.status(201).json({ status: 'success', data: division })
  } catch (err) {
    next(err)
  }
}

export const getDivisionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_division')
    const divisions = await getDivisions()
    res.json(divisions)
  } catch (err) {
    next(err)
  }
}

export const getDivisionByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_division')
    const { divisionId } = req.params
    const division = await getDivisionById(Number(divisionId))
    res.json({ status: 'success', data: division })
  } catch (err) {
    next(err)
  }
}

export const updateDivisionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_division')
    const { divisionId } = req.params
    const { divisionName, updatedBy } = req.body

    const division = await updateDivision(Number(divisionId), divisionName, updatedBy)
    res.json({ status: 'success', data: division })
  } catch (err) {
    next(err)
  }
}

export const deleteDivisionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_division')
    const { divisionId } = req.params
    await deleteDivision(Number(divisionId))
    res.json({ status: 'success', message: 'Division deleted' })
  } catch (err) {
    next(err)
  }
}