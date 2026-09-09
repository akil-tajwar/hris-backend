import { Request, Response, NextFunction } from 'express'

import {
  getAllEmployeeOfficeLocations,
  createEmployeeOfficeLocations,
  updateEmployeeOfficeLocation,
  deleteEmployeeOfficeLocation,
} from '../services/employeeOfficeLocations.service'

/**
 * GET ALL
 */
export const getAllEmployeeOfficeLocationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.user?.tenantId

    if (!tenantId) {
      res.status(401).json({
        success: false,
        message: 'Tenant not found',
      })
      return
    }

    const data = await getAllEmployeeOfficeLocations(tenantId)

    res.status(200).json(data)
  } catch (error) {
    next(error)
  }
}

/**
 * BULK CREATE
 */
export const createEmployeeOfficeLocationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.user?.tenantId
    const userId = req.user?.userId

    if (!tenantId || !userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      })
      return
    }

    const data = req.body

    const result = await createEmployeeOfficeLocations(tenantId, userId, data)

    res.status(201).json({
      success: true,
      message: 'Employee office locations created successfully',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * EDIT ONE
 *
 * employeeOfficeLocationId comes from params
 */
export const updateEmployeeOfficeLocationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.user?.tenantId
    const userId = req.user?.userId

    const employeeOfficeLocationId = Number(req.params.employeeOfficeLocationId)

    if (!tenantId || !userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      })
      return
    }

    if (Number.isNaN(employeeOfficeLocationId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid employee office location ID',
      })
      return
    }

    const result = await updateEmployeeOfficeLocation(
      tenantId,
      userId,
      employeeOfficeLocationId,
      req.body
    )

    res.status(200).json({
      success: true,
      message: 'Employee office location updated successfully',
      data: result[0],
    })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE ONE
 *
 * employeeOfficeLocationId comes from params
 */
export const deleteEmployeeOfficeLocationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.user?.tenantId

    const employeeOfficeLocationId = Number(req.params.employeeOfficeLocationId)

    if (!tenantId) {
      res.status(401).json({
        success: false,
        message: 'Tenant not found',
      })
      return
    }

    if (Number.isNaN(employeeOfficeLocationId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid employee office location ID',
      })
      return
    }

    await deleteEmployeeOfficeLocation(tenantId, employeeOfficeLocationId)

    res.status(200).json({
      success: true,
      message: 'Employee office location deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}
