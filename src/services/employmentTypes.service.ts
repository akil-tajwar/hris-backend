import { db } from '../config/database'
import { employmentTypeModel, NewEmploymentType } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createEmploymentType = async (data: NewEmploymentType) => {
  await db.insert(employmentTypeModel).values(data)

  const [division] = await db
    .select()
    .from(employmentTypeModel)
    .orderBy(employmentTypeModel.employmentTypeId)
    .limit(1)

  return division
}

// READ ALL
export const getEmploymentTypes = async (tenantId: number) => {
  return await db
    .select()
    .from(employmentTypeModel)
    .where(eq(employmentTypeModel.tenantId, tenantId))
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
