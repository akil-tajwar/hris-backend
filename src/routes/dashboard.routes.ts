import { Router } from 'express'
import { getEmployeeAttendanceSummaryController, getEmployeeLeaveSummaryController } from '../controllers/dashbaord.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.get('/leave-summary', authenticateUser, getEmployeeLeaveSummaryController)
router.get('/attendance-summary', authenticateUser, getEmployeeAttendanceSummaryController)

export default router
