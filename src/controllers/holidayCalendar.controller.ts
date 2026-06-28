import { NextFunction, Request, Response } from 'express'
import { createInsertSchema } from 'drizzle-zod'
import { holidayCalendarModel } from '../schemas'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  createHolidayCalendar,
  deleteHolidayCalendar,
  editHolidayCalendar,
  getAllHolidayCalendars,
  getHolidayCalendarById,
  getHolidayCalendarWithHolidays,
} from '../services/holidayCalendar.service'

// Schema validation
const createHolidayCalendarSchema = createInsertSchema(
  holidayCalendarModel
).omit({
  id: true,
})

const editHolidayCalendarSchema = createHolidayCalendarSchema.partial()

export const createHolidayCalendarController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_holiday_calendar')

    const tenantId = req.user?.tenantId
    const data = {
      ...req.body,
      tenantId,
    }

    const calendarData = createHolidayCalendarSchema.parse(data)
    const calendar = await createHolidayCalendar(calendarData)

    res.status(201).json({
      status: 'success',
      data: calendar,
    })
  } catch (error) {
    next(error)
  }
}

export const getAllHolidayCalendarsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_holiday_calendar')

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const companyId = req.query.companyId
      ? Number(req.query.companyId)
      : undefined
    const year = req.query.year ? Number(req.query.year) : undefined

    const calendars = await getAllHolidayCalendars({ companyId, year, tenantId })

    res.status(200).json(calendars)
  } catch (error) {
    next(error)
  }
}

export const getHolidayCalendarController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_holiday_calendar')
    const id = Number(req.params.id)
    const calendar = await getHolidayCalendarById(id)

    res.status(200).json(calendar)
  } catch (error) {
    next(error)
  }
}

export const getHolidayCalendarWithHolidaysController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_holiday_calendar')
    const id = Number(req.params.id)
    const calendar = await getHolidayCalendarWithHolidays(id)

    res.status(200).json(calendar)
  } catch (error) {
    next(error)
  }
}

export const editHolidayCalendarController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_holiday_calendar')
    const id = Number(req.params.id)
    const calendarData = editHolidayCalendarSchema.parse(req.body)
    const calendar = await editHolidayCalendar(id, calendarData)

    res.status(200).json(calendar)
  } catch (error) {
    next(error)
  }
}

export const deleteHolidayCalendarController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_holiday_calendar')
    const id = Number(req.params.id)
    const result = await deleteHolidayCalendar(id)

    res.status(200).json({
      success: true,
      ...result,
    })
  } catch (error) {
    next(error)
  }
}



// import { NextFunction, Request, Response } from 'express'
// import { createInsertSchema } from 'drizzle-zod'
// import { holidayModel } from '../schemas'
// import { requirePermission } from '../services/utils/jwt.utils'
// import {
//   createHoliday,
//   deleteHoliday,
//   editHoliday,
//   getAllHolidays,
//   getHolidayById,
// } from '../services/holidays.service'

// // Schema validation
// const createHolidaySchema = createInsertSchema(holidayModel).omit({
//   holidayId: true,
// })

// const editHolidaySchema = createHolidaySchema.partial()

// export const createHolidayController = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     requirePermission(req, 'create_holiday')
//     const holidayData = createHolidaySchema.parse(req.body)
//     console.log("🚀 ~ createHolidayController ~ holidayData:", holidayData)
//     const holiday = await createHoliday(holidayData)

//     res.status(201).json({
//       status: 'success',
//       data: holiday,
//     })
//   } catch (error) {
//     next(error)
//   }
// }

// export const getAllHolidaysController = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     requirePermission(req, 'view_holiday')
//     const holidays = await getAllHolidays()

//     res.status(200).json(holidays)
//   } catch (error) {
//     next(error)
//   }
// }

// export const getHolidayController = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     requirePermission(req, 'view_holiday')
//     const id = Number(req.params.id)
//     const holiday = await getHolidayById(id)

//     res.status(200).json(holiday)
//   } catch (error) {
//     next(error)
//   }
// }

// export const editHolidayController = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     requirePermission(req, 'edit_holiday')
//     const id = Number(req.params.id)
//     const holidayData = editHolidaySchema.parse(req.body)
//     const holiday = await editHoliday(id, holidayData)

//     res.status(200).json(holiday)
//   } catch (error) {
//     next(error)
//   }
// }

// export const deleteHolidayController = async (req: Request, res: Response) => {
//   try {
//     requirePermission(req, 'delete_holiday')
//     const holidayId = Number(req.params.id);

//     const result = await deleteHoliday(holidayId);

//     res.status(200).json({
//       success: true,
//       ...result,
//     });
//   } catch (error: any) {
//     res.status(400).json({
//       success: false,
//       message: error.message || "Something went wrong",
//     });
//   }
// };
