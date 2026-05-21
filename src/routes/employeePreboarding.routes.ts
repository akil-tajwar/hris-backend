import { Router } from 'express'
import {
  createEmployeePreboardingController,
  getEmployeePreboardingController,
  updateEmployeePreboardingController,
  deleteEmployeePreboardingController,
} from '../controllers/employeePreboarding.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createEmployeePreboardingController)
router.get('/getAll', authenticateUser, getEmployeePreboardingController)
router.patch('/edit/:employeePreboardingId', authenticateUser, updateEmployeePreboardingController)
router.delete('/delete/:employeePreboardingId', authenticateUser, deleteEmployeePreboardingController)

export default router
