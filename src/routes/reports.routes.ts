import { Router } from 'express'

import { employeeAttendanceReportController, loneReportController, salaryReportController } from '../controllers/reports.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.get('/attendance-report', authenticateUser, employeeAttendanceReportController)
router.get('/salary-report', authenticateUser, salaryReportController)
router.get('/lone-report', authenticateUser, loneReportController)

export default router
