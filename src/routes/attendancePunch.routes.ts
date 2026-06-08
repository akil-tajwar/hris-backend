import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import {
  createAttendancePunchController,
  updateAttendancePunchController,
  getAllAttendancePunchesController,
  getAttendancePunchByIdController,
  getAttendancePunchesByEmployeeController,
  deleteAttendancePunchController,
  createAttendanceDailyController,
  updateAttendanceDailyController,
  getAllAttendanceDailyController,
  getAttendanceDailyByIdController,
  getAttendanceDailyByEmployeeController,
  deleteAttendanceDailyController,
} from '../controllers/attendancePunch.controller'

const router = express.Router()

// --- Attendance Punches ---
router.post('/punch/create', authenticateUser, createAttendancePunchController)
router.patch('/punch/edit/:id', authenticateUser, updateAttendancePunchController)
router.get('/punch/getAll', authenticateUser, getAllAttendancePunchesController)
router.get('/punch/getById/:id', authenticateUser, getAttendancePunchByIdController)
router.get('/punch/getByEmployee/:employeeId', authenticateUser, getAttendancePunchesByEmployeeController)
router.delete('/punch/delete/:id', authenticateUser, deleteAttendancePunchController)

// --- Attendance Daily ---
router.post('/daily/create', authenticateUser, createAttendanceDailyController)
router.patch('/daily/edit/:id', authenticateUser, updateAttendanceDailyController)
router.get('/daily/getAll', authenticateUser, getAllAttendanceDailyController)
router.get('/daily/getById/:id', authenticateUser, getAttendanceDailyByIdController)
router.get('/daily/getByEmployee/:employeeId', authenticateUser, getAttendanceDailyByEmployeeController)
router.delete('/daily/delete/:id', authenticateUser, deleteAttendanceDailyController)

export default router