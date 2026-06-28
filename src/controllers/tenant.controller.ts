import { Request, Response, NextFunction } from 'express'
import {
  createTenant,
  getTenants,
  updateTenant,
  deleteTenant,
} from '../services/tenant.service'

export const createTenantController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    const tenant = await createTenant(req.body)
    res.status(201).json({ status: 'success', data: tenant })
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
    const tenants = await getTenants()
    res.json(tenants)
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
    const { tenantId } = req.params
    const { tenantName, updatedBy } = req.body

    const tenant = await updateTenant(Number(tenantId), tenantName, updatedBy)
    res.json({ status: 'success', data: tenant })
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
    const { tenantId } = req.params
    await deleteTenant(Number(tenantId))
    res.json({ status: 'success', message: 'Tenant deleted' })
  } catch (err) {
    next(err)
  }
}
