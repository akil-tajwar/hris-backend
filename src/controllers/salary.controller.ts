import { Request, Response, NextFunction } from 'express'
import {
  createSalaries,
  getSalarys,
  updateSalaryWithSalaryComponents,
  deleteSalaryWithSalaryComponents,
} from '../services/salary.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createSalariesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_salary');

    // Ensure request body is an array
    if (!Array.isArray(req.body)) {
      throw new Error('Request body must be an array of salary records');
    }
    const tenantId = req.user?.tenantId
    const data = {
      ...req.body,
      tenantId,
    }

    const result = await createSalaries(data);

    res.status(201).json({
      status: 'success',
      message: `${result.length} salaries created successfully`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

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
    next(err)
  }
}

export const updateSalaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_salary')

    const { salaryId } = req.params

    const result = await updateSalaryWithSalaryComponents(
      Number(salaryId),
      req.body
    )

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

    await deleteSalaryWithSalaryComponents(Number(salaryId))

    res.json({
      status: 'success',
      message: 'Salary deleted successfully',
    })
  } catch (err) {
    next(err)
  }
}