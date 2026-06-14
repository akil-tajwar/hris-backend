import { eq, and } from 'drizzle-orm'
import { db } from '../config/database'
import {
  holidayCalendarModel,
  holidaysModel,
  NewHolidayCalendar,
} from '../schemas'
import { BadRequestError } from './utils/errors.utils'

// Create
export const createHolidayCalendar = async (
  calendarData: NewHolidayCalendar
) => {
  try {
    const result = await db.insert(holidayCalendarModel).values(calendarData)

    return {
      ...calendarData,
      id: Number(result[0].insertId),
    }
  } catch (error) {
    throw error
  }
}

// Get All (optionally filter by companyId / year)
export const getAllHolidayCalendars = async (filters?: {
  companyId?: number
  year?: number
}) => {
  const conditions = []

  if (filters?.companyId) {
    conditions.push(eq(holidayCalendarModel.companyId, filters.companyId))
  }

  if (filters?.year) {
    conditions.push(eq(holidayCalendarModel.year, filters.year))
  }

  if (conditions.length) {
    return await db
      .select()
      .from(holidayCalendarModel)
      .where(and(...conditions))
  }

  return await db.select().from(holidayCalendarModel)
}

// Get By Id
export const getHolidayCalendarById = async (id: number) => {
  const calendar = await db
    .select()
    .from(holidayCalendarModel)
    .where(eq(holidayCalendarModel.id, id))
    .limit(1)

  if (!calendar.length) {
    throw BadRequestError('Holiday calendar not found')
  }

  return calendar[0]
}

// Get calendar with its holidays
export const getHolidayCalendarWithHolidays = async (id: number) => {
  const calendar = await getHolidayCalendarById(id)

  const holidays = await db
    .select()
    .from(holidaysModel)
    .where(eq(holidaysModel.calendarId, id))

  return {
    ...calendar,
    holidays,
  }
}

// Update
export const editHolidayCalendar = async (
  id: number,
  calendarData: Partial<NewHolidayCalendar>
) => {
  const existing = await getHolidayCalendarById(id)

  await db
    .update(holidayCalendarModel)
    .set(calendarData)
    .where(eq(holidayCalendarModel.id, id))

  return { ...existing, ...calendarData }
}

// Delete (cascades to holidays via FK)
export const deleteHolidayCalendar = async (id: number) => {
  await getHolidayCalendarById(id)

  await db.delete(holidayCalendarModel).where(eq(holidayCalendarModel.id, id))

  return { message: 'Holiday calendar deleted successfully' }
}

