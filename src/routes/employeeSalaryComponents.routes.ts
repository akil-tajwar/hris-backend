import { Router } from 'express'
import {
  createEmployeeSalaryComponentController,
  deleteEmployeeSalaryComponentController,
  editEmployeeSalaryComponentController,
  getAllEmployeeSalaryComponentsController,
  getEmployeeSalaryComponentController,
} from '../controllers/employeeSalaryComponents.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createEmployeeSalaryComponentController)
router.get('/getAll', authenticateUser, getAllEmployeeSalaryComponentsController)
router.get('/getById/:id', authenticateUser, getEmployeeSalaryComponentController)
router.patch('/edit/:id', authenticateUser, editEmployeeSalaryComponentController)
router.delete('/delete/:id', authenticateUser, deleteEmployeeSalaryComponentController)

export default router
