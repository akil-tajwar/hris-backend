import { db } from "../config/database"
import { weekDayModel } from "../schemas"

export const getWeekDays = async () => {
  return await db.select().from(weekDayModel)
}