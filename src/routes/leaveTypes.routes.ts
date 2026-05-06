import { Router } from 'express'
import {
  createLeaveTypeController,
  getLeaveTypesController,
  updateLeaveTypeController,
  deleteLeaveTypeController,
} from '../controllers/leaveTypes.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createLeaveTypeController)
router.get('/getAll', authenticateUser, getLeaveTypesController)
router.patch('/edit/:leaveTypeId', authenticateUser, updateLeaveTypeController)
router.delete('/delete/:leaveTypeId', authenticateUser, deleteLeaveTypeController)

export default router
