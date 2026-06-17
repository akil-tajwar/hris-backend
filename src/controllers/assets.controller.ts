import { Request, Response, NextFunction } from 'express'
import {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  createAssetTransaction,
  getLatestAssetTransactions,
} from '../services/assets.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createAssetController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_asset')

    const asset = await createAsset(req.body)

    res.status(201).json({
      status: 'success',
      data: asset,
    })
  } catch (err) {
    next(err)
  }
}

export const getAssetsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_asset')

    const assets = await getAssets()

    res.json(assets)
  } catch (err) {
    next(err)
  }
}

export const getAssetByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_asset')

    const asset = await getAssetById(Number(req.params.assetId))

    res.json({
      status: 'success',
      data: asset,
    })
  } catch (err) {
    next(err)
  }
}

export const updateAssetController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_asset')

    const asset = await updateAsset({
      ...req.body,
      assetId: Number(req.params.assetId),
    })

    res.json({
      status: 'success',
      data: asset,
    })
  } catch (err) {
    next(err)
  }
}

export const deleteAssetController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_asset')

    await deleteAsset(Number(req.params.assetId))

    res.json({
      status: 'success',
      message: 'Asset deleted',
    })
  } catch (err) {
    next(err)
  }
}

export const createAssetTransactionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'assign_asset')

    const result = await createAssetTransaction(req.body)

    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export const getLatestAssetTransactionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_assigned_asset')

    const transactions = await getLatestAssetTransactions()

    res.json(transactions)
  } catch (err) {
    next(err)
  }
}