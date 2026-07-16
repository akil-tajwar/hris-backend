import { Router } from 'express'

import {
  attendanceSummaryReportController,
  employeeActivitiesReportController,
  dailyAttendanceReportController,
  employeeAttendanceReportController,
  salaryReportController,
  getLeaveBalanceSummaryReportController,
  leaveLedgerReportController,
  shiftReportController,
  getIndividualAttendanceSummaryController,
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
router.get(
  '/leave-ledger-report',
  authenticateUser,
  leaveLedgerReportController
)
router.get(
  '/shift-report',
  authenticateUser,
  shiftReportController
)
router.get(
  '/individual-attendance-summary',
  authenticateUser,
  getIndividualAttendanceSummaryController
)

export default router
