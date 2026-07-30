import { Request, Response, NextFunction } from 'express'
import {
  createLone,
  getLones,
  updateLone,
  deleteLone,
  skipLoneInstallment,
  makeEmployeeLoneFullPaid,
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
    // requirePermission(req, 'edit_employee_lone')
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
    // requirePermission(req, 'skip_employee_lone')
    const { employeeLoneInstallmentId, updatedBy } = req.params
    console.log('🚀 ~ skipLoneInstallmentController ~ req.params:', req.params)

    if (!employeeLoneInstallmentId || !updatedBy) {
      res.status(400).json({
        success: false,
        message: 'employeeLoneInstallmentId and updatedBy are required',
      })
    }

    const result = await skipLoneInstallment({
      employeeLoneInstallmentId: parseInt(employeeLoneInstallmentId),
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

export const makeEmployeeLoneFullPaidController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeLoneId = Number(req.params.employeeLoneId)

    const updatedBy = req.user?.userId

    const result = await makeEmployeeLoneFullPaid(
      employeeLoneId,
      Number(updatedBy)
    )

    res.status(200).json({
      status: 'success',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}
