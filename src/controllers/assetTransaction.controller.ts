import { Request, Response, NextFunction } from 'express'
import {
  createAssetTransaction,
  getAssetTransactions,
  getAssetTransactionById,
  updateAssetTransaction,
  deleteAssetTransaction,
  assignAsset,
} from '../services/assetTransaction.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createAssetTransactionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_asset_transaction')

    const transaction = await createAssetTransaction(
      req.body
    )

    res.status(201).json({
      status: 'success',
      data: transaction,
    })
  } catch (err) {
    next(err)
  }
}

export const getAssetTransactionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_asset_transaction')

    const transactions = await getAssetTransactions()

    res.json(transactions)
  } catch (err) {
    next(err)
  }
}

export const getAssetTransactionByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_asset_transaction')

    const transaction =
      await getAssetTransactionById(
        Number(req.params.assetTransactionId)
      )

    res.json({
      status: 'success',
      data: transaction,
    })
  } catch (err) {
    next(err)
  }
}

export const updateAssetTransactionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_asset_transaction')

    const transaction =
      await updateAssetTransaction({
        ...req.body,
        assetTransactionId: Number(
          req.params.assetTransactionId
        ),
      })

    res.json({
      status: 'success',
      data: transaction,
    })
  } catch (err) {
    next(err)
  }
}

export const deleteAssetTransactionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_asset_transaction')

    await deleteAssetTransaction(
      Number(req.params.assetTransactionId)
    )

    res.json({
      status: 'success',
      message: 'Asset transaction deleted',
    })
  } catch (err) {
    next(err)
  }
}

export const assignAssetController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'assign_asset')

    const result = await assignAsset(req.body)

    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}