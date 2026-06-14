import { db } from '../config/database'
import {
  assetsModel,
  assetCategoryModel,
  Assets,
  NewAssets,
  employeeModel,
  assetTransactionsModel,
  employeeLifecycleEventsModel,
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

class AssetTransactionError extends Error {
  code: string
  context?: any

  constructor(message: string, code: string, context?: any) {
    super(message)
    this.name = 'AssetTransactionError'
    this.code = code
    this.context = context
  }
}

//assign asset
export const createAssetTransaction = async (data: {
  assetId: number
  employeeId?: number
  transactionType: keyof typeof assetStatusRules
  transactionDate: string
  remarks?: string
  approvedBy?: number
  createdBy: number
}) => {
  const toMySqlDate = (d: Date) => d.toISOString().split('T')[0]

  const step = (name: string, extra?: any) => {
    console.log(`🧩 [createAssetTransaction:${name}]`, extra ?? '')
  }

  try {
    step('START', data)

    return await db.transaction(async (tx) => {
      // 1. Get asset
      step('FETCH_ASSET', { assetId: data.assetId })

      const [asset] = await tx
        .select()
        .from(assetsModel)
        .where(eq(assetsModel.assetId, data.assetId))

      if (!asset) {
        throw new AssetTransactionError('Asset not found', 'ASSET_NOT_FOUND', {
          assetId: data.assetId,
        })
      }

      const rule = assetStatusRules[data.transactionType]

      if (!rule) {
        throw new AssetTransactionError(
          'Invalid transaction type',
          'INVALID_TRANSACTION_TYPE',
          { transactionType: data.transactionType }
        )
      }

      // 2. Current holder
      let currentHolder: any = null

      if (asset.currentStatus === 'ASSIGNED') {
        step('FETCH_CURRENT_HOLDER')

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

      // 3. Block invalid issue
      if (
        data.transactionType === 'ISSUE' &&
        asset.currentStatus === 'ASSIGNED'
      ) {
        throw new AssetTransactionError(
          'Asset already assigned',
          'ASSET_ALREADY_ASSIGNED',
          { currentHolder }
        )
      }

      // 4. Validate employee
      if (!rule.clearEmployee) {
        step('VALIDATE_EMPLOYEE', { employeeId: data.employeeId })

        if (!data.employeeId) {
          throw new AssetTransactionError(
            'Employee required for this transaction',
            'EMPLOYEE_REQUIRED'
          )
        }

        const [employee] = await tx
          .select()
          .from(employeeModel)
          .where(eq(employeeModel.employeeId, data.employeeId))

        if (!employee) {
          throw new AssetTransactionError(
            'Employee not found',
            'EMPLOYEE_NOT_FOUND',
            { employeeId: data.employeeId }
          )
        }
      }

      // 5. Validate date
      step('VALIDATE_DATE', data.transactionDate)

      const transactionDate = new Date(data.transactionDate)

      if (Number.isNaN(transactionDate.getTime())) {
        throw new AssetTransactionError(
          'Invalid transaction date',
          'INVALID_DATE',
          { transactionDate: data.transactionDate }
        )
      }

      // 6. Insert transaction
      step('INSERT_TRANSACTION')

      const [inserted] = await tx
        .insert(assetTransactionsModel)
        .values({
          assetId: data.assetId,
          employeeId: rule.clearEmployee ? null : (data.employeeId ?? null),
          transactionType: data.transactionType,
          transactionDate,
          remarks: data.remarks,
          approvedBy: data.approvedBy,
          createdBy: data.createdBy,
        })
        .$returningId()

      const transactionId = inserted.assetTransactionId

      // 7. Update asset
      step('UPDATE_ASSET_STATUS', rule.status)

      await tx
        .update(assetsModel)
        .set({ currentStatus: rule.status })
        .where(eq(assetsModel.assetId, data.assetId))

      // 8. Lifecycle mapping
      const lifecycleMap: Record<string, string> = {
        ISSUE: 'ASSET_ASSIGNED',
        RETURN: 'ASSET_RETURNED',
        TRANSFER: 'ASSET_TRANSFERRED',
        LOST: 'ASSET_LOST',
        DAMAGE: 'ASSET_DAMAGED',
        REPLACEMENT: 'ASSET_REPLACED',
      }

      const lifecycleEventType = lifecycleMap[data.transactionType]

      if (lifecycleEventType) {
        step('INSERT_LIFECYCLE_EVENT')

        const oldValue = {
          assetName: asset.assetName,
        }

        const newValue =
          data.transactionType === 'ISSUE'
            ? {
                assetName: asset.assetName,
              }
            : null

        await tx.insert(employeeLifecycleEventsModel).values({
          employeeId: data.employeeId ?? null,
          eventDate: toMySqlDate(new Date()),
          employeeEventType: lifecycleEventType,
          effectiveFrom: toMySqlDate(new Date(data.transactionDate)),
          remarks: data.remarks ?? null,
          performedBy: data.createdBy,
          approvedBy: data.approvedBy ?? null,
          referenceType: 'ASSET_TRANSACTION',
          referenceId: transactionId,

          oldValue,
          newValue,

          createdBy: data.createdBy,
        } as any)
      }

      step('SUCCESS')

      return {
        success: true,
        transactionId,
      }
    })
  } catch (err: any) {
    console.error('❌ Asset Transaction Failed:', {
      message: err.message,
      code: err.code,
      stack: err.stack,
      input: data,
      context: err.context,
    })

    throw err
  }
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
