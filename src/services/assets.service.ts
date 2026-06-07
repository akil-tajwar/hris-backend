import { db } from '../config/database'
import {
  assetsModel,
  assetCategoryModel,
  Assets,
  NewAssets,
} from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createAsset = async (data: NewAssets) => {
  await db.insert(assetsModel).values(data)

  const [asset] = await db
    .select()
    .from(assetsModel)
    .orderBy(assetsModel.assetId)
    .limit(1)

  return asset
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
export const updateAsset = async (
  data: Assets & { assetId: number }
) => {
  await db
    .update(assetsModel)
    .set(data)
    .where(eq(assetsModel.assetId, data.assetId))

  const [updated] = await db
    .select()
    .from(assetsModel)
    .where(eq(assetsModel.assetId, data.assetId))

  return updated
}

// DELETE
export const deleteAsset = async (assetId: number) => {
  await db.delete(assetsModel).where(eq(assetsModel.assetId, assetId))
}