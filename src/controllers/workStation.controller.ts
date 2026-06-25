import { Request, Response, NextFunction } from 'express'
import {
  createWorkStation,
  getWorkStations,
  getWorkStationById,
  updateWorkStation,
  deleteWorkStation,
} from '../services/workStation.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createWorkStationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_work_station')
    const tenantId = req.user?.tenantId
    const data = {
      ...req.body,
      tenantId,
    }
    const workStation = await createWorkStation(data)
    res.status(201).json({ status: 'success', data: workStation })
  } catch (err) {
    next(err)
  }
}

export const getWorkStationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_work_station')
    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }
    const workStations = await getWorkStations(tenantId)
    res.json(workStations)
  } catch (err) {
    next(err)
  }
}

export const getWorkStationByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_work_station')
    const { workStationId } = req.params
    const workStation = await getWorkStationById(Number(workStationId))
    res.json({ status: 'success', data: workStation })
  } catch (err) {
    next(err)
  }
}

export const updateWorkStationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_work_station')
    const { workStationId } = req.params
    const { workStationName, workStationNumber, updatedBy } = req.body

    const workStation = await updateWorkStation(
      Number(workStationId),
      workStationName,
      workStationNumber,
      updatedBy
    )
    res.json({ status: 'success', data: workStation })
  } catch (err) {
    next(err)
  }
}

export const deleteWorkStationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_work_station')
    const { workStationId } = req.params
    await deleteWorkStation(Number(workStationId))
    res.json({ status: 'success', message: 'Work Station deleted' })
  } catch (err) {
    next(err)
  }
}
