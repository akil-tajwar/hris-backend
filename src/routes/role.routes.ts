import express from 'express'
import {
  getAllRolesController,
  updateRolePermissionsController,
  getAllPermissionController,
} from '../controllers/role.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = express.Router()

// router.get('/:roleId', getRole);
router.get('/get-all-roles', authenticateUser, getAllRolesController)
router.get('/get-all-permissions', authenticateUser, getAllPermissionController)
router.put(
  '/update-role-permissions/:roleId',
  authenticateUser,
  updateRolePermissionsController
)

export default router
