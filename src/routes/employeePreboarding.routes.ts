import { Router } from 'express'
import {
  createEmployeePreboardingController,
  getEmployeePreboardingController,
  updateEmployeePreboardingController,
  deleteEmployeePreboardingController,
  assignChecklistToPreboardingController,
  updateAssignedChecklistController,
  getAssignedChecklistController,
  getPreboardingByIdController,
} from '../controllers/employeePreboarding.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createEmployeePreboardingController)
router.get('/getAll', authenticateUser, getEmployeePreboardingController)
router.patch(
  '/edit/:employeePreboardingId',
  authenticateUser,
  updateEmployeePreboardingController
)
router.delete(
  '/delete/:employeePreboardingId',
  authenticateUser,
  deleteEmployeePreboardingController
)
router.post('/assign', authenticateUser, assignChecklistToPreboardingController)
router.patch('/edit', authenticateUser, updateAssignedChecklistController)
router.get(
  '/getChecklists/:preboardingId',
  authenticateUser,
  getAssignedChecklistController
)
router.get(
  '/getPreboarding/:preboardingId',
  getPreboardingByIdController
)

export default router
