import { Router } from 'express'
import {
  createOtherSalaryComponentController,
  deleteOtherSalaryComponentController,
  editOtherSalaryComponentController,
  getAllOtherSalaryComponentsController,
  getOtherSalaryComponentController,
} from '../controllers/otherSalaryComponents.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createOtherSalaryComponentController)
router.get('/getAll', authenticateUser, getAllOtherSalaryComponentsController)
router.get('/getById/:id', authenticateUser, getOtherSalaryComponentController)
router.patch('/edit/:id', authenticateUser, editOtherSalaryComponentController)
router.delete('/delete/:id', authenticateUser, deleteOtherSalaryComponentController)

export default router
