import { Router } from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'

import {
  createAssetTransactionController,
  getAssetTransactionsController,
  getAssetTransactionByIdController,
  updateAssetTransactionController,
  deleteAssetTransactionController,
  assignAssetController,
} from '../controllers/assetTransaction.controller'

const router = Router()

router.post('/create', authenticateUser, createAssetTransactionController)
router.get('/getAll', authenticateUser, getAssetTransactionsController)
router.get(
  '/get/:assetTransactionId',
  authenticateUser,
  getAssetTransactionByIdController
)
router.patch(
  '/edit/:assetTransactionId',
  authenticateUser,
  updateAssetTransactionController
)
router.delete(
  '/delete/:assetTransactionId',
  authenticateUser,
  deleteAssetTransactionController
)
router.post('/assign', authenticateUser, assignAssetController)

export default router
