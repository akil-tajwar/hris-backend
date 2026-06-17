import { db } from '../config/database'
import { employmentTypeModel } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createEmploymentType = async (
  employmentTypeName: string,
  createdBy: number
) => {
  const result = await db
    .insert(employmentTypeModel)
    .values({ employmentTypeName, createdBy })

  const employmentTypeId = Number(result[0].insertId)

  const [employmentType] = await db
    .select()
    .from(employmentTypeModel)
    .where(eq(employmentTypeModel.employmentTypeId, employmentTypeId))

  return employmentType
}

// READ ALL
export const getEmploymentTypes = async () => {
  return await db.select().from(employmentTypeModel)
}

// UPDATE
export const updateEmploymentType = async (
  employmentTypeId: number,
  employmentTypeName: string,
  updatedBy: number
) => {
  await db
    .update(employmentTypeModel)
    .set({ employmentTypeName, updatedBy })
    .where(eq(employmentTypeModel.employmentTypeId, employmentTypeId))

  const [updated] = await db
    .select()
    .from(employmentTypeModel)
    .where(eq(employmentTypeModel.employmentTypeId, employmentTypeId))

  return updated
}

// DELETE
export const deleteEmploymentType = async (employmentTypeId: number) => {
  await db
    .delete(employmentTypeModel)
    .where(eq(employmentTypeModel.employmentTypeId, employmentTypeId))
}
