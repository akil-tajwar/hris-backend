import { Router } from 'express'
import {
  createDesignationController,
  getDesignationsController,
  updateDesignationController,
  deleteDesignationController,
} from '../controllers/designations.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createDesignationController)
router.get('/getAll', authenticateUser, getDesignationsController)
router.patch('/edit/:designationId', authenticateUser, updateDesignationController)
router.delete('/delete/:designationId', authenticateUser, deleteDesignationController)

export default router
