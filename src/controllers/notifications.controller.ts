import { Request, Response, NextFunction } from 'express'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  getNotificationsByUserId,
  markNotificationsAsRead,
} from '../services/notifications.service'

export const getNotificationsByUserIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_notification')
    const { userId } = req.params
    const notification = await getNotificationsByUserId(Number(userId))
    res.json(notification)
  } catch (err) {
    next(err)
  }
}

export const markNotificationsAsReadController = async (
  req: Request,
  res: Response,
) => {
  try {
    requirePermission(req, 'marks_as_read_notification')
    const result = await markNotificationsAsRead(req.body)

    res.status(200).json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
