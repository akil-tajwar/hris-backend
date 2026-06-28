import { Request, Response } from 'express'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  dailyAttendanceReport,
  attendanceSummaryReport,
  getLeaveBalanceSummaryReport,
  leaveLedgerReport,
} from '../services/reports.service'
import {
  employeeActivitiesReport,
  employeeAttendanceReport,
  salaryReport,
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

const validMonths: SalaryMonth[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const salaryReportController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'view_salary_report')
    const { salaryMonth, salaryYear } = req.query
    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    // Validate required query parameters
    if (!salaryMonth || !salaryYear) {
      res.status(400).json({
        success: false,
        message: 'salaryMonth and salaryYear are required',
      })
    }

    // Validate salaryMonth is a string and is a valid month
    if (typeof salaryMonth !== 'string') {
      res.status(400).json({
        success: false,
        message: 'salaryMonth must be a string',
      })
    }

    // Check if salaryMonth is a valid month name
    if (!validMonths.includes(salaryMonth as SalaryMonth)) {
      res.status(400).json({
        success: false,
        message: `Invalid salaryMonth. Must be one of: ${validMonths.join(', ')}`,
      })
    }

    // Validate salaryYear
    const year = Number(salaryYear)
    if (isNaN(year) || !Number.isInteger(year) || year < 2000 || year > 2100) {
      res.status(400).json({
        success: false,
        message: 'salaryYear must be a valid year between 2000 and 2100',
      })
    }

    const data = await salaryReport(salaryMonth as SalaryMonth, year, tenantId)

    res.status(200).json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Salary report error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary report',
    })
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
