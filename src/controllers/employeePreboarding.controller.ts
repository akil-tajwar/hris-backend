import { Request, Response, NextFunction } from 'express'
import {
  createEmployeePreboarding,
  getEmployeePreboarding,
  updateEmployeePreboarding,
  deleteEmployeePreboarding,
  assignChecklistToPreboardingService,
  updateAssignedChecklistService,
  getAssignedChecklistService,
  getPreboardingById,
  completeEmployeePreboardingChecklist,
  getAssignedChecklistByUserService,
} from '../services/employeePreboarding.service'

import { requirePermission } from '../services/utils/jwt.utils'

// CREATE
export const createEmployeePreboardingController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_employee_preboarding')

    const tenantId = req.user?.tenantId
    const data = {
      ...req.body,
      tenantId,
    }
    const result = await createEmployeePreboarding(data)

    res.status(201).json({
      status: 'success',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

// GET ALL
export const getEmployeePreboardingController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_employee_preboarding')

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }
    const result = await getEmployeePreboarding(tenantId)

    res.json(result)
  } catch (err) {
    next(err)
  }
}

// UPDATE
export const updateEmployeePreboardingController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_employee_preboarding')

    const { preboardingId } = req.params
    console.log(
      '🚀 ~ updateEmployeePreboardingController ~ preboardingId:',
      preboardingId
    )

    const result = await updateEmployeePreboarding({
      preboardingId: Number(preboardingId),
      ...req.body,
    })

    res.json({
      status: 'success',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

// DELETE
export const deleteEmployeePreboardingController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_employee_preboarding')

    const { employeePreboardingId } = req.params

    await deleteEmployeePreboarding(Number(employeePreboardingId))

    res.json({
      status: 'success',
      message: 'Employee preboarding deleted',
    })
  } catch (err) {
    next(err)
  }
}

// assign checklist to preboarding employee
export const assignChecklistToPreboardingController = async (
  req: Request,
  res: Response
) => {
  try {
    await assignChecklistToPreboardingService(req.body)

    res.status(201).json({
      status: 'success',
      message: 'Checklist assigned successfully',
    })
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || error,
    })
  }
}

// update assigned checklist for preboarding employee
export const updateAssignedChecklistController = async (
  req: Request,
  res: Response
) => {
  try {
    await updateAssignedChecklistService(req.body)

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

// GET by preboarding employee checklists preboardingId
export const getAssignedChecklistController = async (
  req: Request,
  res: Response
) => {
  try {
    const { preboardingId } = req.params

    const data = await getAssignedChecklistService(Number(preboardingId))

    res.status(200).json(data)
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || error,
    })
  }
}

export const getAssignedChecklistByUserController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params

    const data = await getAssignedChecklistByUserService(Number(userId))

    res.status(200).json(data)
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || error,
    })
  }
}

// GET preboarding employee by id
export const getPreboardingByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { preboardingId } = req.params

    const data = await getPreboardingById(Number(preboardingId))

    res.status(200).json(data)
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || error,
    })
  }
}

export const completeEmployeePreboardingChecklistController = async (
  req: Request,
  res: Response
) => {
  try {
    const { employeePreboardingChecklistId, completionDate } = req.body

    if (
      !employeePreboardingChecklistId ||
      isNaN(Number(employeePreboardingChecklistId))
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid employeePreboardingChecklistId',
      })
    }

    const result = await completeEmployeePreboardingChecklist({
      employeePreboardingChecklistId: Number(
        employeePreboardingChecklistId
      ),
      completionDate,
    })

    res.status(200).json({
      success: true,
      message: 'Checklist marked as completed',
      data: result,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
}
