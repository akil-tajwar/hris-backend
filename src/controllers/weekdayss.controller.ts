import { Request, Response, NextFunction } from 'express'
import { requirePermission } from "../services/utils/jwt.utils"
import { getWeekDays } from "../services/weekDays.service"

export const getWeekDaysController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_week_day')
    const weekDays = await getWeekDays()
    res.json(weekDays)
  } catch (err) {
    next(err)
  }
}