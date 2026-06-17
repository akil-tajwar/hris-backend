import { db } from '../config/database'
import {
  assetTransactionsModel,
  assetsModel,
  employeeModel,
  AssetTransaction,
  NewAssetTransaction,
} from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createAssetTransaction = async (
  data: NewAssetTransaction
) => {
  await db.insert(assetTransactionsModel).values(data)

  const [transaction] = await db
    .select()
    .from(assetTransactionsModel)
    .orderBy(assetTransactionsModel.assetTransactionId)
    .limit(1)

  return transaction
}

// READ ALL
export const getAssetTransactions = async () => {
  return await db.select().from(assetTransactionsModel)
}

// READ ONE
export const getAssetTransactionById = async (
  assetTransactionId: number
) => {
  const [transaction] = await db
    .select()
    .from(assetTransactionsModel)
    .where(
      eq(
        assetTransactionsModel.assetTransactionId,
        assetTransactionId
      )
    )

  return transaction
}

// UPDATE
export const updateAssetTransaction = async (
  data: AssetTransaction & {
    assetTransactionId: number
  }
) => {
  await db
    .update(assetTransactionsModel)
    .set(data)
    .where(
      eq(
        assetTransactionsModel.assetTransactionId,
        data.assetTransactionId
      )
    )

  const [updated] = await db
    .select()
    .from(assetTransactionsModel)
    .where(
      eq(
        assetTransactionsModel.assetTransactionId,
        data.assetTransactionId
      )
    )

  return updated
}

// DELETE
export const deleteAssetTransaction = async (
  assetTransactionId: number
) => {
  await db
    .delete(assetTransactionsModel)
    .where(
      eq(
        assetTransactionsModel.assetTransactionId,
        assetTransactionId
      )
    )
}

// ASSIGN ASSET
export const assignAsset = async (data: {
  assetId: number
  employeeId: number
  remarks?: string
  approvedBy?: number
  createdBy: number
}) => {
  return await db.transaction(async (tx) => {
    const [asset] = await tx
      .select()
      .from(assetsModel)
      .where(eq(assetsModel.assetId, data.assetId))

    if (!asset) {
      throw new Error('Asset not found')
    }

    if (asset.currentStatus !== 'AVAILABLE') {
      throw new Error(
        `Asset is currently ${asset.currentStatus}`
      )
    }

    const [employee] = await tx
      .select()
      .from(employeeModel)
      .where(eq(employeeModel.employeeId, data.employeeId))

    if (!employee) {
      throw new Error('Employee not found')
    }

    await tx.insert(assetTransactionsModel).values({
      assetId: data.assetId,
      employeeId: data.employeeId,
      transactionType: 'ISSUE',
      transactionDate: new Date(),
      remarks: data.remarks,
      approvedBy: data.approvedBy,
      createdBy: data.createdBy,
    })

    await tx
      .update(assetsModel)
      .set({
        currentStatus: 'ASSIGNED',
      })
      .where(eq(assetsModel.assetId, data.assetId))

    return {
      success: true,
      message: 'Asset assigned successfully',
    }
  })
}