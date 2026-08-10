import { Request, Response, NextFunction } from 'express'
import {
  createSalaries,
  getSalarys,
  updateSalaryWithSalaryComponents,
  deleteSalaryWithSalaryComponents,
  generateSalaryPreview,
  makeSalaryPermanent,
  giveSalary,
} from '../services/salary.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const generateSalaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_salary')

    const salaryMonth = req.query.salaryMonth
    const salaryYear = req.query.salaryYear
    const tenantId = req.user?.tenantId

    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const salarys = await generateSalaryPreview(
      String(salaryMonth),
      Number(salaryYear),
      tenantId
    )
    res.json(salarys)
  } catch (err) {
    next(err)
  }
}

export const createSalariesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_salary')

    const tenantId = req.user?.tenantId

    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const salariesData = Array.isArray(req.body) ? req.body : req.body.salaries

    if (!Array.isArray(salariesData)) {
      throw new Error('Request body must be an array of salary records')
    }

    const result = await createSalaries(salariesData, tenantId)

    res.status(201).json({
      status: 'success',
      message: `${result.length} salaries created successfully`,
      data: result,
    })
  } catch (err: any) {
    console.log('FULL DB ERROR:', err.cause)
    console.log('MESSAGE:', err.message)
    throw err
  }
}

export const getSalarysController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_salary')

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const salarys = await getSalarys(tenantId)
    res.json(salarys)
  } catch (err) {
    console.error(err)
    throw err
  }
}

export const updateSalaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_salary')
    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const result = await updateSalaryWithSalaryComponents(req.body, tenantId)

    res.json({
      status: 'success',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

export const deleteSalaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_salary')

    const { salaryId } = req.params
    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }
    await deleteSalaryWithSalaryComponents(Number(salaryId), tenantId)

    res.json({
      status: 'success',
      message: 'Salary deleted successfully',
    })
  } catch (err) {
    next(err)
  }
}

export const giveSalaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_salary')

    const { salaryId } = req.params

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const result = await giveSalary(
      Number(salaryId),
      tenantId
    )

    res.json({
      status: 'success',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

export const makeSalaryPermentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_salary')

    const { salaryId } = req.params
    console.log("🚀 ~ makeSalaryPermentController ~ salaryId:", salaryId)

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const result = await makeSalaryPermanent(
      Number(salaryId),
      tenantId
    )

    res.json({
      status: 'success',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}
