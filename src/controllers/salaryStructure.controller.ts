// salary-structure.controller.ts

import { Request, Response } from 'express'
import {
  createSalaryStructureService,
  deleteSalaryStructureService,
  getAllSalaryStructuresService,
  getSalaryStructureByIdService,
  updateSalaryStructureService,
} from '../services/salaryStructure.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createSalaryStructureController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'create_salary_structure')

    const result = await createSalaryStructureService(req.body)

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

export const getAllSalaryStructuresController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_salary_structure');

    const result = await getAllSalaryStructuresService();

    res.status(200).json(result);
  } catch (error: any) {
    // Extract the message string so JSON serialization doesn't wipe it out
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
};

export const getSalaryStructureByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_salary_structure')

    const { id } = req.params

    if (!id || isNaN(Number(id))) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid salary structure id',
      })
    }

    const result = await getSalaryStructureByIdService(Number(id))

    if (!result) {
      res.status(404).json({
        status: 'error',
        message: 'Salary structure not found',
      })
    }

    res.status(200).json({
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

export const updateSalaryStructureController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'edit_salary_structure')

    const { id } = req.params

    await updateSalaryStructureService(Number(id), req.body)

    res.status(200).json({
      status: 'success',
      message: 'Salary structure updated successfully',
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error,
    })
  }
}

export const deleteSalaryStructureController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'delete_salary_structure')

    const { id } = req.params

    await deleteSalaryStructureService(Number(id))

    res.status(200).json({
      status: 'success',
      message: 'Salary structure deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error,
    })
  }
}
