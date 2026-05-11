import { Router } from 'express'
import {
  createCustomerController,
  getCustomersController,
  updateCustomerController,
  deleteCustomerController,
  activateCustomerController,
} from '../controllers/customer.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createCustomerController)
router.get('/getAll', authenticateUser, getCustomersController)
router.patch('/edit/:customerId', authenticateUser, updateCustomerController)
router.patch('/activate-customer/:customerId', authenticateUser, activateCustomerController)
router.delete('/delete/:customerId', authenticateUser, deleteCustomerController)

export default router
