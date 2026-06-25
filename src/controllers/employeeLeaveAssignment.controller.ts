// employee-leave-assignment.controller.ts

import { Request, Response } from 'express'
import {
  createEmployeeLeaveAssignmentService,
  deleteEmployeeLeaveAssignmentService,
  getAllEmployeeLeaveAssignmentsService,
  getEmployeeLeaveAssignmentByIdService,
  updateEmployeeLeaveAssignmentService,
} from '../services/employeeLeaveAssignment.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createEmployeeLeaveAssignmentController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'create_employee_leave_assignment')

    const tenantId = req.user?.tenantId
    const data = {
      ...req.body,
      tenantId,
    }
    const result = await createEmployeeLeaveAssignmentService(data)

    res.status(201).json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const updateEmployeeLeaveAssignmentController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'edit_employee_leave_assignment')
    const { id } = req.params

    const result = await updateEmployeeLeaveAssignmentService(
      Number(id),
      req.body
    )

    res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const getAllEmployeeLeaveAssignmentsController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_employee_leave_assignment')

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }
    const result = await getAllEmployeeLeaveAssignmentsService(tenantId)

    res.status(200).json(result)
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const getEmployeeLeaveAssignmentByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_employee_leave_assignment')
    const { id } = req.params

    const result = await getEmployeeLeaveAssignmentByIdService(Number(id))

    if (!result) {
      res.status(404).json({
        success: false,
        message: 'Not found',
      })
    }

    res.status(200).json(result)
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const deleteEmployeeLeaveAssignmentController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'delete_employee_leave_assignment')
    const { id } = req.params

    await deleteEmployeeLeaveAssignmentService(Number(id))

    res.status(200).json({
      success: true,
      message: 'Deleted successfully',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
