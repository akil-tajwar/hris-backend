import { Router } from 'express'
import { aiChatController } from '../controllers/ai.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/chat', authenticateUser, aiChatController)

export default router
