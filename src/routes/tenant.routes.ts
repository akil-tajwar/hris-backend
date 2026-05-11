import { Router } from 'express'
import {
  createTenantController,
  getTenantsController,
  updateTenantController,
  deleteTenantController,
} from '../controllers/tenant.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createTenantController)
router.get('/getAll', authenticateUser, getTenantsController)
router.patch('/edit/:tenatId', authenticateUser, updateTenantController)
router.delete('/delete/:tenatId', authenticateUser, deleteTenantController)

export default router
