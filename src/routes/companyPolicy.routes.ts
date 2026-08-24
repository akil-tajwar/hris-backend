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
  getCompanyPoliciesController,
} from '../controllers/companyPolicy.controller'

const router = Router()

router.post(
  '/create',
  authenticateUser,
  upload.array('pdfUrl'),
  createCompanyPoliciesController
)
router.get('/getAll', authenticateUser, getCompanyPoliciesController)

export default router
