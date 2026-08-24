import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../config/database'
import { companyPolicyChunksModel, companyPolicyModel, NewCompanyPolicy } from '../schemas'
import { buildChunksForPolicy, chunkAndStorePolicy } from './companyPolicyChunk.service'

export const bulkCreateCompanyPolicies = async (
  dataArray: NewCompanyPolicy[]
) => {
  if (!dataArray.length) return []

  return await db.transaction(async (tx) => {
    // Step 1: insert policies
    await tx.insert(companyPolicyModel).values(dataArray)

    const tenantId = dataArray[0].tenantId!
    const year = dataArray[0].year
    const companyIds = dataArray
      .map((d) => d.companyId)
      .filter((id): id is number => id != null)

    // Step 2: fetch back inserted policies
    const result = await tx
      .select()
      .from(companyPolicyModel)
      .where(
        and(
          eq(companyPolicyModel.tenantId, tenantId),
          eq(companyPolicyModel.year, year),
          inArray(companyPolicyModel.companyId, companyIds)
        )
      )

    // Step 3: chunk each policy — if ANY fails, the transaction rolls back everything
    for (const policy of result) {
      if (!policy.pdfUrl) {
        throw new Error(
          `Policy ${policy.companyPolicyId} has no pdfUrl — aborting transaction`
        )
      }

      const chunks = await buildChunksForPolicy({
        tenantId: policy.tenantId ?? 0,
        companyId: policy.companyId ?? 0,
        year: policy.year,
        pdfUrl: policy.pdfUrl,
        documentName: policy.name,
      })

      if (chunks.length === 0) {
        throw new Error(
          `Policy "${policy.name}" produced no chunks — PDF may be empty or unreadable`
        )
      }

      await tx.insert(companyPolicyChunksModel).values(chunks)

      console.log(
        `Inserted ${chunks.length} chunks for policy "${policy.name}"`
      )
    }

    return result
  })
}

export const getCompanyPolicies = async (tenantId: number, year?: number) => {
  const conditions = [eq(companyPolicyModel.tenantId, tenantId)]
  if (year !== undefined) conditions.push(eq(companyPolicyModel.year, year))

  return db
    .select()
    .from(companyPolicyModel)
    .where(and(...conditions))
}
