import { Router } from 'express'
import { getEmployeeAttendanceSummaryController, getSalaryStatusController} from '../controllers/dashbaord.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

// router.get('/leave-summary', authenticateUser, getEmployeeLeaveSummaryController)
router.get('/attendance-summary', authenticateUser, getEmployeeAttendanceSummaryController)
router.get('/salary-status', authenticateUser, getSalaryStatusController)

export default router
