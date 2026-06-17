import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import {
  createSingleShiftAllocationController,
  createBulkShiftAllocationController,
  updateShiftAllocationController,
  updateRecurrenceSettingController,
  copyShiftAllocationController,
  copyAllActiveAllocationsController,
  getAllShiftAllocationsController,
  getShiftAllocationByIdController,
  getShiftAllocationsByEmployeeController,
  deleteShiftAllocationController,
  getEmployeeWeekDaysController,
} from '../controllers/shiftAllocation.controller'

const router = express.Router()

router.post(
  '/create/single',
  authenticateUser,
  createSingleShiftAllocationController
)
router.post(
  '/create/bulk',
  authenticateUser,
  createBulkShiftAllocationController
)
router.patch('/edit/:id', authenticateUser, updateShiftAllocationController)
router.patch(
  '/recurrence/:id',
  authenticateUser,
  updateRecurrenceSettingController
)
router.post('/copy/:id', authenticateUser, copyShiftAllocationController)
router.post('/copy-all', authenticateUser, copyAllActiveAllocationsController)
router.get('/getAll', authenticateUser, getAllShiftAllocationsController)
router.get('/getById/:id', authenticateUser, getShiftAllocationByIdController)
router.get(
  '/employee/:employeeId',
  authenticateUser,
  getShiftAllocationsByEmployeeController
)
router.delete('/delete/:id', authenticateUser, deleteShiftAllocationController)
router.get(
  '/empWeekDays/:userId',
  authenticateUser,
  getEmployeeWeekDaysController
)

export default router
