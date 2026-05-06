import { NextFunction, Request, Response } from 'express'
import { createInsertSchema } from 'drizzle-zod'
import { holidayModel } from '../schemas'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  createHoliday,
  deleteHoliday,
  editHoliday,
  getAllHolidays,
  getHolidayById,
} from '../services/holidays.service'

// Schema validation
const createHolidaySchema = createInsertSchema(holidayModel).omit({
  holidayId: true,
})

const editHolidaySchema = createHolidaySchema.partial()

export const createHolidayController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_holiday')
    const holidayData = createHolidaySchema.parse(req.body)
    console.log("🚀 ~ createHolidayController ~ holidayData:", holidayData)
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
    const holidays = await getAllHolidays()

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

export const deleteHolidayController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'delete_holiday')
    const holidayId = Number(req.params.id);

    const result = await deleteHoliday(holidayId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
