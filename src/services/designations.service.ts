import { db } from '../config/database'
import { Designation, designationModel, NewDesignation } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createDesignation = async (
  data: NewDesignation
) => {
  await db
    .insert(designationModel)
    .values(data)

  const [designation] = await db
    .select()
    .from(designationModel)
    .orderBy(designationModel.designationId)
    .limit(1)

  return designation
}

// READ ALL
export const getDesignations = async () => {
  return await db.select().from(designationModel)
}

// UPDATE
export const updateDesignation = async (
  data: Designation & { designationId: number },
) => {
  await db
    .update(designationModel)
    .set(data)
    .where(eq(designationModel.designationId, data.designationId))

  const [updated] = await db
    .select()
    .from(designationModel)
    .where(eq(designationModel.designationId, data.designationId))

  return updated
}

// DELETE
export const deleteDesignation = async (designationId: number) => {
  await db
    .delete(designationModel)
    .where(eq(designationModel.designationId, designationId))
}
