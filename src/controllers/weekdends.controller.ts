import { Request, Response, NextFunction } from 'express'
import { requirePermission } from "../services/utils/jwt.utils"
import { getWeekends } from "../services/weekends.service"

export const getWeekendsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_weekend')
    const weekends = await getWeekends()
    res.json(weekends)
  } catch (err) {
    next(err)
  }
}