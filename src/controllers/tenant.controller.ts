import { Request, Response, NextFunction } from 'express'
import {
  createTenant,
  getTenants,
  updateTenant,
  deleteTenant,
} from '../services/tenant.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createTenantController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    requirePermission(req, 'create_tenat')
    const tenat = await createTenant(req.body)
    res.status(201).json({ status: 'success', data: tenat })
  } catch (err) {
    next(err)
  }
}

export const getTenantsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    requirePermission(req, 'view_tenat')
    const tenats = await getTenants()
    res.json(tenats)
  } catch (err) {
    next(err)
  }
}

export const updateTenantController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    requirePermission(req, 'edit_tenat')
    const { tenatId } = req.params
    const { tenatName, updatedBy } = req.body

    const tenat = await updateTenant(Number(tenatId), tenatName, updatedBy)
    res.json({ status: 'success', data: tenat })
  } catch (err) {
    next(err)
  }
}

export const deleteTenantController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    requirePermission(req, 'delete_tenat')
    const { tenatId } = req.params
    await deleteTenant(Number(tenatId))
    res.json({ status: 'success', message: 'Tenant deleted' })
  } catch (err) {
    next(err)
  }
}
