  import { eq, and } from 'drizzle-orm'
  import { db } from '../config/database'
  import { holidaysModel, holidayCalendarModel, NewHoliday } from '../schemas'
  import { BadRequestError } from './utils/errors.utils'

  // Create (single)
  export const createHoliday = async (holidayData: NewHoliday) => {
    try {
      // ensure calendar exists
      const calendar = await db
        .select()
        .from(holidayCalendarModel)
        .where(eq(holidayCalendarModel.id, holidayData.calendarId))
        .limit(1)

      if (!calendar.length) {
        throw BadRequestError('Holiday calendar not found')
      }

      const result = await db.insert(holidaysModel).values(holidayData)

      return {
        ...holidayData,
        id: Number(result[0].insertId),
      }
    } catch (error) {
      throw error
    }
  }

  // Create (date range -> multiple rows, e.g. Eid 7 days)
  export const createHolidayRange = async (rangeData: {
    calendarId: number
    title: string
    startDate: string // 'YYYY-MM-DD'
    endDate: string // 'YYYY-MM-DD'
    type: string
    isRecurring?: boolean
    isOptional?: boolean
    description?: string
  }) => {
    const {
      calendarId,
      title,
      startDate,
      endDate,
      type,
      isRecurring = false,
      isOptional = false,
      description,
    } = rangeData

    // ensure calendar exists
    const calendar = await db
      .select()
      .from(holidayCalendarModel)
      .where(eq(holidayCalendarModel.id, calendarId))
      .limit(1)

    if (!calendar.length) {
      throw BadRequestError('Holiday calendar not found')
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw BadRequestError('Invalid startDate or endDate')
    }

    if (start > end) {
      throw BadRequestError('startDate must be before or equal to endDate')
    }

    const rows: NewHoliday[] = []
    const current = new Date(start)
    let dayIndex = 1

    // total number of days in the range
    const totalDays =
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const isSingleDay = totalDays === 1

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0] // 'YYYY-MM-DD'

      rows.push({
        calendarId,
        title: isSingleDay ? title : `${title} - Day ${dayIndex}`,
        date: dateStr,
        type,
        isRecurring,
        isOptional,
        description,
      })

      current.setDate(current.getDate() + 1)
      dayIndex++
    }

    if (!rows.length) {
      throw BadRequestError('No dates to insert')
    }

    await db.insert(holidaysModel).values(rows)

    return {
      message: `${rows.length} holiday(s) created successfully`,
      holidays: rows,
    }
  }

  // Get All (optionally filter by calendarId / type / isOptional)
  export const getAllHolidays = async (filters?: {
    calendarId?: number
    type?: string
    isOptional?: boolean
  }) => {
    const conditions = []

    if (filters?.calendarId) {
      conditions.push(eq(holidaysModel.calendarId, filters.calendarId))
    }

    if (filters?.type) {
      conditions.push(eq(holidaysModel.type, filters.type))
    }

    if (filters?.isOptional !== undefined) {
      conditions.push(eq(holidaysModel.isOptional, filters.isOptional))
    }

    if (conditions.length) {
      return await db
        .select()
        .from(holidaysModel)
        .where(and(...conditions))
    }

    return await db.select().from(holidaysModel)
  }

  // Get By Id
  export const getHolidayById = async (id: number) => {
    const holiday = await db
      .select()
      .from(holidaysModel)
      .where(eq(holidaysModel.id, id))
      .limit(1)

    if (!holiday.length) {
      throw BadRequestError('Holiday not found')
    }

    return holiday[0]
  }

  // Update
  export const editHoliday = async (id: number, holidayData: Partial<NewHoliday>) => {
    const existing = await getHolidayById(id)

    if (holidayData.calendarId) {
      const calendar = await db
        .select()
        .from(holidayCalendarModel)
        .where(eq(holidayCalendarModel.id, holidayData.calendarId))
        .limit(1)

      if (!calendar.length) {
        throw BadRequestError('Holiday calendar not found')
      }
    }

    await db.update(holidaysModel).set(holidayData).where(eq(holidaysModel.id, id))

    return { ...existing, ...holidayData }
  }

  // Delete
  export const deleteHoliday = async (id: number) => {
    await getHolidayById(id)

    await db.delete(holidaysModel).where(eq(holidaysModel.id, id))

    return { message: 'Holiday deleted successfully' }
  }

