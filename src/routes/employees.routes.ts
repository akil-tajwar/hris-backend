import express from 'express'
import { upload } from '../middlewares/upload'
import {
  createEmployeeController,
  updateEmployeeController,
  getAllEmployeesController,
  getEmployeeByIdController,
  deleteEmployeeController,
  assignLeaveTypeController,
} from '../controllers/employees.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = express.Router()

router.post(
  '/create',
  upload.fields([
    { name: 'photoUrl', maxCount: 1 },
    { name: 'cvUrl', maxCount: 1 },
  ]),
  authenticateUser,
  createEmployeeController
)
router.patch(
  '/edit/:id',
  upload.fields([
    { name: 'photoUrl', maxCount: 1 },
    { name: 'cvUrl', maxCount: 1 },
  ]),
  authenticateUser,
  updateEmployeeController
)
router.get('/getAll', authenticateUser, getAllEmployeesController)
router.get('/getById/:id', authenticateUser, getEmployeeByIdController)
router.delete('/delete/:id', authenticateUser, deleteEmployeeController)
router.patch('/assignLeaveType', authenticateUser, assignLeaveTypeController)

export default router
