import { db } from '../config/database'
import { businessUnitsModel, NewBusinessUnit } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createBusinessUnit = async (data: NewBusinessUnit) => {
  await db.insert(businessUnitsModel).values(data)

  const [businessUnit] = await db
    .select()
    .from(businessUnitsModel)
    .orderBy(businessUnitsModel.businessUnitId)
    .limit(1)

  return businessUnit
}

// READ ALL
export const getBusinessUnits = async () => {
  return await db.select().from(businessUnitsModel)
}

// UPDATE
export const updateBusinessUnit = async (
  data: { businessUnitId: number } & { businessUnitName: string; updatedBy: number }
) => {
  await db
    .update(businessUnitsModel)
    .set(data)
    .where(eq(businessUnitsModel.businessUnitId, data.businessUnitId))

  const [updated] = await db
    .select()
    .from(businessUnitsModel)
    .where(eq(businessUnitsModel.businessUnitId, data.businessUnitId))

  return updated
}

// DELETE
export const deleteBusinessUnit = async (businessUnitId: number) => {
  await db
    .delete(businessUnitsModel)
    .where(eq(businessUnitsModel.businessUnitId, businessUnitId))
}
