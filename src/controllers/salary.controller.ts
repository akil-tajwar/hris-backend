import { Request, Response, NextFunction } from 'express'
import {
  createSalaries,
  getSalarys,
  updateSalaryWithOtherSalaryComponents,
  deleteSalaryWithOtherSalaryComponents,
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

    const result = await createSalaries(req.body);

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
    const salarys = await getSalarys()
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

    const result = await updateSalaryWithOtherSalaryComponents(
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

    await deleteSalaryWithOtherSalaryComponents(Number(salaryId))

    res.json({
      status: 'success',
      message: 'Salary deleted successfully',
    })
  } catch (err) {
    next(err)
  }
}