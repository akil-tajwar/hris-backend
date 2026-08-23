import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../config/database'
import { companyPolicyModel, NewCompanyPolicy } from '../schemas'

export const bulkCreateCompanyPolicies = async (
  dataArray: NewCompanyPolicy[]
) => {
  if (!dataArray.length) return []

  await db.insert(companyPolicyModel).values(dataArray)

  // MySQL bulk insert doesn't return multiple insertIds directly,
  // so fetch back what we just inserted by tenant + year + companyIds
  const tenantId = dataArray[0].tenantId!
  const year = dataArray[0].year
  const companyIds = dataArray
    .map((d) => d.companyId)
    .filter((id): id is number => id != null)

  return db
    .select()
    .from(companyPolicyModel)
    .where(
      and(
        eq(companyPolicyModel.tenantId, tenantId),
        eq(companyPolicyModel.year, year),
        inArray(companyPolicyModel.companyId, companyIds)
      )
    )
}

export const getCompanyPolicies = async (tenantId: number, year?: number) => {
  const conditions = [eq(companyPolicyModel.tenantId, tenantId)]
  if (year !== undefined) conditions.push(eq(companyPolicyModel.year, year))

  return db
    .select()
    .from(companyPolicyModel)
    .where(and(...conditions))
}
