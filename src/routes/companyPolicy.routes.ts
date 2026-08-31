import { Router } from 'express'
import {
  createCompanyController,
  getCompaniesController,
  getCompanyByIdController,
  updateCompanyController,
  deleteCompanyController,
} from '../controllers/company.controller'
import { upload } from '../middlewares/upload'
import { authenticateUser } from '../middlewares/auth.middleware'
import {
  createCompanyPoliciesController,
  editCompanyPolicyController,
  getCompanyPoliciesController,
} from '../controllers/companyPolicy.controller'

const router = Router()

router.post(
  '/create',
  authenticateUser,
  upload.array('pdfUrl'),
  createCompanyPoliciesController
)
router.patch(
  '/edit/:companyPolicyId',
  authenticateUser,
  upload.fields([{ name: 'pdfUrl', maxCount: 1 }]),
  editCompanyPolicyController
)
router.get('/getAll', authenticateUser, getCompanyPoliciesController)

export default router
