import { Request, Response, NextFunction } from 'express'
import { requirePermission } from "../services/utils/jwt.utils"
import { getRoles } from "../services/role.service"

export const getRolesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_role')
    const roles = await getRoles()
    res.json(roles)
  } catch (err) {
    next(err)
  }
}