import { NextFunction, Request, Response } from 'express'
import { createInsertSchema } from 'drizzle-zod'
import { holidaysModel } from '../schemas'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  createHoliday,
  createHolidayRange,
  deleteHoliday,
  editHoliday,
  getAllHolidays,
  getHolidayById,
} from '../services/holidays.service'
import { z } from 'zod'

// Range schema
const createHolidayRangeSchema = z.object({
  calendarId: z.number(),
  title: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  type: z.string(),
  isRecurring: z.boolean().optional(),
  isOptional: z.boolean().optional(),
  description: z.string().optional(),
})

export const createHolidayRangeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_holiday')

    const tenantId = req.user?.tenantId
    const data = {
      ...req.body,
      tenantId,
    }

    const rangeData = createHolidayRangeSchema.parse(data)
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const result = await createHolidayRange({ ...rangeData, tenantId })

    res.status(201).json({
      status: 'success',
      ...result,
    })
  } catch (error) {
    next(error)
  }
}

// Schema validation
const createHolidaySchema = createInsertSchema(holidaysModel).omit({
  id: true,
})

const editHolidaySchema = createHolidaySchema.partial()

export const createHolidayController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_holiday')

    const tenantId = req.user?.tenantId
    const data = {
      ...req.body,
      tenantId,
    }

    const holidayData = createHolidaySchema.parse(data)
    const holiday = await createHoliday(holidayData)

    res.status(201).json({
      status: 'success',
      data: holiday,
    })
  } catch (error) {
    next(error)
  }
}

export const getAllHolidaysController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_holiday')

    const calendarId = req.query.calendarId
      ? Number(req.query.calendarId)
      : undefined
    const type = req.query.type ? String(req.query.type) : undefined
    const isOptional =
      req.query.isOptional !== undefined
        ? req.query.isOptional === 'true'
        : undefined
    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }
    const holidays = await getAllHolidays({ calendarId, type, isOptional, tenantId })

    res.status(200).json(holidays)
  } catch (error) {
    next(error)
  }
}

export const getHolidayController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_holiday')
    const id = Number(req.params.id)
    const holiday = await getHolidayById(id)

    res.status(200).json(holiday)
  } catch (error) {
    next(error)
  }
}

export const editHolidayController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_holiday')
    const id = Number(req.params.id)
    const holidayData = editHolidaySchema.parse(req.body)
    const holiday = await editHoliday(id, holidayData)

    res.status(200).json(holiday)
  } catch (error) {
    next(error)
  }
}

export const deleteHolidayController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_holiday')
    const id = Number(req.params.id)
    const result = await deleteHoliday(id)

    res.status(200).json({
      success: true,
      ...result,
    })
  } catch (error) {
    next(error)
  }
}