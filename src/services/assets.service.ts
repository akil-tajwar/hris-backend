import { db } from '../config/database'
import {
  assetsModel,
  assetCategoryModel,
  Assets,
  NewAssets,
  employeeModel,
  assetTransactionsModel,
} from '../schemas'
import { and, desc, eq, sql } from 'drizzle-orm'

// CREATE
export const createAsset = async (
  data: Omit<NewAssets, 'createdAt' | 'updatedAt'>
) => {
  try {
    // Remove asset_id if it's auto-generated
    const { assetId, ...insertData } = data as any

    // Convert ISO date strings to proper Date objects
    const formattedData = {
      ...insertData,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const [asset] = await db
      .insert(assetsModel)
      .values(formattedData)
      .$returningId()
      .execute()

    return asset
  } catch (error) {
    console.error('Error creating asset:', error)
    throw error
  }
}

// READ ALL
export const getAssets = async () => {
  return await db
    .select({
      assetId: assetsModel.assetId,
      assetCode: assetsModel.assetCode,
      assetName: assetsModel.assetName,
      categoryId: assetsModel.categoryId,
      serialNumber: assetsModel.serialNumber,
      purchaseDate: assetsModel.purchaseDate,
      purchaseValue: assetsModel.purchaseValue,
      currentStatus: assetsModel.currentStatus,
      createdBy: assetsModel.createdBy,
      createdAt: assetsModel.createdAt,
      updatedBy: assetsModel.updatedBy,
      updatedAt: assetsModel.updatedAt,

      categoryName: assetCategoryModel.categoryName,
    })
    .from(assetsModel)
    .leftJoin(
      assetCategoryModel,
      eq(assetsModel.categoryId, assetCategoryModel.assetCategoryId)
    )
}

// READ ONE
export const getAssetById = async (assetId: number) => {
  const [asset] = await db
    .select()
    .from(assetsModel)
    .where(eq(assetsModel.assetId, assetId))

  return asset
}

// UPDATE
export const updateAsset = async (data: Assets & { assetId: number }) => {
  try {
    const { assetId, ...updateData } = data

    // Create a new object for the update
    const formattedData: any = {}

    // Process each field
    for (const [key, value] of Object.entries(updateData)) {
      if (value === undefined || value === null) continue

      // Convert any field that looks like a date string
      if (
        typeof value === 'string' &&
        (key.includes('Date') ||
          key === 'purchaseDate' ||
          key === 'createdAt' ||
          key === 'updatedAt')
      ) {
        const dateObj = new Date(value)
        if (!isNaN(dateObj.getTime())) {
          formattedData[key] = dateObj
        } else {
          formattedData[key] = value
        }
      } else {
        formattedData[key] = value
      }
    }

    // Always set updatedAt to current date
    formattedData.updatedAt = new Date()

    // Remove any fields that shouldn't be updated
    delete formattedData.createdAt
    delete formattedData.createdBy
    delete formattedData.categoryName // This isn't a database field

    console.log('Formatted data for update:', formattedData)

    await db
      .update(assetsModel)
      .set(formattedData)
      .where(eq(assetsModel.assetId, assetId))

    const [updated] = await db
      .select()
      .from(assetsModel)
      .where(eq(assetsModel.assetId, assetId))

    return updated
  } catch (error) {
    console.error('Error updating asset:', error)
    throw error
  }
}

// DELETE
export const deleteAsset = async (assetId: number) => {
  await db.delete(assetsModel).where(eq(assetsModel.assetId, assetId))
}

const assetStatusRules: Record<
  'ISSUE' | 'RETURN' | 'TRANSFER' | 'LOST' | 'DAMAGE' | 'REPLACEMENT',
  { status: any; clearEmployee?: boolean }
> = {
  ISSUE: { status: 'ASSIGNED' },
  RETURN: { status: 'AVAILABLE', clearEmployee: true },
  TRANSFER: { status: 'ASSIGNED' },
  LOST: { status: 'LOST', clearEmployee: true },
  DAMAGE: { status: 'DAMAGE' },
  REPLACEMENT: { status: 'SCRAPPED', clearEmployee: true },
}

export const createAssetTransaction = async (data: {
  assetId: number
  employeeId?: number
  transactionType: keyof typeof assetStatusRules
  remarks?: string
  approvedBy?: number
  createdBy: number
}) => {
  return await db.transaction(async (tx) => {
    // 1. Get asset
    const [asset] = await tx
      .select()
      .from(assetsModel)
      .where(eq(assetsModel.assetId, data.assetId))

    if (!asset) {
      throw new Error('Asset not found')
    }

    const rule = assetStatusRules[data.transactionType]

    if (!rule) {
      throw new Error('Invalid transaction type')
    }

    // 2. If asset is already assigned, find current holder
    let currentHolder: { fullName: string; employeeCode: string } | null = null

    if (asset.currentStatus === 'ASSIGNED') {
      const [holder] = await tx
        .select({
          fullName: employeeModel.empFullName,
          employeeCode: employeeModel.empCode,
        })
        .from(assetTransactionsModel)
        .innerJoin(
          employeeModel,
          eq(employeeModel.employeeId, assetTransactionsModel.employeeId)
        )
        .where(
          and(
            eq(assetTransactionsModel.assetId, data.assetId),
            eq(assetTransactionsModel.transactionType, 'ISSUE')
          )
        )
        .orderBy(desc(assetTransactionsModel.transactionDate))
        .limit(1)

      currentHolder = holder || null
    }

    // 3. Block invalid ISSUE on already assigned asset
    if (
      data.transactionType === 'ISSUE' &&
      asset.currentStatus === 'ASSIGNED'
    ) {
      if (currentHolder) {
        throw new Error(
          `this asset is already assigned to ${currentHolder.fullName}-${currentHolder.employeeCode}`
        )
      } else {
        throw new Error('Asset is already assigned')
      }
    }

    // 4. Validate employee if required
    if (!rule.clearEmployee && data.employeeId) {
      const [employee] = await tx
        .select()
        .from(employeeModel)
        .where(eq(employeeModel.employeeId, data.employeeId))

      if (!employee) {
        throw new Error('Employee not found')
      }
    }

    // 5. Insert transaction
    await tx.insert(assetTransactionsModel).values({
      assetId: data.assetId,
      employeeId: rule.clearEmployee ? null : (data.employeeId ?? null),
      transactionType: data.transactionType,
      transactionDate: new Date(),
      remarks: data.remarks,
      approvedBy: data.approvedBy,
      createdBy: data.createdBy,
    })

    // 6. Update asset status
    await tx
      .update(assetsModel)
      .set({
        currentStatus: rule.status,
      })
      .where(eq(assetsModel.assetId, data.assetId))

    return {
      success: true,
      message: 'Asset transaction completed successfully',
    }
  })
}

//shows all asset transactions
// export const getAssetTransactions = async () => {
//   return await db
//     .select({
//       // Asset Transactions fields
//       assetTransactionId: assetTransactionsModel.assetTransactionId,
//       assetId: assetTransactionsModel.assetId,
//       employeeId: assetTransactionsModel.employeeId,
//       transactionType: assetTransactionsModel.transactionType,
//       transactionDate: assetTransactionsModel.transactionDate,
//       remarks: assetTransactionsModel.remarks,
//       approvedBy: assetTransactionsModel.approvedBy,
//       createdBy: assetTransactionsModel.createdBy,
//       createdAt: assetTransactionsModel.createdAt,
//       updatedBy: assetTransactionsModel.updatedBy,
//       updatedAt: assetTransactionsModel.updatedAt,
//       // Assets fields (from LEFT JOIN)
//       assetCode: assetsModel.assetCode,
//       assetName: assetsModel.assetName,
//     })
//     .from(assetTransactionsModel)
//     .leftJoin(
//       assetsModel,
//       eq(assetTransactionsModel.assetId, assetsModel.assetId)
//     )
// }

export const getLatestAssetTransactions = async () => {
  const latestPerAsset = db
    .select({
      assetId: assetTransactionsModel.assetId,
      maxId: sql`MAX(${assetTransactionsModel.assetTransactionId})`.as('maxId'),
    })
    .from(assetTransactionsModel)
    .groupBy(assetTransactionsModel.assetId)
    .as('latest')

  return await db
    .select({
      assetTransactionId: assetTransactionsModel.assetTransactionId,
      assetId: assetTransactionsModel.assetId,
      employeeId: assetTransactionsModel.employeeId,
      transactionType: assetTransactionsModel.transactionType,
      transactionDate: assetTransactionsModel.transactionDate,
      remarks: assetTransactionsModel.remarks,
      approvedBy: assetTransactionsModel.approvedBy,
      createdBy: assetTransactionsModel.createdBy,
      createdAt: assetTransactionsModel.createdAt,
      updatedBy: assetTransactionsModel.updatedBy,
      updatedAt: assetTransactionsModel.updatedAt,

      assetCode: assetsModel.assetCode,
      assetName: assetsModel.assetName,
    })
    .from(assetTransactionsModel)
    .innerJoin(
      latestPerAsset,
      and(
        eq(assetTransactionsModel.assetId, latestPerAsset.assetId),
        eq(assetTransactionsModel.assetTransactionId, latestPerAsset.maxId)
      )
    )
    .leftJoin(
      assetsModel,
      eq(assetTransactionsModel.assetId, assetsModel.assetId)
    )
}
