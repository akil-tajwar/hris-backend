import { NextFunction, Request, Response } from 'express'
import {
  getEmployeeAttendanceSummary,
  getEmployeeHeadCountSummary,
  getEmployeeLateAndEarlyOutSummary,
  getEmployeeLeaveSummary,
  getEmployeeLoneSummary,
  getSalaryStatus,
} from '../services/dashboard.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const getEmployeeLeaveSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_dashboard')

    const tenantId = req.user?.tenantId

    // Parse query parameters - all optional
    const companyId = req.query.companyId
      ? Number(req.query.companyId)
      : undefined
    const departmentId = req.query.departmentId
      ? Number(req.query.departmentId)
      : undefined

    if (!tenantId) {
      res.status(403).json({
        status: 'error',
        message: 'Tenant not found',
      })
      return
    }

    // Validate companyId if provided
    if (
      companyId !== undefined &&
      (Number.isNaN(companyId) || companyId <= 0)
    ) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid companyId',
      })
      return
    }

    // Validate departmentId if provided
    if (
      departmentId !== undefined &&
      (Number.isNaN(departmentId) || departmentId <= 0)
    ) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid departmentId',
      })
      return
    }

    const data = await getEmployeeLeaveSummary(
      tenantId,
      companyId,
      departmentId
    )

    res.status(200).json({
      success: true,
      data,
    })
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
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_dashboard')

    const tenantId = req.user?.tenantId

    // Parse query parameters - all optional
    const companyId = req.query.companyId
      ? Number(req.query.companyId)
      : undefined
    const departmentId = req.query.departmentId
      ? Number(req.query.departmentId)
      : undefined

    if (!tenantId) {
      res.status(403).json({
        status: 'error',
        message: 'Tenant not found',
      })
      return
    }

    // Validate companyId if provided
    if (
      companyId !== undefined &&
      (Number.isNaN(companyId) || companyId <= 0)
    ) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid companyId',
      })
      return
    }

    // Validate departmentId if provided
    if (
      departmentId !== undefined &&
      (Number.isNaN(departmentId) || departmentId <= 0)
    ) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid departmentId',
      })
      return
    }

    const data = await getEmployeeAttendanceSummary(
      tenantId,
      companyId,
      departmentId
    )

    res.status(200).json({
      success: true,
      data,
    })
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

    // Parse query parameters - all optional
    const companyId = req.query.companyId
      ? Number(req.query.companyId)
      : undefined
    const departmentId = req.query.departmentId
      ? Number(req.query.departmentId)
      : undefined

    if (!tenantId) {
      res.status(403).json({
        status: 'error',
        message: 'Tenant not found',
      })
      return
    }

    // Validate companyId if provided
    if (
      companyId !== undefined &&
      (Number.isNaN(companyId) || companyId <= 0)
    ) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid companyId',
      })
      return
    }

    // Validate departmentId if provided
    if (
      departmentId !== undefined &&
      (Number.isNaN(departmentId) || departmentId <= 0)
    ) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid departmentId',
      })
      return
    }

    const data = await getSalaryStatus(tenantId, companyId, departmentId)

    res.status(200).json({
      success: true,
      data,
    })
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

    // Parse query parameters - all optional
    const companyId = req.query.companyId
      ? Number(req.query.companyId)
      : undefined
    const departmentId = req.query.departmentId
      ? Number(req.query.departmentId)
      : undefined

    if (!tenantId) {
      res.status(403).json({
        status: 'error',
        message: 'Tenant not found',
      })
      return
    }

    // Validate companyId if provided
    if (
      companyId !== undefined &&
      (Number.isNaN(companyId) || companyId <= 0)
    ) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid companyId',
      })
      return
    }

    // Validate departmentId if provided
    if (
      departmentId !== undefined &&
      (Number.isNaN(departmentId) || departmentId <= 0)
    ) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid departmentId',
      })
      return
    }

    const data = await getEmployeeLoneSummary(tenantId, companyId, departmentId)

    res.status(200).json({
      success: true,
      data,
    })
  } catch (err) {
    next(err)
  }
}

export const getEmployeeLateAndEarlyOutSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_dashboard')

    const tenantId = req.user?.tenantId

    // Parse query parameters - all optional
    const companyId = req.query.companyId
      ? Number(req.query.companyId)
      : undefined
    const departmentId = req.query.departmentId
      ? Number(req.query.departmentId)
      : undefined

    if (!tenantId) {
      res.status(403).json({
        status: 'error',
        message: 'Tenant not found',
      })
      return
    }

    // Validate companyId if provided
    if (
      companyId !== undefined &&
      (Number.isNaN(companyId) || companyId <= 0)
    ) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid companyId',
      })
      return
    }

    // Validate departmentId if provided
    if (
      departmentId !== undefined &&
      (Number.isNaN(departmentId) || departmentId <= 0)
    ) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid departmentId',
      })
      return
    }

    const data = await getEmployeeLateAndEarlyOutSummary(
      tenantId,
      companyId,
      departmentId
    )

    res.status(200).json({
      success: true,
      data,
    })
  } catch (err) {
    next(err)
  }
}

export const getEmployeeHeadCountSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_dashboard')

    const tenantId = req.user?.tenantId

    // Parse query parameters - all optional
    const companyId = req.query.companyId
      ? Number(req.query.companyId)
      : undefined
    const departmentId = req.query.departmentId
      ? Number(req.query.departmentId)
      : undefined

    if (!tenantId) {
      res.status(403).json({
        status: 'error',
        message: 'Tenant not found',
      })
      return
    }

    // Validate companyId if provided
    if (
      companyId !== undefined &&
      (Number.isNaN(companyId) || companyId <= 0)
    ) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid companyId',
      })
      return
    }

    // Validate departmentId if provided
    if (
      departmentId !== undefined &&
      (Number.isNaN(departmentId) || departmentId <= 0)
    ) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid departmentId',
      })
      return
    }

    const data = await getEmployeeHeadCountSummary(
      tenantId,
      companyId,
      departmentId
    )

    res.status(200).json({
      success: true,
      data,
    })
  } catch (err) {
    next(err)
  }
}
