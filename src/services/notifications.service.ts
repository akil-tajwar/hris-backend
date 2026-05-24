import { desc, eq, inArray } from "drizzle-orm"
import { db } from "../config/database"
import { userModel, employeeModel, notificationsModel } from "../schemas"

export const getNotificationsByUserId = async (userId: number) => {
  // First, get the employee associated with this user
  const employee = await db
    .select()
    .from(employeeModel)
    .where(eq(employeeModel.userId, userId))
    .limit(1)

  // If no employee found, return empty array
  if (!employee || employee.length === 0) {
    return []
  }

  const employeeId = employee[0].employeeId

  // Then, get notifications for that employee
  const notifications = await db
    .select()
    .from(notificationsModel)
    .where(eq(notificationsModel.employeeId, employeeId))
    .orderBy(desc(notificationsModel.createdAt))

  return notifications
}

export const markNotificationsAsRead = async (
  notificationIds: number[]
) => {
  if (!notificationIds || notificationIds.length === 0) {
    throw new Error('notificationIds is required')
  }

  // remove duplicates safely
  const uniqueIds = [...new Set(notificationIds)]

  await db
    .update(notificationsModel)
    .set({ isRead: true })
    .where(inArray(notificationsModel.notificationId, uniqueIds))

  return {
    message: 'Notifications marked as read',
    updatedIds: uniqueIds,
  }
}