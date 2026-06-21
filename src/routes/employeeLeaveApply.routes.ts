import { Router } from 'express'
import {
  createEmployeeLeaveApplyController,
  getEmployeeLeaveApplicationsController,
  updateEmployeeLeaveApplyController,
  deleteEmployeeLeaveApplyController,
  approveLeaveByRepAuthController,
  approveLeaveByHrController,
  calculateLeaveDaysController,
  rejectLeaveController,
} from '../controllers/employeeLeaveApply.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createEmployeeLeaveApplyController)
router.get('/getAll', authenticateUser, getEmployeeLeaveApplicationsController)
router.patch(
  '/edit/:employeeLeaveApplyId',
  authenticateUser,
  updateEmployeeLeaveApplyController
)
router.patch(
  '/approve-rep-auth/:employeeLeaveApplyId',
  authenticateUser,
  approveLeaveByRepAuthController
)
router.patch(
  '/approve-hr/:employeeLeaveApplyId',
  authenticateUser,
  approveLeaveByHrController
)
router.patch(
  '/rejectLeave/:employeeLeaveApplyId',
  authenticateUser,
  rejectLeaveController
)
router.delete(
  '/delete/:employeeLeaveApplyId',
  authenticateUser,
  deleteEmployeeLeaveApplyController
)
router.get(
  '/calculate-noOfDays',
  authenticateUser,
  calculateLeaveDaysController
)

export default router
