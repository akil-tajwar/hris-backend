import { db } from '../config/database'
import { divisionModel } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createDivision = async (divisionName: string, divisionId: number, createdBy: number) => {
  await db.insert(divisionModel).values({ divisionName, divisionId, createdBy })

  const [division] = await db
    .select()
    .from(divisionModel)
    .orderBy(divisionModel.divisionId)
    .limit(1)

  return division
}

// READ ALL
export const getDivisions = async () => {
  return await db.select().from(divisionModel)
}

// READ ONE
export const getDivisionById = async (divisionId: number) => {
  const [division] = await db
    .select()
    .from(divisionModel)
    .where(eq(divisionModel.divisionId, divisionId))
  
  return division
}

// UPDATE
export const updateDivision = async (
  divisionId: number,
  divisionName: string,
  updatedBy: number
) => {
  await db
    .update(divisionModel)
    .set({ divisionName, divisionId, updatedBy })
    .where(eq(divisionModel.divisionId, divisionId))

  const [updated] = await db
    .select()
    .from(divisionModel)
    .where(eq(divisionModel.divisionId, divisionId))

  return updated
}

// DELETE
export const deleteDivision = async (divisionId: number) => {
  await db
    .delete(divisionModel)
    .where(eq(divisionModel.divisionId, divisionId))
}