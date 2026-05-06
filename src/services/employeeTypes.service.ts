import { db } from '../config/database'
import { employeeTypeModel } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createEmployeeType = async (
  employeeTypeName: string,
  createdBy: number
) => {
  const result = await db
    .insert(employeeTypeModel)
    .values({ employeeTypeName, createdBy })

  const employeeTypeId = Number(result[0].insertId)

  const [employeeType] = await db
    .select()
    .from(employeeTypeModel)
    .where(eq(employeeTypeModel.employeeTypeId, employeeTypeId))

  return employeeType
}

// READ ALL
export const getEmployeeTypes = async () => {
  return await db.select().from(employeeTypeModel)
}

// UPDATE
export const updateEmployeeType = async (
  employeeTypeId: number,
  employeeTypeName: string,
  updatedBy: number
) => {
  await db
    .update(employeeTypeModel)
    .set({ employeeTypeName, updatedBy })
    .where(eq(employeeTypeModel.employeeTypeId, employeeTypeId))

  const [updated] = await db
    .select()
    .from(employeeTypeModel)
    .where(eq(employeeTypeModel.employeeTypeId, employeeTypeId))

  return updated
}

// DELETE
export const deleteEmployeeType = async (employeeTypeId: number) => {
  await db
    .delete(employeeTypeModel)
    .where(eq(employeeTypeModel.employeeTypeId, employeeTypeId))
}
