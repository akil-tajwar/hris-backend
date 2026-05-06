import { db } from '../config/database'
import { leaveTypeModel, NewLeaveType } from '../schemas'
import { eq, inArray } from 'drizzle-orm'

// CREATE
export const createLeaveType = async (data: NewLeaveType | NewLeaveType[]) => {
  // normalize to array
  const values = Array.isArray(data) ? data : [data]

  const result = await db.insert(leaveTypeModel).values(values)

  // SQLite specific
  const lastId = Number(result[0].insertId)
  const firstId = lastId - values.length + 1

  return await db
    .select()
    .from(leaveTypeModel)
    .where(
      inArray(
        leaveTypeModel.leaveTypeId,
        Array.from({ length: values.length }, (_, i) => firstId + i)
      )
    )
}
// READ ALL
export const getLeaveTypes = async () => {
  return await db.select().from(leaveTypeModel)
}

// UPDATE
export const updateLeaveType = async (
  leaveTypeId: number,
  data: Partial<NewLeaveType>
) => {
  await db
    .update(leaveTypeModel)
    .set(data)
    .where(eq(leaveTypeModel.leaveTypeId, leaveTypeId))

  const [updated] = await db
    .select()
    .from(leaveTypeModel)
    .where(eq(leaveTypeModel.leaveTypeId, leaveTypeId))

  return updated
}

// DELETE
export const deleteLeaveType = async (leaveTypeId: number) => {
  await db
    .delete(leaveTypeModel)
    .where(eq(leaveTypeModel.leaveTypeId, leaveTypeId))
}
