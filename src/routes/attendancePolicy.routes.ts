import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import {
  createAttendancePolicyController,
  updateAttendancePolicyController,
  getAllAttendancePoliciesController,
  getAttendancePolicyByIdController,
  deleteAttendancePolicyController,
} from '../controllers/attendancePolicy.controller'

const router = express.Router()

router.post('/create', authenticateUser, createAttendancePolicyController)
router.patch('/edit/:id', authenticateUser, updateAttendancePolicyController)
router.get('/getAll', authenticateUser, getAllAttendancePoliciesController)
router.get('/getById/:id', authenticateUser, getAttendancePolicyByIdController)
router.delete('/delete/:id', authenticateUser, deleteAttendancePolicyController)

export default router