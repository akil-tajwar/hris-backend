import { Request, Response, NextFunction } from 'express'
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from '../services/company.service'
import { requirePermission } from '../services/utils/jwt.utils'

/* ================================
   CREATE COMPANY
================================ */
export const createCompanyController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('FILES 👉', req.files)
    console.log('BODY 👉', req.body)

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[]
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`

    const companyDetails = req.body

    if (files?.logoUrl?.[0]) {
      companyDetails.logoUrl = `${baseUrl}${files.logoUrl[0].filename}`
    }
    
    // ✅ Convert status
    if (companyDetails.status !== undefined) {
      companyDetails.status =
      companyDetails.status === 'true' || companyDetails.status === true
      ? 1
      : 0
    }
    const tenantId = req.user?.tenantId
    const data = {
      ...companyDetails,
      tenantId,
    }

    const company = await createCompany(data)

    res.status(201).json({
      success: true,
      data: company,
    })
  } catch (err) {
    console.error('❌ Company creation error:', err)
    next(err)
  }
}

/* ================================
   UPDATE COMPANY
================================ */
export const updateCompanyController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const companyId = Number(req.params.companyId)

    if (!companyId) {
      res.status(400).json({
        success: false,
        message: 'Invalid company ID',
      })
    }

    console.log('FILES 👉', req.files)
    console.log('BODY 👉', req.body)

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[]
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`

    // ✅ Use req.body directly
    const companyDetails = req.body

    // 📸 Logo
    if (files?.logoUrl?.[0]) {
      companyDetails.logoUrl = `${baseUrl}${files.logoUrl[0].filename}`
    }

    const updatedCompany = await updateCompany(companyId, companyDetails)

    res.json({
      success: true,
      data: updatedCompany,
    })
  } catch (err) {
    console.error('❌ Company update error:', err)
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
    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }
    const companies = await getCompanies(tenantId)
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
    //requirePermission(req, 'view_company')
    const { companyId } = req.params
    const company = await getCompanyById(Number(companyId))
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
    //requirePermission(req, 'delete_company')
    const { companyId } = req.params
    await deleteCompany(Number(companyId))
    res.json({ status: 'success', message: 'Company deleted' })
  } catch (err) {
    next(err)
  }
}
