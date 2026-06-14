import { Router } from 'express'
import {
  processDateController,
  processRangeController,
} from '../controllers/attendanceProcessing.controller'
import { authenticateUser } from '../middlewares/auth.middleware'


const router = Router()

router.post('/process/range', authenticateUser, processRangeController)
router.get('/process/:date',authenticateUser, processDateController)


export default router