import { Router } from 'express'
import { getRolesController } from '../controllers/role.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.get('/getAll', authenticateUser, getRolesController)

export default router
