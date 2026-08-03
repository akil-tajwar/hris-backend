import { Router } from 'express'
import { getEmployeeAttendanceSummaryController, getEmployeeLeaveSummaryController, getEmployeeLoneSummaryController, getSalaryStatusController} from '../controllers/dashbaord.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.get('/leave-summary', authenticateUser, getEmployeeLeaveSummaryController)
router.get('/attendance-summary', authenticateUser, getEmployeeAttendanceSummaryController)
router.get('/salary-status', authenticateUser, getSalaryStatusController)
router.get('/lone-summary', authenticateUser, getEmployeeLoneSummaryController)

export default router
