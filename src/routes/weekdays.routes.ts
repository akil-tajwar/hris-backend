import { Router } from 'express'
import { getWeekDaysController } from '../controllers/weekdayss.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.get('/getAll', authenticateUser, getWeekDaysController)

export default router
