import { Router } from 'express'
import {
  createSalariesController,
  getSalarysController,
  updateSalaryController,
  deleteSalaryController,
  generateSalaryController,
  giveSalaryController,
  makeSalaryPermentController,
} from '../controllers/salary.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.get('/generate-salary', authenticateUser, generateSalaryController)
router.post('/create', authenticateUser, createSalariesController)
router.get('/getAll', authenticateUser, getSalarysController)
router.patch('/edit', authenticateUser, updateSalaryController)
router.delete('/delete/:salaryId', authenticateUser, deleteSalaryController)
router.patch('/give-salary/:salaryId', authenticateUser, giveSalaryController)
router.patch('/make-salary-permanent/:salaryId', authenticateUser, makeSalaryPermentController)

export default router
