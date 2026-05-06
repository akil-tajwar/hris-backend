import { Router } from 'express'
import {
  createCostCenterController,
  getCostCentersController,
  getCostCenterByIdController,
  updateCostCenterController,
  deleteCostCenterController,
} from '../controllers/costCenter.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createCostCenterController)
router.get('/getAll', authenticateUser, getCostCentersController)
router.get('/get/:costCenterId', authenticateUser, getCostCenterByIdController)
router.patch('/edit/:costCenterId', authenticateUser, updateCostCenterController)
router.delete('/delete/:costCenterId', authenticateUser, deleteCostCenterController)

export default router