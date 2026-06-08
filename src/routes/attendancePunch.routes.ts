import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import {
  createAttendancePunchController,
  updateAttendancePunchController,
  getAllAttendancePunchesController,
  getAttendancePunchByIdController,
  getAttendancePunchesByEmployeeController,
  deleteAttendancePunchController,
} from '../controllers/attendancePunch.controller'

const router = express.Router()

router.post('/create', authenticateUser, createAttendancePunchController)
router.patch('/edit/:id', authenticateUser, updateAttendancePunchController)
router.get('/getAll', authenticateUser, getAllAttendancePunchesController)
router.get('/getById/:id', authenticateUser, getAttendancePunchByIdController)
router.get('/getByEmployee/:employeeId', authenticateUser, getAttendancePunchesByEmployeeController)
router.delete('/delete/:id', authenticateUser, deleteAttendancePunchController)


export default router