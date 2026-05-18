import { Router } from 'express'
import {
  createSalaryComponentController,
  deleteSalaryComponentController,
  editSalaryComponentController,
  getAllSalaryComponentsController,
  getSalaryComponentController,
} from '../controllers/salaryComponents.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createSalaryComponentController)
router.get('/getAll', authenticateUser, getAllSalaryComponentsController)
router.get('/getById/:id', authenticateUser, getSalaryComponentController)
router.patch('/edit/:id', authenticateUser, editSalaryComponentController)
router.delete('/delete/:id', authenticateUser, deleteSalaryComponentController)

export default router
