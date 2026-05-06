import { Router } from 'express'
import {
  createEmployeeOtherSalaryComponentController,
  deleteEmployeeOtherSalaryComponentController,
  editEmployeeOtherSalaryComponentController,
  getAllEmployeeOtherSalaryComponentsController,
  getEmployeeOtherSalaryComponentController,
} from '../controllers/employeeOtherSalaryComponents.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createEmployeeOtherSalaryComponentController)
router.get('/getAll', authenticateUser, getAllEmployeeOtherSalaryComponentsController)
router.get('/getById/:id', authenticateUser, getEmployeeOtherSalaryComponentController)
router.patch('/edit/:id', authenticateUser, editEmployeeOtherSalaryComponentController)
router.delete('/delete/:id', authenticateUser, deleteEmployeeOtherSalaryComponentController)

export default router
