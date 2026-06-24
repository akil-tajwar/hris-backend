import { db } from '../config/database'
import { tenantModel } from '../schemas'
import { eq } from 'drizzle-orm'
import { createUser } from './auth.service'

// CREATE
export const createTenant = async (data: {
  tenantData: {
    tenantName: string
    status?: boolean
    createdBy: number
  }
  userData: any
}) => {
  return await db.transaction(async (tx) => {
    const [tenantResult] = await tx.insert(tenantModel).values({
      tenantName: data.tenantData.tenantName,
      status: data.tenantData.status ?? true,
      createdBy: data.tenantData.createdBy,
    })

    const tenantId = tenantResult.insertId

    const user = await createUser(tx as any, {
      ...data.userData,
      roleId: 1,
      tenantId,
      active: true,
      createdBy: data.tenantData.createdBy,
    })

    const [tenant] = await tx
      .select()
      .from(tenantModel)
      .where(eq(tenantModel.tenantId, tenantId))

    return {
      tenant,
      user,
    }
  })
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
  await db.delete(tenantModel).where(eq(tenantModel.tenantId, tenantId))
}
