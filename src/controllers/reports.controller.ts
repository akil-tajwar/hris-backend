import { NextFunction, Request, Response } from 'express'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  dailyAttendanceReport,
  attendanceSummaryReport,
  getLeaveBalanceSummaryReport,
  leaveLedgerReport,
  shiftReport,
  getIndividualAttendanceSummary,
  salaryReport,
  employeeActivitiesReport,
  employeeAttendanceReport,
} from '../services/reports.service'

export const employeeActivitiesReportController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_report')

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }
    const employeeId = Number(req.query.employeeId)

    if (!employeeId || isNaN(employeeId)) {
      res.status(400).json({
        success: false,
        message: 'Valid employeeId is required',
      })
    }

    const data = await employeeActivitiesReport(employeeId, tenantId)

    res.status(200).json(data)
  } catch (error) {
    console.error('Employee activity report error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee activity report',
    })
  }
}

export const employeeAttendanceReportController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_attendance_report')
    const { fromDate, toDate } = req.query
    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }
    // Validate required query parameters
    if (!fromDate || !toDate) {
      res.status(400).json({
        success: false,
        message: 'fromDate and toDate are required',
      })
    }

    const data = await employeeAttendanceReport(
      fromDate as string,
      toDate as string,
      tenantId
    )

    res.status(200).json(data)
  } catch (error) {
    console.error('Attendance report error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance report',
    })
  }
}

// Define the SalaryMonth type (should match your enum)
type SalaryMonth =
  | 'January'
  | 'February'
  | 'March'
  | 'April'
  | 'May'
  | 'June'
  | 'July'
  | 'August'
  | 'September'
  | 'October'
  | 'November'
  | 'December'

export const salaryReportController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_report')

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const { salaryMonth, salaryYear } = req.query

    if (!salaryMonth || !salaryYear) {
      res.status(400).json({
        message: 'salaryMonth and salaryYear are required',
      })
    }

    const data = await salaryReport(
      tenantId,
      String(salaryMonth),
      Number(salaryYear)
    )

    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const dailyAttendanceReportController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // requirePermission(req, 'view_attendance_report')
    const { date } = req.query
    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }
    if (!date) {
      res.status(400).json({
        success: false,
        message: 'date is required (format: YYYY-MM-DD)',
      })
      return // ← return শুধু এখানে, res.status এর আগে না
    }

    const data = await dailyAttendanceReport(date as string, tenantId)
    res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Daily attendance report error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily attendance report',
    })
  }
}

export const attendanceSummaryReportController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // requirePermission(req, 'view_attendance_report')
    const { fromDate, toDate } = req.query
    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }
    if (!fromDate || !toDate) {
      res.status(400).json({
        success: false,
        message: 'fromDate and toDate are required',
      })
      return
    }

    const data = await attendanceSummaryReport(
      fromDate as string,
      toDate as string,
      tenantId
    )
    res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Attendance summary report error:', error)
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch attendance summary' })
  }
}

export const getLeaveBalanceSummaryReportController = async (
  req: Request,
  res: Response
) => {
  try {
    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }
    const data = await getLeaveBalanceSummaryReport(tenantId)

    res.status(200).json(data)
  } catch (error) {
    console.error('Controller Error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
    })
  }
}

export const leaveLedgerReportController = async (
  req: Request,
  res: Response
) => {
  try {
    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const data = await leaveLedgerReport(tenantId)

    res.status(200).json(data)
  } catch (error) {
    console.error('Controller Error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave ledger report',
    })
  }
}

export const shiftReportController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_report')

    const tenantId = req.user?.tenantId

    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const { date } = req.query

    if (!date || typeof date !== 'string') {
      res.status(400).json({
        success: false,
        message: 'date is required',
      })
      return
    }

    const parsedDate = new Date(date)

    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
      })
      return
    }

    const data = await shiftReport(date, tenantId)

    res.status(200).json(data)
  } catch (error) {
    console.error('Shift report error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch shift report',
    })
  }
}

export const getIndividualAttendanceSummaryController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_report')

    const tenantId = req.user?.tenantId

    if (!tenantId) {
      res.status(400).json({
        message: 'Tenant not found',
      })
      return
    }

    const { fromDate, toDate } = req.query

    if (!fromDate || !toDate) {
      res.status(400).json({
        message: 'fromDate and toDate are required',
      })
    }

    const data = await getIndividualAttendanceSummary(
      tenantId,
      String(fromDate),
      String(toDate)
    )

    res.json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Internal Server Error',
    })
  }
}