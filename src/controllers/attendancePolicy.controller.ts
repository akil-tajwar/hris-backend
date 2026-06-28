import { Request, Response } from 'express'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  createAttendancePolicy,
  updateAttendancePolicy,
  getAllAttendancePolicies,
  getAttendancePolicyById,
  deleteAttendancePolicy,
} from '../services/attendancePolicy.service'

// CREATE
export const createAttendancePolicyController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'create_attendance_policy')

    const tenantId = req.user?.tenantId
    const data = {
      ...req.body,
      tenantId,
    }

    const attendancePolicy = await createAttendancePolicy(data)
    res.status(201).json(attendancePolicy)
  } catch (error: any) {
    console.error('❌ Attendance Policy create error:', error)
    res.status(400).json({ success: false, message: error.message || 'Something went wrong' })
  }
}

// UPDATE
export const updateAttendancePolicyController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'edit_attendance_policy')
    const id = Number(req.params.id)
    if (!id) {
      res.status(400).json({ message: 'Invalid ID' })
      return  // return আলাদা line এ, response এর সাথে না
    }

    const data = await updateAttendancePolicy(id, req.body)
    res.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ Attendance Policy update error:', error)
    res.status(500).json({ success: false, message: error.message || 'Internal server error' })
  }
}

// GET ALL
export const getAllAttendancePoliciesController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_attendance_policy')

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const data = await getAllAttendancePolicies(tenantId)
    res.json(data)
  } catch (error) {
    console.error('Get All Attendance Policies Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET BY ID
export const getAttendancePolicyByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_attendance_policy')
    const id = Number(req.params.id)
    if (!id) {
      res.status(400).json({ message: 'Invalid ID' })
      return
    }

    const data = await getAttendancePolicyById(id)
    if (!data) {
      res.status(404).json({ success: false, message: 'Not found' })
      return
    }

    res.json(data)
  } catch (error) {
    console.error('Get Attendance Policy By ID Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// DELETE
export const deleteAttendancePolicyController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'delete_attendance_policy')
    const id = Number(req.params.id)
    if (!id) {
      res.status(400).json({ message: 'Invalid ID' })
      return
    }

    const result = await deleteAttendancePolicy(id)
    res.status(200).json(result)
  } catch (error: any) {
    console.error('Delete Attendance Policy Error:', error)
    res.status(500).json({ success: false, message: error.message || 'Server error' })
  }
}