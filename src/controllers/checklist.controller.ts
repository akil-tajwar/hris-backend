// controllers/checklist.controller.ts

import { Request, Response } from 'express'
import {
  createChecklistService,
  deleteChecklistService,
  getAllChecklistsService,
  getChecklistByIdService,
  updateChecklistService,
} from '../services/checklist.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createChecklistController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'create_checklist')
    const result = await createChecklistService(req.body)

    res.status(201).json({
      status: 'success',
      data: result,
    })
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || error,
    })
  }
}

export const getAllChecklistsController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_checklist')
    const result = await getAllChecklistsService()

    res.status(200).json(result)
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || error,
    })
  }
}

export const getChecklistByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_checklist')
    const { id } = req.params

    const result = await getChecklistByIdService(Number(id))

    if (!result) {
      res.status(404).json({
        status: 'error',
        message: 'Checklist not found',
      })
      return
    }

    res.status(200).json(result)
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || error,
    })
  }
}

export const updateChecklistController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'edit_checklist')
    const { id } = req.params

    await updateChecklistService(Number(id), req.body)

    res.status(200).json({
      status: 'success',
      message: 'Checklist updated successfully',
    })
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || error,
    })
  }
}

export const deleteChecklistController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'delete_checklist')
    const { id } = req.params

    await deleteChecklistService(Number(id))

    res.status(200).json({
      status: 'success',
      message: 'Checklist deleted successfully',
    })
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || error,
    })
  }
}
