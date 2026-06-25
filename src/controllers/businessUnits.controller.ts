import { Request, Response, NextFunction } from 'express'
import {
  createBusinessUnit,
  getBusinessUnits,
  updateBusinessUnit,
  deleteBusinessUnit,
} from '../services/businessUnits.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createBusinessUnitController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_business_unit')
    const tenantId = req.user?.tenantId
    const data = {
      ...req.body,
      tenantId,
    }
    const businessUnit = await createBusinessUnit(data)
    res.status(201).json({ status: 'success', data: businessUnit })
  } catch (err) {
    next(err)
  }
}

export const getBusinessUnitsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_business_unit')
    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }
    const businessUnits = await getBusinessUnits(tenantId)
    res.json(businessUnits)
  } catch (err) {
    next(err)
  }
}

export const updateBusinessUnitController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_business_unit')
    const { businessUnitId } = req.params
    const businessUnit = await updateBusinessUnit({
      businessUnitId: Number(businessUnitId),
      ...req.body,
    })
    res.json({ status: 'success', data: businessUnit })
  } catch (err) {
    next(err)
  }
}

export const deleteBusinessUnitController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_business_unit')
    const { businessUnitId } = req.params
    await deleteBusinessUnit(Number(businessUnitId))
    res.json({ status: 'success', message: 'BusinessUnit deleted' })
  } catch (err) {
    next(err)
  }
}
