import { Request, Response } from 'express'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  createSingleShiftAllocation,
  createBulkShiftAllocation,
  updateShiftAllocation,
  updateRecurrenceSetting,
  copyShiftAllocation,
  copyAllActiveAllocations,
  getAllShiftAllocations,
  getShiftAllocationById,
  getShiftAllocationsByEmployee,
  deleteShiftAllocation,
  getEmployeeWeekDaysByUserId,
} from '../services/shiftAllocation.service'

// ─── CREATE SINGLE ────────────────────────────────────────────────
export const createSingleShiftAllocationController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'create_shift_allocation')
    const data = await createSingleShiftAllocation(req.body)
    res.status(201).json(data)
  } catch (error: any) {
    console.error('❌ Single shift allocation error:', error)
    res.status(400).json({ success: false, message: error.message || 'Something went wrong' })
  }
}

// ─── CREATE BULK ──────────────────────────────────────────────────
export const createBulkShiftAllocationController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'create_shift_allocation')
    const data = await createBulkShiftAllocation(req.body)
    res.status(201).json(data)
  } catch (error: any) {
    console.error('❌ Bulk shift allocation error:', error)
    res.status(400).json({ success: false, message: error.message || 'Something went wrong' })
  }
}

// ─── UPDATE ───────────────────────────────────────────────────────
export const updateShiftAllocationController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'edit_shift_allocation')
    const id = Number(req.params.id)
    if (!id) {
      res.status(400).json({ message: 'Invalid ID' })
      return
    }
    const data = await updateShiftAllocation(id, req.body)
    res.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ Shift allocation update error:', error)
    res.status(500).json({ success: false, message: error.message || 'Internal server error' })
  }
}

// ─── UPDATE RECURRENCE SETTING ────────────────────────────────────
export const updateRecurrenceSettingController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'edit_shift_allocation')
    const id = Number(req.params.id)
    if (!id) {
      res.status(400).json({ message: 'Invalid ID' })
      return
    }
    const { recurrenceType, recurrenceActive } = req.body
    const data = await updateRecurrenceSetting(id, recurrenceType, recurrenceActive)
    res.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ Update recurrence error:', error)
    res.status(500).json({ success: false, message: error.message || 'Server error' })
  }
}

// ─── COPY SINGLE ──────────────────────────────────────────────────
export const copyShiftAllocationController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'create_shift_allocation')
    const id = Number(req.params.id)
    if (!id) {
      res.status(400).json({ message: 'Invalid ID' })
      return
    }
    const { createdBy } = req.body
    const data = await copyShiftAllocation(id, createdBy)
    res.status(201).json(data)
  } catch (error: any) {
    console.error('❌ Copy shift allocation error:', error)
    res.status(400).json({ success: false, message: error.message || 'Server error' })
  }
}

// ─── COPY ALL ACTIVE ──────────────────────────────────────────────
export const copyAllActiveAllocationsController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'create_shift_allocation')
    const { recurrenceType, createdBy } = req.body

    if (!recurrenceType || !['weekly', 'monthly'].includes(recurrenceType)) {
      res.status(400).json({ message: 'recurrenceType must be weekly or monthly' })
      return
    }

    const data = await copyAllActiveAllocations(recurrenceType, createdBy)
    res.status(201).json(data)
  } catch (error: any) {
    console.error('❌ Copy all allocations error:', error)
    res.status(400).json({ success: false, message: error.message || 'Server error' })
  }
}

// ─── GET ALL ──────────────────────────────────────────────────────
export const getAllShiftAllocationsController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_shift_allocation')
    const data = await getAllShiftAllocations()
    res.json(data)
  } catch (error) {
    console.error('❌ Get All Shift Allocations Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ─── GET BY ID ────────────────────────────────────────────────────
export const getShiftAllocationByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_shift_allocation')
    const id = Number(req.params.id)
    if (!id) {
      res.status(400).json({ message: 'Invalid ID' })
      return
    }
    const data = await getShiftAllocationById(id)
    if (!data) {
      res.status(404).json({ success: false, message: 'Not found' })
      return
    }
    res.json(data)
  } catch (error) {
    console.error('❌ Get Shift Allocation By ID Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ─── GET BY EMPLOYEE ──────────────────────────────────────────────
export const getShiftAllocationsByEmployeeController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_shift_allocation')
    const employeeId = Number(req.params.employeeId)
    if (!employeeId) {
      res.status(400).json({ message: 'Invalid Employee ID' })
      return
    }
    const data = await getShiftAllocationsByEmployee(employeeId)
    res.json(data)
  } catch (error) {
    console.error('❌ Get Shift Allocations By Employee Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ─── DELETE ───────────────────────────────────────────────────────
export const deleteShiftAllocationController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'delete_shift_allocation')
    const id = Number(req.params.id)
    if (!id) {
      res.status(400).json({ message: 'Invalid ID' })
      return
    }
    const result = await deleteShiftAllocation(id)
    res.status(200).json(result)
  } catch (error: any) {
    console.error('❌ Delete Shift Allocation Error:', error)
    res.status(500).json({ success: false, message: error.message || 'Server error' })
  }
}

export const getEmployeeWeekDaysController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = Number(req.params.userId)

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid userId',
      })
    }

    const data = await getEmployeeWeekDaysByUserId(userId)

    res.status(200).json(data)
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}