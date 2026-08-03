import { NextFunction, Request, Response } from "express";
import { getAllRoles, updateRolePermissions, getAllPermission } from "../services/role.service";
import { requirePermission } from "../services/utils/jwt.utils";
// import { z } from "zod";

// const createRoleSchema = z.object({
//     roleName: z.string().min(1, "Role name is required"),
//     permissions: z.array(z.string()).optional(),
//     description: z.string().optional(),
// });

// // Create role
// export const createRoleController = async (
//     req: Request,
//     res: Response,
//     next: NextFunction
// ) => {
//     try {
//         const roleData = createRoleSchema.parse(req.body);
//         const role = await createRole(roleData);

//         res.status(201).json({
//             status: "success",
//             data: {
//                 role,
//             },
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// Get all roles
export const getAllRolesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // requirePermission(req, "view_roles");
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
    // requirePermission(req, "edit_roles");
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

    const updatedRole = await updateRolePermissions(
      Number(roleId),
      permissions
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
    // requirePermission(req, "view_permissions");
    const roles = await getAllPermission();

    res.status(200).json(roles);
  } catch (error) {
    next(error);
  }
};


