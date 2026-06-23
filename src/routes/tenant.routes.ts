import { Router } from 'express'
import {
  createTenantController,
  getTenantsController,
  updateTenantController,
  deleteTenantController,
} from '../controllers/tenant.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', createTenantController)
router.get('/getAll', getTenantsController)
router.patch('/edit/:tenantId', updateTenantController)
router.delete('/delete/:tenantId', deleteTenantController)

export default router
