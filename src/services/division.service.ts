import { db } from '../config/database'
import { Division, divisionModel, NewDivision } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createDivision = async (data: NewDivision) => {
  await db.insert(divisionModel).values(data)

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
  data: Division & { divisionId: number },
) => {
  await db
    .update(divisionModel)
    .set(data)
    .where(eq(divisionModel.divisionId, data.divisionId))

  const [updated] = await db
    .select()
    .from(divisionModel)
    .where(eq(divisionModel.divisionId, data.divisionId))

  return updated
}

// DELETE
export const deleteDivision = async (divisionId: number) => {
  await db
    .delete(divisionModel)
    .where(eq(divisionModel.divisionId, divisionId))
}