import express from 'express';
import { getAllRolesController, updateRolePermissionsController, getAllPermissionController } from '../controllers/role.controller';

const router = express.Router();

// router.get('/:roleId', getRole);
router.get('/get-all-roles', getAllRolesController);
router.get('/get-all-permissions', getAllPermissionController);
router.put(
    "/update-role-permissions/:roleId",
    updateRolePermissionsController
);

export default router;
