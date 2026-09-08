import { Request, Response, NextFunction } from 'express'
import {
  createOfficeLocation,
  getAllOfficeLocations,
  updateOfficeLocation,
  deleteOfficeLocation,
} from '../services/officeLocations.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createOfficeLocationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_office_location')

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }
    const data = {
      ...req.body,
      tenantId,
    }

    const officeLocation = await createOfficeLocation(data)
    res.status(201).json({ status: 'success', data: officeLocation })
  } catch (err) {
    next(err)
  }
}

export const getOfficeLocationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_office_location')
    
    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const officeLocations = await getAllOfficeLocations(tenantId)

    res.json(officeLocations)
  } catch (err) {
    next(err)
  }
}

export const updateOfficeLocationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_office_location')
    const { officeLocationId } = req.params
    const officeLocation = await updateOfficeLocation(
      Number(officeLocationId),
      req.body,
    )
    res.json({ status: 'success', data: officeLocation })
  } catch (err) {
    next(err)
  }
}

export const deleteOfficeLocationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_office_location')
    const { officeLocationId } = req.params
    await deleteOfficeLocation(Number(officeLocationId))
    res.json({ status: 'success', message: 'OfficeLocation deleted' })
  } catch (err) {
    next(err)
  }
}
