// leave-policy.route.ts

import { Router } from 'express'
import {
  createChecklistController,
  deleteChecklistController,
  getAllChecklistsController,
  updateChecklistController,
} from '../controllers/checklist.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createChecklistController)
router.get('/getAll', authenticateUser, getAllChecklistsController)
router.patch('/edit/:id', authenticateUser, updateChecklistController)
router.delete('/delete/:id', authenticateUser, deleteChecklistController)


export default router