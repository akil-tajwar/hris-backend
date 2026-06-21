// leave-policy.route.ts

import { Router } from 'express'
import {
  createLeavePolicyController,
  deleteLeavePolicyController,
  getAllLeavePoliciesController,
  updateLeavePolicyController,
} from '../controllers/leavePolicy.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createLeavePolicyController)
router.get('/getAll', authenticateUser, getAllLeavePoliciesController)
router.patch('/edit/:id', authenticateUser, updateLeavePolicyController)
router.delete('/delete/:id', authenticateUser, deleteLeavePolicyController)


export default router