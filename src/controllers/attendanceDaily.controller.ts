import { Request, Response } from 'express'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  createAttendanceDaily,
  updateAttendanceDaily,
  getAllAttendanceDaily,
  getAttendanceDailyById,
  getAttendanceDailyByEmployee,
  deleteAttendanceDaily,
} from '../services/attendanceDaily.service'

export const createAttendanceDailyController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'create_attendance_daily')

    const tenantId = req.user?.tenantId
    const data = {
      ...req.body,
      tenantId,
    }

    const attendanceDaily = await createAttendanceDaily(data)
    res.status(201).json(attendanceDaily)
  } catch (error: any) {
    console.error('❌ Attendance Daily create error:', error)
    res
      .status(400)
      .json({
        success: false,
        message: error.message || 'Something went wrong',
      })
  }
}

export const updateAttendanceDailyController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'edit_attendance_daily')
    const id = Number(req.params.id)
    if (!id) {
      res.status(400).json({ message: 'Invalid ID' })
      return
    }

    const data = await updateAttendanceDaily(id, req.body)
    res.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ Attendance Daily update error:', error)
    res
      .status(500)
      .json({
        success: false,
        message: error.message || 'Internal server error',
      })
  }
}

export const getAllAttendanceDailyController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_attendance_daily')

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const employeeId = Number(req.query.employeeId) || undefined

    const fromDate = (req.query.fromDate as string) || undefined
    const toDate = (req.query.toDate as string) || undefined

    const data = await getAllAttendanceDaily(
      tenantId,
      employeeId,
      fromDate,
      toDate
    )

    res.json(data)
  } catch (error) {
    console.error('❌ Get All Attendance Daily error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const getAttendanceDailyByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_attendance_daily')
    const id = Number(req.params.id)
    if (!id) {
      res.status(400).json({ message: 'Invalid ID' })
      return
    }

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const data = await getAttendanceDailyById(id, tenantId)
    if (!data) {
      res.status(404).json({ success: false, message: 'Not found' })
      return
    }

    res.json(data)
  } catch (error) {
    console.error('❌ Get Attendance Daily By ID error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const getAttendanceDailyByEmployeeController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_attendance_daily')
    const employeeId = Number(req.params.employeeId)
    if (!employeeId) {
      res.status(400).json({ message: 'Invalid Employee ID' })
      return
    }
    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const data = await getAttendanceDailyByEmployee(employeeId, tenantId)
    res.json(data)
  } catch (error) {
    console.error('❌ Get Daily By Employee error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const deleteAttendanceDailyController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'delete_attendance_daily')
    const id = Number(req.params.id)
    if (!id) {
      res.status(400).json({ message: 'Invalid ID' })
      return
    }

    const result = await deleteAttendanceDaily(id)
    res.status(200).json(result)
  } catch (error: any) {
    console.error('❌ Delete Attendance Daily error:', error)
    res
      .status(500)
      .json({ success: false, message: error.message || 'Server error' })
  }
}
