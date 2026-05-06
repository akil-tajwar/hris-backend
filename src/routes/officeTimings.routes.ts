import { Router } from 'express'
import {
  createOfficeTimingController,
  getOfficeTimingsController,
  updateOfficeTimingController,
  deleteOfficeTimingController,
} from '../controllers/officeTimings.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createOfficeTimingController)
router.get('/getAll', authenticateUser, getOfficeTimingsController)
router.patch('/edit/:officeTimingId', authenticateUser, updateOfficeTimingController)
router.delete('/delete/:officeTimingId', authenticateUser, deleteOfficeTimingController)

export default router
