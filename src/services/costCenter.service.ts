import { db } from '../config/database'
import { costCenterModel } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createCostCenter = async (
  costCenterName: string,
  costCenterId: number,
  createdBy: number
) => {
  await db
    .insert(costCenterModel)
    .values({ costCenterName, costCenterId, createdBy })

  const [costCenter] = await db
    .select()
    .from(costCenterModel)
    .orderBy(costCenterModel.costCenterId)
    .limit(1)

  return costCenter
}

// READ ALL
export const getCostCenters = async () => {
  return await db.select().from(costCenterModel)
}


// READ ONE
export const getCostCenterById = async (costCenterId: number) => {
  const [costCenter] = await db
    .select()
    .from(costCenterModel)
    .where(eq(costCenterModel.costCenterId, costCenterId))

  return costCenter
}

// UPDATE
export const updateCostCenter = async (
  costCenterId: number,
  costCenterName: string,
  updatedBy: number
) => {
  await db
    .update(costCenterModel)
    .set({ costCenterName, costCenterId, updatedBy })
    .where(eq(costCenterModel.costCenterId, costCenterId))

  const [updated] = await db
    .select()
    .from(costCenterModel)
    .where(eq(costCenterModel.costCenterId, costCenterId))

  return updated
}

// DELETE
export const deleteCostCenter = async (costCenterId: number) => {
  await db
    .delete(costCenterModel)
    .where(eq(costCenterModel.costCenterId, costCenterId))
}
