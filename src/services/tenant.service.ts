import { db } from '../config/database'
import { NewTenant, tenantModel } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createTenant = async (data: NewTenant) => {
  await db.insert(tenantModel).values(data)

  const [tenant] = await db
    .select()
    .from(tenantModel)
    .orderBy(tenantModel.tenantId)
    .limit(1)

  return tenant
}

// READ ALL
export const getTenants = async () => {
  return await db.select().from(tenantModel)
}

// UPDATE
export const updateTenant = async (
  tenantId: number,
  tenantName: string,
  updatedBy: number
) => {
  await db
    .update(tenantModel)
    .set({ tenantName, updatedBy })
    .where(eq(tenantModel.tenantId, tenantId))

  const [updated] = await db
    .select()
    .from(tenantModel)
    .where(eq(tenantModel.tenantId, tenantId))

  return updated
}

// DELETE
export const deleteTenant = async (tenantId: number) => {
  await db
    .delete(tenantModel)
    .where(eq(tenantModel.tenantId, tenantId))
}
