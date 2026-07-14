import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import {
  createAttendanceDailyController,
  updateAttendanceDailyController,
  getAllAttendanceDailyController,
  getAttendanceDailyByIdController,
  getAttendanceDailyByUserIdController,
  deleteAttendanceDailyController,
} from '../controllers/attendanceDaily.controller'

const router = express.Router()

router.post('/create', authenticateUser, createAttendanceDailyController)
router.patch('/edit/:id', authenticateUser, updateAttendanceDailyController)
router.get('/getAll', authenticateUser, getAllAttendanceDailyController)
router.get('/getById/:id', authenticateUser, getAttendanceDailyByIdController)
router.get('/getByUserId/:userId', authenticateUser, getAttendanceDailyByUserIdController)
router.delete('/delete/:id', authenticateUser, deleteAttendanceDailyController)

export default router