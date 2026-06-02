import { db } from "../config/database"
import { notificationsModel } from "../schemas"
import { sendToUser } from "./sse"

export const notifyEmployee = async (
  employeeId: number,
  message: string,
  meta?: any
) => {
  try {
    // 1. SAVE TO DB (ALWAYS FIRST)
    const [saved] = await db
      .insert(notificationsModel)
      .values({
        employeeId,
        notification: message,
      })
      .$returningId()

    // 2. SEND SSE (best effort)
    sendToUser(employeeId, 'notification', {
      message,
      ...meta,
    })

    return {
      success: true,
      notificationId: saved?.notificationId,
    }
  } catch (error) {
    console.error('Notification failed:', error)

    return {
      success: false,
    }
  }
}
