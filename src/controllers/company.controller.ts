import { Request, Response, NextFunction } from 'express'
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from '../services/company.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createCompanyController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_company')
    const { companyName, createdBy } = req.body
    const company = await createCompany(companyName, createdBy)
    res.status(201).json({ status: 'success', data: company })
  } catch (err) {
    next(err)
  }
}

export const getCompaniesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_company')
    const companies = await getCompanies()
    res.json(companies)
  } catch (err) {
    next(err)
  }
}

export const getCompanyByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_company')
    const { companyId } = req.params
    const company = await getCompanyById(Number(companyId))
    res.json({ status: 'success', data: company })
  } catch (err) {
    next(err)
  }
}

export const updateCompanyController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_company')
    const { companyId } = req.params
    const { companyName, updatedBy } = req.body

    const company = await updateCompany(Number(companyId), companyName, updatedBy)
    res.json({ status: 'success', data: company })
  } catch (err) {
    next(err)
  }
}

export const deleteCompanyController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_company')
    const { companyId } = req.params
    await deleteCompany(Number(companyId))
    res.json({ status: 'success', message: 'Company deleted' })
  } catch (err) {
    next(err)
  }
}