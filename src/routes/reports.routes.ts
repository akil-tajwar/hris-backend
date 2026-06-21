import { Router } from 'express'

import {
  attendanceSummaryReportController,
  employeeActivitiesReportController,
  dailyAttendanceReportController,
  employeeAttendanceReportController,
  loneReportController,
  salaryReportController,
  getLeaveBalanceSummaryReportController,
} from '../controllers/reports.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.get(
  '/activity-report',
  authenticateUser,
  employeeActivitiesReportController
)
router.get(
  '/attendance-report',
  authenticateUser,
  employeeAttendanceReportController
)
router.get('/salary-report', authenticateUser, salaryReportController)
router.get('/lone-report', authenticateUser, loneReportController)
router.get(
  '/daily-attendance',
  authenticateUser,
  dailyAttendanceReportController
)
router.get(
  '/attendance-summary',
  authenticateUser,
  attendanceSummaryReportController
)
router.get(
  '/leave-balance-summary-report',
  authenticateUser,
  getLeaveBalanceSummaryReportController
)

export default router
