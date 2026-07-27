import { Router } from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import {
  createEmployeeLeaveEncashmentController,
  getEmployeeLeaveEncashmentsController,
} from '../controllers/employeeLeaveEncashment.controller'

const router = Router()

router.post(
  '/create',
  authenticateUser,
  createEmployeeLeaveEncashmentController
)
router.get('/getAll', authenticateUser, getEmployeeLeaveEncashmentsController)

export default router
