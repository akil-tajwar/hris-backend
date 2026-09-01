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

/* =========================================================
   EMPLOYEE LEAVE SUMMARY
========================================================= */

export const getEmployeeLeaveSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_dashboard')

    const tenantId = req.user?.tenantId

    const userId = req.query.userId ? Number(req.query.userId) : undefined

    if (!tenantId) {
      res.status(403).json({
        status: 'error',
        message: 'Tenant not found',
      })
      return
    }

    if (userId !== undefined && (Number.isNaN(userId) || userId <= 0)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid userId',
      })
      return
    }

    const data = await getEmployeeLeaveSummary(tenantId, userId)

    res.status(200).json(data)
  } catch (error) {
    console.error('Leave Summary Error:', error)

    next(error)
  }
}

/* =========================================================
   EMPLOYEE ATTENDANCE SUMMARY
========================================================= */

export const getEmployeeAttendanceSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_dashboard')

    const tenantId = req.user?.tenantId

    const userId = req.query.userId ? Number(req.query.userId) : undefined

    if (!tenantId) {
      res.status(403).json({
        status: 'error',
        message: 'Tenant not found',
      })
      return
    }

    if (userId !== undefined && (Number.isNaN(userId) || userId <= 0)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid userId',
      })
      return
    }

    const data = await getEmployeeAttendanceSummary(tenantId, userId)

    res.status(200).json(data)
  } catch (error) {
    console.error('Attendance Summary Error:', error)

    next(error)
  }
}

/* =========================================================
   SALARY STATUS
========================================================= */

export const getSalaryStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_dashboard')

    const tenantId = req.user?.tenantId

    const userId = req.query.userId ? Number(req.query.userId) : undefined

    if (!tenantId) {
      res.status(403).json({
        status: 'error',
        message: 'Tenant not found',
      })
      return
    }

    if (userId !== undefined && (Number.isNaN(userId) || userId <= 0)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid userId',
      })
      return
    }

    const data = await getSalaryStatus(tenantId, userId)

    res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}

/* =========================================================
   EMPLOYEE LOAN SUMMARY
========================================================= */

export const getEmployeeLoneSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_dashboard')

    const tenantId = req.user?.tenantId

    const userId = req.query.userId ? Number(req.query.userId) : undefined

    if (!tenantId) {
      res.status(403).json({
        status: 'error',
        message: 'Tenant not found',
      })
      return
    }

    if (userId !== undefined && (Number.isNaN(userId) || userId <= 0)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid userId',
      })
      return
    }

    const data = await getEmployeeLoneSummary(tenantId, userId)

    res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}

/* =========================================================
   LATE & EARLY OUT SUMMARY
========================================================= */

export const getEmployeeLateAndEarlyOutSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_dashboard')

    const tenantId = req.user?.tenantId

    const userId = req.query.userId ? Number(req.query.userId) : undefined

    if (!tenantId) {
      res.status(403).json({
        status: 'error',
        message: 'Tenant not found',
      })
      return
    }

    if (userId !== undefined && (Number.isNaN(userId) || userId <= 0)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid userId',
      })
      return
    }

    const data = await getEmployeeLateAndEarlyOutSummary(tenantId, userId)

    res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}

/* =========================================================
   EMPLOYEE HEAD COUNT SUMMARY
========================================================= */

export const getEmployeeHeadCountSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_dashboard')

    const tenantId = req.user?.tenantId

    const userId = req.query.userId ? Number(req.query.userId) : undefined

    if (!tenantId) {
      res.status(403).json({
        status: 'error',
        message: 'Tenant not found',
      })
      return
    }

    if (userId !== undefined && (Number.isNaN(userId) || userId <= 0)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid userId',
      })
      return
    }

    const data = await getEmployeeHeadCountSummary(tenantId, userId)

    res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}
