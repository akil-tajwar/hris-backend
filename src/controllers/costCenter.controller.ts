import { Request, Response, NextFunction } from 'express'
import {
  createCostCenter,
  getCostCenters,
  getCostCenterById,
  updateCostCenter,
  deleteCostCenter,
} from '../services/costCenter.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createCostCenterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_cost_center')
    const { costCenterName, costCenterId, createdBy } = req.body
    const costCenter = await createCostCenter(costCenterName, costCenterId, createdBy)
    res.status(201).json({ status: 'success', data: costCenter })
  } catch (err) {
    next(err)
  }
}

export const getCostCentersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_cost_center')
    const costCenters = await getCostCenters()
    res.json(costCenters)
  } catch (err) {
    next(err)
  }
}

export const getCostCenterByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_cost_center')
    const { costCenterId } = req.params
    const costCenter = await getCostCenterById(Number(costCenterId))
    res.json({ status: 'success', data: costCenter })
  } catch (err) {
    next(err)
  }
}

export const updateCostCenterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_cost_center')
    const { costCenterId } = req.params
    const { costCenterName, updatedBy } = req.body

    const costCenter = await updateCostCenter(Number(costCenterId), costCenterName, updatedBy)
    res.json({ status: 'success', data: costCenter })
  } catch (err) {
    next(err)
  }
}

export const deleteCostCenterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_cost_center')
    const { costCenterId } = req.params
    await deleteCostCenter(Number(costCenterId))
    res.json({ status: 'success', message: 'Cost Center deleted' })
  } catch (err) {
    next(err)
  }
}