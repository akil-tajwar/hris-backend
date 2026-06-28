// shift.controller.ts

import { Request, Response } from 'express'
import {
  createShift,
  deleteShift,
  getAllShift,
  getShiftById,
  updateShift,
} from '../services/shifts.service'
import { requirePermission } from '../services/utils/jwt.utils'

/* =========================
   CREATE
========================= */

export const createShiftController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'create_shift')

    const tenantId = req.user?.tenantId
    const data = {
      ...req.body,
      tenantId,
    }
    const result = await createShift(data)

    res.status(201).json({
      status: 'success',
      message: 'Shift created successfully',
      data: result,
    })
  } catch (error: any) {
    console.error(error)

    res.status(500).json({
      status: 'error',
      message: error.message || 'Creation failed',
    })
  }
}

/* =========================
   UPDATE
========================= */

export const updateShiftController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'edit_shift')

    const shiftId = Number(req.params.shiftId)

    if (!shiftId || isNaN(shiftId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid shiftId',
      })
    }

    await updateShift(shiftId, req.body)

    res.json({
      status: 'success',
      message: 'Shift updated successfully',
    })
  } catch (error: any) {
    console.error(error)

    res.status(500).json({
      status: 'error',
      message: error.message || 'Update failed',
    })
  }
}

/* =========================
   GET ALL
========================= */

export const getShiftController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'view_shift')

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const data = await getAllShift(tenantId)

    res.json(data)
  } catch (error: any) {
    console.error(error)

    res.status(500).json({
      status: 'error',
      message: error.message || 'Fetch failed',
    })
  }
}

/* =========================
   GET BY ID
========================= */

export const getShiftByIdController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'view_shift')

    const shiftId = Number(req.params.shiftId)

    if (!shiftId || isNaN(shiftId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid shiftId',
      })
    }

    const data = await getShiftById(shiftId)

    if (!data) {
      return res.status(404).json({
        status: 'error',
        message: 'Shift not found',
      })
    }

    res.json({
      status: 'success',
      data,
    })
  } catch (error: any) {
    console.error(error)

    res.status(500).json({
      status: 'error',
      message: error.message || 'Fetch failed',
    })
  }
}

/* =========================
   DELETE
========================= */

export const deleteShiftController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'delete_shift')

    const shiftId = Number(req.params.shiftId)

    if (!shiftId || isNaN(shiftId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid shiftId',
      })
    }

    const result = await deleteShift(shiftId)

    res.json({
      status: 'success',
      data: result,
    })
  } catch (error: any) {
    console.error(error)

    res.status(500).json({
      status: 'error',
      message: error.message || 'Delete failed',
    })
  }
}
