import { Router } from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'

import {
  createAssetController,
  getAssetsController,
  getAssetByIdController,
  updateAssetController,
  deleteAssetController,
  createAssetTransactionController,
  getLatestAssetTransactionsController,
} from '../controllers/assets.controller'

const router = Router()

router.post('/create', authenticateUser, createAssetController)
router.get('/getAll', authenticateUser, getAssetsController)
router.get('/get/:assetId', authenticateUser, getAssetByIdController)
router.get(
  '/getLatestTransactions',
  authenticateUser,
  getLatestAssetTransactionsController
)
router.patch('/edit/:assetId', authenticateUser, updateAssetController)
router.delete('/delete/:assetId', authenticateUser, deleteAssetController)
router.post('/assign', authenticateUser, createAssetTransactionController)

export default router
