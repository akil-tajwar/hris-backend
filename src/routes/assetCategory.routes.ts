import { Router } from 'express'
import {
  createAssetCategoryController,
  getAssetCategorysController,
  updateAssetCategoryController,
  deleteAssetCategoryController,
} from '../controllers/assetCategory.Controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createAssetCategoryController)
router.get('/getAll', authenticateUser, getAssetCategorysController)
router.patch('/edit/:assetCategoryId', authenticateUser, updateAssetCategoryController)
router.delete('/delete/:assetCategoryId', authenticateUser, deleteAssetCategoryController)

export default router
