import { db } from '../config/database'
import { CostCenter, costCenterModel, NewCostCenter } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createCostCenter = async (data: NewCostCenter) => {
  await db
    .insert(costCenterModel)
    .values(data)

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
  data: CostCenter & { costCenterId: number },
) => {
  await db
    .update(costCenterModel)
    .set(data)
    .where(eq(costCenterModel.costCenterId, data.costCenterId))

  const [updated] = await db
    .select()
    .from(costCenterModel)
    .where(eq(costCenterModel.costCenterId, data.costCenterId))

  return updated
}

// DELETE
export const deleteCostCenter = async (costCenterId: number) => {
  await db
    .delete(costCenterModel)
    .where(eq(costCenterModel.costCenterId, costCenterId))
}
