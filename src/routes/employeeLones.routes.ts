import { Router } from 'express'
import {
  createLoneController,
  getLonesController,
  updateLoneController,
  deleteLoneController,
  skipLoneInstallmentController,
  makeEmployeeLoneFullPaidController,
} from '../controllers/employeeLones.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createLoneController)
router.post(
  '/skipLone/:employeeLoneInstallmentId/:updatedBy',
  authenticateUser,
  skipLoneInstallmentController
)
router.get('/getAll', authenticateUser, getLonesController)
router.patch('/edit/:employeeLoneId', authenticateUser, updateLoneController)
router.patch(
  '/make-full-paid/:employeeLoneId',
  authenticateUser,
  makeEmployeeLoneFullPaidController
)
router.delete('/delete/:employeeLoneId', authenticateUser, deleteLoneController)

export default router
