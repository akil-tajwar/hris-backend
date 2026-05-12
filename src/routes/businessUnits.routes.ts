import { Router } from 'express'
import {
  createBusinessUnitController,
  getBusinessUnitsController,
  updateBusinessUnitController,
  deleteBusinessUnitController,
} from '../controllers/businessUnits.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createBusinessUnitController)
router.get('/getAll', authenticateUser, getBusinessUnitsController)
router.patch('/edit/:businessUnitId', authenticateUser, updateBusinessUnitController)
router.delete('/delete/:businessUnitId', authenticateUser, deleteBusinessUnitController)

export default router
