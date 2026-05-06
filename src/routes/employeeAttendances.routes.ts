import { Router } from 'express'
import {
  createEmployeeAttendanceController,
  deleteEmployeeAttendanceController,
  editEmployeeAttendanceController,
  getAllEmployeeAttendancesController,
  getEmployeeAttendanceController,
} from '../controllers/employeeAttendances.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createEmployeeAttendanceController)
router.get('/getAll', authenticateUser, getAllEmployeeAttendancesController)
router.get('/getById/:id', authenticateUser, getEmployeeAttendanceController)
router.patch('/edit/:id', authenticateUser, editEmployeeAttendanceController)
router.delete('/delete/:id', authenticateUser, deleteEmployeeAttendanceController)

export default router
