import { Router } from 'express'
import { getWeekendsController } from '../controllers/weekdends.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.get('/getAll', authenticateUser, getWeekendsController)

export default router
