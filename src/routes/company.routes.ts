import { Router } from 'express'
import {
  createCompanyController,
  getCompaniesController,
  getCompanyByIdController,
  updateCompanyController,
  deleteCompanyController,
} from '../controllers/company.controller'
import { upload } from '../middlewares/upload'

const router = Router()

router.post(
  '/create',
  upload.fields([{ name: 'logoUrl', maxCount: 1 }]),
  createCompanyController
)
router.patch(
  '/edit/:companyId',
  upload.fields([{ name: 'logoUrl', maxCount: 1 }]),
  updateCompanyController
)
router.get('/getAll', getCompaniesController)
router.get('/get/:companyId', getCompanyByIdController)
router.delete('/delete/:companyId', deleteCompanyController)

export default router
