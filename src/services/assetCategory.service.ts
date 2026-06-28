import { eq } from 'drizzle-orm'

import { assetCategoryModel, NewAssetCategory } from '../schemas'
import { db } from '../config/database'
import { BadRequestError } from './utils/errors.utils'

export const createAssetCategory = async (
  assetCategoryData: Omit<NewAssetCategory, 'createdAt' | 'updatedAt'>
) => {
  try {
    const [newAssetCategory] = await db
      .insert(assetCategoryModel)
      .values({
        ...assetCategoryData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute()
    return newAssetCategory
  } catch (error) {
    throw error
  }
}

export const getAllAssetCategories = async (tenantId: number) => {
  const assetCategories = await db
    .select()
    .from(assetCategoryModel)
    .where(eq(assetCategoryModel.tenantId, tenantId))

  if (!assetCategories.length) {
    throw BadRequestError('No asset categories found')
  }

  return assetCategories
}

export const updateAssetCategory = async (
  assetCategoryId: number,
  assetCategoryData: Partial<Omit<NewAssetCategory, 'createdAt' | 'updatedAt'>>
) => {
  // Remove any timestamp fields that might be in the update data
  const { createdAt, updatedAt, ...cleanData } = assetCategoryData as any;
  
  const [updatedAssetCategory] = await db
    .update(assetCategoryModel)
    .set({ 
      ...cleanData, 
      updatedAt: new Date()  // Only update this timestamp
    })
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
