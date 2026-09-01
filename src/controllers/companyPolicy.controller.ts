import { Request, Response, NextFunction } from 'express'
import {
  bulkCreateCompanyPolicies,
  editCompanyPolicy,
  getCompanyPolicies,
} from '../services/companyPolicy.service'

export const createCompanyPoliciesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.user?.tenantId
    const createdBy = req.user?.userId

    if (!tenantId || !createdBy) {
      throw new Error('Tenant ID and user ID are required')
    }

    const files = req.files as Express.Multer.File[] | undefined
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`

    const policies: Array<{
      companyId: number
      name: string
      description?: string
      year: number
      pdfUrl?: string
    }> = JSON.parse(req.body.policies)

    const data = policies.map((policy, index) => {
      const uploadedFile = files?.[index]
      const pdfUrl = uploadedFile
        ? `${baseUrl}${uploadedFile.filename}`
        : (policy.pdfUrl ?? null)

      return {
        companyId: policy.companyId,
        name: policy.name,
        description: policy.description,
        year: policy.year,
        pdfUrl,
        tenantId,
        createdBy,
      }
    })

    const result = await bulkCreateCompanyPolicies(data)

    res.status(201).json({ success: true, data: result })
  } catch (err) {
    console.error('❌ Company policy creation error:', err)
    next(err)
  }
}

export const editCompanyPolicyController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const companyPolicyId = Number(req.params.companyPolicyId)

    if (!companyPolicyId) {
      res.status(400).json({
        success: false,
        message: 'Invalid company policy ID',
      })
      return
    }

    console.log('FILES 👉', req.files)
    console.log('BODY 👉', req.body)

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[]
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`

    // ✅ Use req.body directly
    const companyPolicyDetails = req.body.policy
      ? JSON.parse(req.body.policy)
      : {}

    // 📸 PDF
    if (files?.pdfUrl?.[0]) {
      companyPolicyDetails.pdfUrl = `${baseUrl}${files.pdfUrl[0].filename}`
    }

    // 🔢 Convert year
    if (companyPolicyDetails.year) {
      companyPolicyDetails.year = Number(companyPolicyDetails.year)
    }

    // 🔘 Convert active
    if (companyPolicyDetails.active !== undefined) {
      if (
        companyPolicyDetails.active === 'true' ||
        companyPolicyDetails.active === true
      ) {
        companyPolicyDetails.active = true
      } else if (
        companyPolicyDetails.active === 'false' ||
        companyPolicyDetails.active === false
      ) {
        companyPolicyDetails.active = false
      }
    }

    // 🏢 Convert companyId
    if (companyPolicyDetails.companyId) {
      companyPolicyDetails.companyId = Number(companyPolicyDetails.companyId)
    }

    // 🏢 Convert tenantId
    if (companyPolicyDetails.tenantId) {
      companyPolicyDetails.tenantId = Number(companyPolicyDetails.tenantId)
    }

    // 👤 Set updatedBy
    companyPolicyDetails.updatedBy = req.user?.userId

    const updatedCompanyPolicy = await editCompanyPolicy(
      companyPolicyId,
      companyPolicyDetails
    )

    res.json({
      success: true,
      data: updatedCompanyPolicy,
    })
  } catch (err) {
    console.error('❌ Company policy update error:', err)
    next(err)
  }
}

export const getCompanyPoliciesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.user?.tenantId
    if (!tenantId) throw new Error('Tenant ID is required')

    const year = req.query.year ? Number(req.query.year) : undefined
    const policies = await getCompanyPolicies(tenantId, year)

    res.json(policies)
  } catch (err) {
    next(err)
  }
}
