import { Router } from 'express'
import {
  createAttendanceDailyApplyController,
  editAttendanceDailyApplyController,
  getAttendanceApplyByUserIdController,
  acceptedAttendanceApplyByRepAuthController,
  acceptedAttendanceApplyByByHrController,
  rejectAttendanceApplyController,
  getAllAttendanceApplyController,
} from '../controllers/attendanceDailyApply.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create/:attendanceDailyId', authenticateUser, createAttendanceDailyApplyController)
router.patch(
  '/edit/:attendanceDailyApplyId',
  authenticateUser,
  editAttendanceDailyApplyController
)
router.get(
  '/getByUserId/:userId',
  authenticateUser,
  getAttendanceApplyByUserIdController
)
router.get(
  '/getAll',
  authenticateUser,
  getAllAttendanceApplyController
)
router.patch(
  '/approve-rep-auth/:attendanceDailyApplyId',
  authenticateUser,
  acceptedAttendanceApplyByRepAuthController
)
router.patch(
  '/approve-hr/:attendanceDailyApplyId',
  authenticateUser,
  acceptedAttendanceApplyByByHrController
)
router.patch(
  '/reject/:attendanceDailyApplyId',
  authenticateUser,
  rejectAttendanceApplyController
)

export default router