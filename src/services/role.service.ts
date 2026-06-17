import { db } from "../config/database"
import { roleModel } from "../schemas"

export const getRoles = async () => {
  return await db.select().from(roleModel)
}