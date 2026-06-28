import { Request, Response } from 'express'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  createAttendancePunch,
  updateAttendancePunch,
  getAllAttendancePunches,
  getAttendancePunchById,
  getAttendancePunchesByEmployee,
  deleteAttendancePunch,
} from '../services/attendancePunch.service'
import { processAttendanceForDate } from '../services/attendanceProcessing.service'

export const createAttendancePunchController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'create_attendance_punch')

    const tenantId = req.user?.tenantId
    const data = {
      ...req.body,
      tenantId,
    }
    
    const attendancePunch = await createAttendancePunch(data)

    // ✅ instant process
    const attendanceDate = new Date(req.body.punchTime)
      .toISOString()
      .slice(0, 10)
    await processAttendanceForDate(attendanceDate, tenantId)

    res.status(201).json(attendancePunch)
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const updateAttendancePunchController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'edit_attendance_punch')
    const id = Number(req.params.id)
    if (!id) {
      res.status(400).json({ message: 'Invalid ID' })
      return
    }

    const data = await updateAttendancePunch(id, req.body)
    res.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ Attendance Punch update error:', error)
    res
      .status(500)
      .json({ success: false, message: error.message || 'Internal server error' })
  }
}

export const getAllAttendancePunchesController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_attendance_punch')

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const attendancePunch = await getAllAttendancePunches(tenantId)
    res.json(attendancePunch)
  } catch (error) {
    console.error('❌ Get All Attendance Punches error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const getAttendancePunchByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_attendance_punch')
    const id = Number(req.params.id)
    if (!id) {
      res.status(400).json({ message: 'Invalid ID' })
      return
    }

    const data = await getAttendancePunchById(id)
    if (!data) {
      res.status(404).json({ success: false, message: 'Not found' })
      return
    }

    res.json(data)
  } catch (error) {
    console.error('❌ Get Attendance Punch By ID error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const getAttendancePunchesByEmployeeController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_attendance_punch')
    const employeeId = Number(req.params.employeeId)
    if (!employeeId) {
      res.status(400).json({ message: 'Invalid Employee ID' })
      return
    }

    const data = await getAttendancePunchesByEmployee(employeeId)
    res.json(data)
  } catch (error) {
    console.error('❌ Get Punches By Employee error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const deleteAttendancePunchController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'delete_attendance_punch')
    const id = Number(req.params.id)
    if (!id) {
      res.status(400).json({ message: 'Invalid ID' })
      return
    }

    const result = await deleteAttendancePunch(id)
    res.status(200).json(result)
  } catch (error: any) {
    console.error('❌ Delete Attendance Punch error:', error)
    res
      .status(500)
      .json({ success: false, message: error.message || 'Server error' })
  }
}
