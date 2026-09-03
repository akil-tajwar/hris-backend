import { NextFunction, Request, Response } from 'express'

import {
  getEmployeeAttendanceSummary,
  getEmployeeDepartmentHeadStatus,
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

    // Extract all optional query parameters
    const companyId = req.query.companyId
      ? Number(req.query.companyId)
      : undefined
    const departmentId = req.query.departmentId
      ? Number(req.query.departmentId)
      : undefined
    const userId = req.query.userId ? Number(req.query.userId) : undefined

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

    // Validate userId if provided
    if (userId !== undefined && (Number.isNaN(userId) || userId <= 0)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid userId',
      })
      return
    }

    const data = await getEmployeeLeaveSummary(
      tenantId,
      companyId,
      departmentId,
      userId
    )

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

    // Extract all optional query parameters
    const companyId = req.query.companyId
      ? Number(req.query.companyId)
      : undefined
    const departmentId = req.query.departmentId
      ? Number(req.query.departmentId)
      : undefined
    const userId = req.query.userId ? Number(req.query.userId) : undefined

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

    // Validate userId if provided
    if (userId !== undefined && (Number.isNaN(userId) || userId <= 0)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid userId',
      })
      return
    }

    const data = await getEmployeeAttendanceSummary(
      tenantId,
      companyId,
      departmentId,
      userId
    )

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

    // Extract all optional query parameters
    const companyId = req.query.companyId
      ? Number(req.query.companyId)
      : undefined
    const departmentId = req.query.departmentId
      ? Number(req.query.departmentId)
      : undefined
    const userId = req.query.userId ? Number(req.query.userId) : undefined

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

    // Validate userId if provided
    if (userId !== undefined && (Number.isNaN(userId) || userId <= 0)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid userId',
      })
      return
    }

    const data = await getSalaryStatus(
      tenantId,
      companyId,
      departmentId,
      userId
    )

    res.status(200).json(data)
  } catch (err) {
    console.error('Salary Status Error:', err)
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

    // Extract all optional query parameters
    const companyId = req.query.companyId
      ? Number(req.query.companyId)
      : undefined
    const departmentId = req.query.departmentId
      ? Number(req.query.departmentId)
      : undefined
    const userId = req.query.userId ? Number(req.query.userId) : undefined

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

    // Validate userId if provided
    if (userId !== undefined && (Number.isNaN(userId) || userId <= 0)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid userId',
      })
      return
    }

    const data = await getEmployeeLoneSummary(
      tenantId,
      companyId,
      departmentId,
      userId
    )

    res.status(200).json(data)
  } catch (err) {
    console.error('Loan Summary Error:', err)
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

    // Extract all optional query parameters
    const companyId = req.query.companyId
      ? Number(req.query.companyId)
      : undefined
    const departmentId = req.query.departmentId
      ? Number(req.query.departmentId)
      : undefined
    const userId = req.query.userId ? Number(req.query.userId) : undefined

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

    // Validate userId if provided
    if (userId !== undefined && (Number.isNaN(userId) || userId <= 0)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid userId',
      })
      return
    }

    const data = await getEmployeeLateAndEarlyOutSummary(
      tenantId,
      companyId,
      departmentId,
      userId
    )

    res.status(200).json(data)
  } catch (err) {
    console.error('Late & Early Out Summary Error:', err)
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

    // Extract all optional query parameters
    const companyId = req.query.companyId
      ? Number(req.query.companyId)
      : undefined
    const departmentId = req.query.departmentId
      ? Number(req.query.departmentId)
      : undefined
    const userId = req.query.userId ? Number(req.query.userId) : undefined

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

    // Validate userId if provided
    if (userId !== undefined && (Number.isNaN(userId) || userId <= 0)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid userId',
      })
      return
    }

    const data = await getEmployeeHeadCountSummary(
      tenantId,
      companyId,
      departmentId,
      userId
    )

    res.status(200).json(data)
  } catch (err) {
    console.error('Head Count Summary Error:', err)
    next(err)
  }
}

/* =========================================================
   EMPLOYEE DEPARTMENT HEAD STATUS
========================================================= */

export const getEmployeeDepartmentHeadStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_dashboard')

    const tenantId = req.user?.tenantId

    // For department head status, userId comes from params
    const userId = req.params.userId
      ? Number(req.params.userId)
      : req.query.userId
        ? Number(req.query.userId)
        : undefined

    if (!tenantId) {
      res.status(403).json({
        status: 'error',
        message: 'Tenant not found',
      })
      return
    }

    if (userId === undefined || Number.isNaN(userId) || userId <= 0) {
      res.status(400).json({
        status: 'error',
        message: 'Valid userId is required',
      })
      return
    }

    const data = await getEmployeeDepartmentHeadStatus(tenantId, userId)

    res.status(200).json(data)
  } catch (error) {
    console.error('Department Head Status Error:', error)

    next(error)
  }
}
