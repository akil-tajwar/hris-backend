import { Router } from 'express'
import {
  getNotificationsByUserIdController,
  markNotificationsAsReadController,
} from '../controllers/notifications.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.get('/get/:userId', authenticateUser, getNotificationsByUserIdController)
router.patch('/markAsRead', authenticateUser, markNotificationsAsReadController)

export default router
