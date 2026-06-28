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

const router = Router()

router.post(
  '/create',
  upload.fields([{ name: 'logoUrl', maxCount: 1 }]),
  authenticateUser,
  createCompanyController
)
router.patch(
  '/edit/:companyId',
  upload.fields([{ name: 'logoUrl', maxCount: 1 }]),
  authenticateUser,
  updateCompanyController
)
router.get('/getAll', authenticateUser, getCompaniesController)
router.get('/get/:companyId', authenticateUser, getCompanyByIdController)
router.delete('/delete/:companyId', authenticateUser, deleteCompanyController)

export default router
