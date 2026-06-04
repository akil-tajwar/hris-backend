import { eq } from 'drizzle-orm'

import { assetCategoryModel, NewAssetCategory } from '../schemas'
import { db } from '../config/database'
import { BadRequestError } from './utils/errors.utils'

export const createAssetCategory = async (
  assetCategoryData: NewAssetCategory
) => {
  try {
    const [newAssetCategory] = await db
      .insert(assetCategoryModel)
      .values(assetCategoryData)
      .execute()
    return newAssetCategory
  } catch (error) {
    throw error
  }
}

export const getAllAssetCategories = async () => {
  const assetCategories = await db.select().from(assetCategoryModel)
  if (!assetCategories.length) {
    throw BadRequestError('No asset categories found')
  }
  return assetCategories
}

export const updateAssetCategory = async (
  assetCategoryId: number,
  assetCategoryData: Partial<NewAssetCategory>
) => {
  const [updatedAssetCategory] = await db
    .update(assetCategoryModel)
    .set(assetCategoryData)
    .where(eq(assetCategoryModel.assetCategoryId, assetCategoryId))
    .execute()

  if (!updatedAssetCategory) {
    throw new Error('Asset category not found or update failed')
  }

  return updatedAssetCategory
}

export const deleteAssetCategory = async (assetCategoryId: number) => {
  await db
    .delete(assetCategoryModel)
    .where(eq(assetCategoryModel.assetCategoryId, assetCategoryId))
}
