import { Router } from 'express'
import {
  getEmployeeAttendanceSummaryController,
  getEmployeeHeadCountSummaryController,
  getEmployeeLateAndEarlyOutSummaryController,
  getEmployeeLeaveSummaryController,
  getEmployeeLoneSummaryController,
  getSalaryStatusController,
} from '../controllers/dashbaord.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.get(
  '/leave-summary',
  authenticateUser,
  getEmployeeLeaveSummaryController
)
router.get(
  '/attendance-summary',
  authenticateUser,
  getEmployeeAttendanceSummaryController
)
router.get(
  '/salary-status',
  authenticateUser,
  getSalaryStatusController
)
router.get(
  '/lone-summary',
  authenticateUser,
  getEmployeeLoneSummaryController
)
router.get(
  '/late-and-early-out-summary',
  authenticateUser,
  getEmployeeLateAndEarlyOutSummaryController
)
router.get(
  '/head-count-summary',
  authenticateUser,
  getEmployeeHeadCountSummaryController
)

export default router
