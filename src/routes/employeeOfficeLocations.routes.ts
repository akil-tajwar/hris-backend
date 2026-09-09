import { Router } from 'express'

import {
  getAllEmployeeOfficeLocationsController,
  createEmployeeOfficeLocationsController,
  updateEmployeeOfficeLocationController,
  deleteEmployeeOfficeLocationController,
} from '../controllers/employeeOfficeLocations.controller'

import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticateUser)

router.get(
  '/getAll',
  getAllEmployeeOfficeLocationsController
)

router.post(
  '/create',
  createEmployeeOfficeLocationsController
)

router.patch(
  '/edit/:employeeOfficeLocationId',
  updateEmployeeOfficeLocationController
)

router.delete(
  '/delete/:employeeOfficeLocationId',
  deleteEmployeeOfficeLocationController
)

export default router