import { Request, Response, NextFunction } from 'express'
import {
  createAssetCategory,
  getAllAssetCategories,
  updateAssetCategory,
  deleteAssetCategory,
} from '../services/assetCategory.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createAssetCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_asset_category')
    const assetCategory = await createAssetCategory(req.body)
    res.status(201).json({ status: 'success', data: assetCategory })
  } catch (err) {
    next(err)
  }
}

export const getAssetCategorysController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_asset_category')
    const assetCategorys = await getAllAssetCategories()
    res.json(assetCategorys)
  } catch (err) {
    next(err)
  }
}

export const updateAssetCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_asset_category')
    const { assetCategoryId } = req.params
    const assetCategory = await updateAssetCategory(
      Number(assetCategoryId),
      req.body,
    )
    res.json({ status: 'success', data: assetCategory })
  } catch (err) {
    next(err)
  }
}

export const deleteAssetCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_asset_category')
    const { assetCategoryId } = req.params
    await deleteAssetCategory(Number(assetCategoryId))
    res.json({ status: 'success', message: 'AssetCategory deleted' })
  } catch (err) {
    next(err)
  }
}
