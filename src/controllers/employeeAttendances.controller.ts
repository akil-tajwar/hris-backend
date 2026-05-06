import { NextFunction, Request, Response } from 'express'
import { createInsertSchema } from 'drizzle-zod'
import { employeeAttendanceModel } from '../schemas'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  createEmployeeAttendance,
  deleteEmployeeAttendance,
  editEmployeeAttendance,
  getAllEmployeeAttendances,
  getEmployeeAttendanceById,
} from '../services/employeeAttendances.service'
import { BadRequestError } from '../services/utils/errors.utils'

export const createEmployeeAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_employee_attendance')

    const payload = req.body

    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      throw BadRequestError('Request body cannot be empty')
    }

    const employeeAttendance = await createEmployeeAttendance(payload)

    res.status(201).json({
      status: 'success',
      data: employeeAttendance,
    })
  } catch (error) {
    next(error)
  }
}



export const editEmployeeAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_employee_attendance')

    const employeeAttendanceId = Number(req.params.id)

    if (!employeeAttendanceId) {
      throw BadRequestError('Invalid employeeAttendanceId')
    }

    const employeeAttendance = await editEmployeeAttendance(
      employeeAttendanceId,
      req.body
    )

    res.status(200).json({
      status: 'success',
      data: employeeAttendance,
    })
  } catch (error) {
    next(error)
  }
}


export const getAllEmployeeAttendancesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_employee_attendance')
    const employeeAttendances = await getAllEmployeeAttendances()

    res.status(200).json(employeeAttendances)
  } catch (error) {
    next(error)
  }
}

export const getEmployeeAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_employee_attendance')
    const id = Number(req.params.id)
    const employeeAttendance = await getEmployeeAttendanceById(id)

    res.status(200).json(employeeAttendance)
  } catch (error) {
    next(error)
  }
}

export const deleteEmployeeAttendanceController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'delete_employee_attendance')
    const employeeAttendanceId = Number(req.params.id);

    const result = await deleteEmployeeAttendance(employeeAttendanceId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
