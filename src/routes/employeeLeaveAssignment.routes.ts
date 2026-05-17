import { Router } from 'express'
import {
  createEmployeeLeaveAssignmentController,
  getAllEmployeeLeaveAssignmentsController,
  updateEmployeeLeaveAssignmentController,
  deleteEmployeeLeaveAssignmentController,
} from '../controllers/employeeLeaveAssignment.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createEmployeeLeaveAssignmentController)
router.get('/getAll', authenticateUser, getAllEmployeeLeaveAssignmentsController)
router.patch('/edit/:employeeLeaveAssignmentId', authenticateUser, updateEmployeeLeaveAssignmentController)
router.delete('/delete/:employeeLeaveAssignmentId', authenticateUser, deleteEmployeeLeaveAssignmentController)

export default router
