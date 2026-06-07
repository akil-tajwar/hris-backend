import { Router } from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'

import {
  createAssetController,
  getAssetsController,
  getAssetByIdController,
  updateAssetController,
  deleteAssetController,
} from '../controllers/assets.controller'

const router = Router()

router.post('/create', authenticateUser, createAssetController)
router.get('/getAll', authenticateUser, getAssetsController)
router.get('/get/:assetId', authenticateUser, getAssetByIdController)
router.patch('/edit/:assetId', authenticateUser, updateAssetController)
router.delete('/delete/:assetId', authenticateUser, deleteAssetController)

export default router