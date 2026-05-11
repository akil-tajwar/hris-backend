import { db } from '../config/database'
import { companyModel, NewCompany } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
/* ================================
   CREATE COMPANY
================================ */
export const createCompany = async (data: NewCompany) => {
  const insertResult = await db.insert(companyModel).values({
    ...data,
  })

  const companyId = Number(insertResult[0].insertId)

  const [company] = await db
    .select()
    .from(companyModel)
    .where(eq(companyModel.companyId, companyId))

  return company
}

/* ================================
   UPDATE COMPANY
================================ */
export const updateCompany = async (
  companyId: number,
  data: Partial<NewCompany>
) => {
  return await db.transaction(async (tx) => {
    // 🔍 Check existing company
    const existing = await tx.query.companyModel.findFirst({
      where: eq(companyModel.companyId, companyId),
    })

    if (!existing) {
      throw new Error('Company not found')
    }

    // 🔧 Normalize values
    const normalizeValue = (val: any) =>
      val === '' || val === undefined ? null : val

    // 🎯 Dynamic update object
    const updateData: any = {}

    Object.entries(data).forEach(([key, value]) => {
      updateData[key] = normalizeValue(value)
    })

    // 🕒 Updated time
    updateData.updatedAt = new Date()

    // ✅ Update
    if (Object.keys(updateData).length > 0) {
      await tx
        .update(companyModel)
        .set(updateData)
        .where(eq(companyModel.companyId, companyId))
    }

    // 📦 Return updated company
    const updatedCompany = await tx.query.companyModel.findFirst({
      where: eq(companyModel.companyId, companyId),
    })

    return updatedCompany
  })
}

// READ ALL
export const getCompanies = async () => {
  return await db.select().from(companyModel)
}

// READ ONE
export const getCompanyById = async (companyId: number) => {
  const [company] = await db
    .select()
    .from(companyModel)
    .where(eq(companyModel.companyId, companyId))

  return company
}

// DELETE
export const deleteCompany = async (companyId: number) => {
  await db.delete(companyModel).where(eq(companyModel.companyId, companyId))
}
