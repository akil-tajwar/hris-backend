import { Request, Response } from 'express'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  createAttendancePunch,
  updateAttendancePunch,
  getAllAttendancePunches,
  getAttendancePunchById,
  getAttendancePunchesByEmployee,
  deleteAttendancePunch,
  createAttendanceDaily,
  updateAttendanceDaily,
  getAllAttendanceDaily,
  getAttendanceDailyById,
  getAttendanceDailyByEmployee,
  deleteAttendanceDaily,
} from '../services/attendancePunch.service'

// ========================
// ATTENDANCE PUNCHES
// ========================

export const createAttendancePunchController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'create_attendance_punch')
    const data = await createAttendancePunch(req.body)
    res.status(201).json(data)
  } catch (error: any) {
    console.error('❌ Attendance Punch create error:', error)
    res
      .status(400)
      .json({ success: false, message: error.message || 'Something went wrong' })
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
    const data = await getAllAttendancePunches()
    res.json(data)
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

// ========================
// ATTENDANCE DAILY
// ========================

export const createAttendanceDailyController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'create_attendance_daily')
    const data = await createAttendanceDaily(req.body)
    res.status(201).json(data)
  } catch (error: any) {
    console.error('❌ Attendance Daily create error:', error)
    res
      .status(400)
      .json({ success: false, message: error.message || 'Something went wrong' })
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
      .json({ success: false, message: error.message || 'Internal server error' })
  }
}

export const getAllAttendanceDailyController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_attendance_daily')
    const data = await getAllAttendanceDaily()
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

    const data = await getAttendanceDailyById(id)
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

    const data = await getAttendanceDailyByEmployee(employeeId)
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