import { db } from '../config/database'
import { departmentModel, NewDepartment } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createDepartment = async (data: NewDepartment) => {
  await db.insert(departmentModel).values(data)

  const [department] = await db
    .select()
    .from(departmentModel)
    .orderBy(departmentModel.departmentId)
    .limit(1)

  return department
}

// READ ALL
export const getDepartments = async () => {
  return await db.select().from(departmentModel)
}

// UPDATE
export const updateDepartment = async (
  data: { departmentId: number } & { departmentName: string; updatedBy: number }
) => {
  await db
    .update(departmentModel)
    .set(data)
    .where(eq(departmentModel.departmentId, data.departmentId))

  const [updated] = await db
    .select()
    .from(departmentModel)
    .where(eq(departmentModel.departmentId, data.departmentId))

  return updated
}

// DELETE
export const deleteDepartment = async (departmentId: number) => {
  await db
    .delete(departmentModel)
    .where(eq(departmentModel.departmentId, departmentId))
}
