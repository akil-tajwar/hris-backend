import { Router } from 'express'
import {
  createCompanyController,
  getCompaniesController,
  getCompanyByIdController,
  updateCompanyController,
  deleteCompanyController,
} from '../controllers/company.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createCompanyController)
router.get('/getAll', authenticateUser, getCompaniesController)
router.get('/get/:companyId', authenticateUser, getCompanyByIdController)
router.patch('/edit/:companyId', authenticateUser, updateCompanyController)
router.delete('/delete/:companyId', authenticateUser, deleteCompanyController)

export default router