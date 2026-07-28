import { Request, Response, NextFunction } from 'express'
import {
  createLone,
  getLones,
  updateLone,
  deleteLone,
  skipLoneInstallment,
} from '../services/employeeLones.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createLoneController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // requirePermission(req, 'create_employee_lone')
    console.log('🚀 ~ createLoneController ~ req.body:', req.body)
    const lone = await createLone(req.body)
    res.status(201).json({ status: 'success', data: lone })
  } catch (err) {
    next(err)
  }
}

export const getLonesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // requirePermission(req, 'view_employee_lone')
    const lones = await getLones()
    res.json(lones)
  } catch (err) {
    next(err)
  }
}

export const updateLoneController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_employee_lone')
    const { employeeLoneId } = req.params

    const lone = await updateLone({
      employeeLoneId: Number(employeeLoneId),
      ...req.body,
    })
    res.json({ status: 'success', data: lone })
  } catch (err) {
    next(err)
  }
}

export const deleteLoneController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_employee_lone')
    const { employeeLoneId } = req.params
    await deleteLone(Number(employeeLoneId))
    res.json({ status: 'success', message: 'Lone deleted' })
  } catch (err) {
    next(err)
  }
}

export const skipLoneInstallmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'skip_employee_lone')
    const { employeeOtherSalaryComponentId, updatedBy } = req.params
    console.log("🚀 ~ skipLoneInstallmentController ~ req.params:", req.params)

    if (!employeeOtherSalaryComponentId || !updatedBy) {
      res.status(400).json({
        success: false,
        message: 'employeeOtherSalaryComponentId and updatedBy are required',
      })
    }

    const result = await skipLoneInstallment({
      employeeOtherSalaryComponentId: parseInt(employeeOtherSalaryComponentId),
      updatedBy: parseInt(updatedBy),
    })

    res.status(200).json({
      success: true,
      data: result,
    })
  } catch (err) {
    next(err)
  }
}
