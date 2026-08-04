import { NextFunction, Request, Response } from 'express'
import {
  getEmployeeAttendanceSummary,
  getEmployeeLeaveSummary,
  getEmployeeLoneSummary,
  getSalaryStatus,
} from '../services/dashboard.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const getEmployeeLeaveSummaryController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_dashboard')

    const tenantId = req.user?.tenantId

    if (!tenantId) {
      res.status(403).json({
        status: 'error',
        message: 'Tenant not found',
      })
      return
    }
    const data = await getEmployeeLeaveSummary(tenantId)

    res.status(200).json(data)
  } catch (error) {
    console.error('Leave Summary Error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee leave summary',
    })
  }
}

export const getEmployeeAttendanceSummaryController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_dashboard')
    const tenantId = req.user?.tenantId

    if (!tenantId) {
      res.status(403).json({
        status: 'error',
        message: 'Tenant not found',
      })
      return
    }

    const data = await getEmployeeAttendanceSummary(tenantId)

    res.status(200).json(data)
  } catch (error) {
    console.error('Attendance Summary Error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee attendance summary',
    })
  }
}

export const getSalaryStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_dashboard')
    const tenantId = req.user?.tenantId

    if (!tenantId) {
      res.status(403).json({
        status: 'error',
        message: 'Tenant not found',
      })
      return
    }

    const data = await getSalaryStatus(tenantId)

    res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}

export const getEmployeeLoneSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_dashboard')
    const tenantId = req.user?.tenantId

    if (!tenantId) {
      res.status(403).json({
        status: 'error',
        message: 'Tenant not found',
      })
      return
    }

    const data = await getEmployeeLoneSummary(tenantId)

    res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}