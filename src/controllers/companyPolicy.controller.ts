import { Request, Response, NextFunction } from 'express'
import {
  bulkCreateCompanyPolicies,
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

    // multer.array('pdfFiles') — new uploads only, matched by array index
    const files = req.files as Express.Multer.File[] | undefined
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`

    // Sent as a JSON string in a multipart field, since multipart forms
    // can't natively carry nested JSON arrays
    const policies: Array<{
      companyId: number
      name: string
      description?: string
      year: number
      pdfUrl?: string // present when copying from a previous year (no re-upload)
    }> = JSON.parse(req.body.policies)

    const data = policies.map((policy, index) => {
      // A new file at this index overrides any existing pdfUrl (fresh upload
      // takes priority over a copied-forward URL)
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
