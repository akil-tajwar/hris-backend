import { Request, Response } from 'express'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  employeeAttendanceReport,
  loneReport,
  salaryReport,
} from '../services/reports.service'

export const employeeAttendanceReportController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_attendance_report')
    const { fromDate, toDate } = req.query

    // Validate required query parameters
    if (!fromDate || !toDate) {
      res.status(400).json({
        success: false,
        message: 'fromDate and toDate are required',
      })
    }

    const data = await employeeAttendanceReport(
      fromDate as string,
      toDate as string
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

    const data = await salaryReport(salaryMonth as SalaryMonth, year)

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

export const loneReportController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'view_lone_report')

    const { fromDate, toDate } = req.query

    if (!fromDate || !toDate) {
      res.status(400).json({
        success: false,
        message: 'fromDate and toDate are required',
      })
    }

    const data = await loneReport(fromDate as string, toDate as string)

    res.status(200).json(data)
  } catch (error) {
    console.error('Lone report error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch lone report',
    })
  }
}
