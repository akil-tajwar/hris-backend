import { Request, Response } from 'express'
import {
  getEmployeeAttendanceSummary,
  getEmployeeLeaveSummary,
} from '../services/dashboard.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const getEmployeeLeaveSummaryController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_dashboard')
    const data = await getEmployeeLeaveSummary()

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

    const data = await getEmployeeAttendanceSummary()

    res.status(200).json(data)
  } catch (error) {
    console.error('Attendance Summary Error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee attendance summary',
    })
  }
}
