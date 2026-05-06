import { Router } from 'express'
import {
  createEmployeeTypeController,
  getEmployeeTypesController,
  updateEmployeeTypeController,
  deleteEmployeeTypeController,
} from '../controllers/employeeTypes.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createEmployeeTypeController)
router.get('/getAll', authenticateUser, getEmployeeTypesController)
router.patch('/edit/:employeeTypeId', authenticateUser, updateEmployeeTypeController)
router.delete('/delete/:employeeTypeId', authenticateUser, deleteEmployeeTypeController)

export default router
