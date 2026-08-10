import { NextFunction, Request, Response } from "express";
import { getAllRoles, updateRolePermissions, getAllPermission } from "../services/role.service";
import { requirePermission } from "../services/utils/jwt.utils";

// Get all roles
export const getAllRolesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, "view_roles");
    
    const roles = await getAllRoles();

    res.status(200).json(roles);
  } catch (error) {
    next(error);

  }
};

//update role permissions
export const updateRolePermissionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    requirePermission(req, "edit_roles");
    const { roleId } = req.params;
    const { permissions } = req.body;

    if (!roleId) {
      res.status(400).json({ message: "roleId is required" });
      return;
    }

    if (!Array.isArray(permissions)) {
      res.status(400).json({ message: "permissions must be an array of numbers" });
      return;
    }

    const tenantId = req.user?.tenantId
   
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const updatedRole = await updateRolePermissions(
      Number(roleId),
      tenantId,
      permissions,
    );

    res.status(200).json({
      message: "Permissions updated successfully",
      role: updatedRole,
    });
  } catch (error) {
    next(error);
  }
};

//get all permissions controller 
export const getAllPermissionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, "view_permissions");
    const roles = await getAllPermission();

    res.status(200).json(roles);
  } catch (error) {
    next(error);
  }
};


