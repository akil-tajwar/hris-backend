// leave-policy.controller.ts

import { Request, Response } from 'express'
import {
  createLeavePolicyService,
  deleteLeavePolicyService,
  getAllLeavePoliciesService,
  getLeavePolicyByIdService,
  updateLeavePolicyService,
} from '../services/leavePolicy.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createLeavePolicyController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'create_leave_policy')
    const result = await createLeavePolicyService(req.body)

    res.status(201).json({
      status: 'success',
      data: result,
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error,
    })
  }
}

export const getAllLeavePoliciesController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_leave_policy')
    const result = await getAllLeavePoliciesService()

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error,
    })
  }
}

export const getLeavePolicyByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_leave_policy')
    const { id } = req.params

    const result = await getLeavePolicyByIdService(Number(id))

    if (!result) {
      res.status(404).json({
        status: 'error',
        message: 'Leave policy not found',
      })
    }

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error,
    })
  }
}

export const updateLeavePolicyController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'edit_leave_policy')
    const { id } = req.params

    await updateLeavePolicyService(Number(id), req.body)

    res.status(200).json({
      status: 'success',
      message: 'Leave policy updated successfully',
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error,
    })
  }
}

export const deleteLeavePolicyController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'delete_leave_policy')
    const { id } = req.params

    await deleteLeavePolicyService(Number(id))

    res.status(200).json({
      status: 'success',
      message: 'Leave policy deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error,
    })
  }
}
