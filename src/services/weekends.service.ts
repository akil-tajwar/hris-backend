import { db } from "../config/database"
import { weekendModel } from "../schemas"

export const getWeekends = async () => {
  return await db.select().from(weekendModel)
}