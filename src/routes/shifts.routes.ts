import { Router } from 'express'
import {
  createShiftController,
  getShiftController,
  updateShiftController,
  deleteShiftController,
} from '../controllers/shifts.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createShiftController)
router.get('/getAll', authenticateUser, getShiftController)
router.patch('/edit/:shiftId', authenticateUser, updateShiftController)
router.delete('/delete/:shiftId', authenticateUser, deleteShiftController)

export default router
