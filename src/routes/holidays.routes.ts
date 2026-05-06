import { Router } from 'express'
import {
  createHolidayController,
  deleteHolidayController,
  editHolidayController,
  getAllHolidaysController,
  getHolidayController,
} from '../controllers/holidays.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createHolidayController)
router.get('/getAll', authenticateUser, getAllHolidaysController)
router.get('/getById/:id', authenticateUser, getHolidayController)
router.patch('/edit/:id', authenticateUser, editHolidayController)
router.delete('/delete/:id', authenticateUser, deleteHolidayController)

export default router
