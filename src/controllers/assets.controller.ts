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
    const tenantId = req.user?.tenantId
    const data = {
      ...req.body,
      tenantId,
    }
    const asset = await createAsset(data)

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

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const assets = await getAssets(tenantId)

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

    const tenantId = req.user?.tenantId
    const data = {
      ...req.body,
      tenantId,
    }
    console.log("🚀 ~ createAssetTransactionController ~ data:", data)

    const result = await createAssetTransaction(data)

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

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const transactions = await getLatestAssetTransactions(tenantId)

    res.json(transactions)
  } catch (err) {
    next(err)
  }
}
