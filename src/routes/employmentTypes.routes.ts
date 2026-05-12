import { Router } from 'express'
import {
  createEmploymentTypeController,
  getEmploymentTypesController,
  updateEmploymentTypeController,
  deleteEmploymentTypeController,
} from '../controllers/employmentTypes.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createEmploymentTypeController)
router.get('/getAll', authenticateUser, getEmploymentTypesController)
router.patch('/edit/:employmentTypeId', authenticateUser, updateEmploymentTypeController)
router.delete('/delete/:employmentTypeId', authenticateUser, deleteEmploymentTypeController)

export default router
