import { db } from '../config/database'
import { companyModel } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createCompany = async (companyName: string, createdBy: number) => {
  await db.insert(companyModel).values({ companyName, createdBy })

  const [company] = await db
    .select()
    .from(companyModel)
    .orderBy(companyModel.companyId)
    .limit(1)

  return company
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

// UPDATE
export const updateCompany = async (
  companyId: number,
  companyName: string,
  updatedBy: number
) => {
  await db
    .update(companyModel)
    .set({ companyName, updatedBy })
    .where(eq(companyModel.companyId, companyId))

  const [updated] = await db
    .select()
    .from(companyModel)
    .where(eq(companyModel.companyId, companyId))

  return updated
}

// DELETE
export const deleteCompany = async (companyId: number) => {
  await db
    .delete(companyModel)
    .where(eq(companyModel.companyId, companyId))
}