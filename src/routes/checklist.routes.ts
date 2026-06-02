// leave-policy.route.ts

import { Router } from 'express'
import {
  completeChecklistController,
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
router.patch('/completeChecklist/:checklistMasterId', authenticateUser, completeChecklistController)
router.delete('/delete/:id', authenticateUser, deleteChecklistController)


export default router