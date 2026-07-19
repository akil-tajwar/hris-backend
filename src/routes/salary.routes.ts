import { Router } from 'express'
import {
  createSalariesController,
  getSalarysController,
  updateSalaryController,
  deleteSalaryController,
  generateSalaryController,
} from '../controllers/salary.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.get('/generate-salary', authenticateUser, generateSalaryController)
router.post('/create', authenticateUser, createSalariesController)
router.get('/getAll', authenticateUser, getSalarysController)
router.patch('/edit/:salaryId', authenticateUser, updateSalaryController)
router.delete('/delete/:salaryId', authenticateUser, deleteSalaryController)

export default router
