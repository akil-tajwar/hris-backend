import { Router } from 'express'
import {
  createOfficeLocationController,
  getOfficeLocationsController,
  updateOfficeLocationController,
  deleteOfficeLocationController,
} from '../controllers/officeLocations.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createOfficeLocationController)
router.get('/getAll', authenticateUser, getOfficeLocationsController)
router.patch('/edit/:officeLocationId', authenticateUser, updateOfficeLocationController)
router.delete('/delete/:officeLocationId', authenticateUser, deleteOfficeLocationController)

export default router
