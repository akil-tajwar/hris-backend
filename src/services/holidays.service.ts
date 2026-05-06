import { eq } from 'drizzle-orm'
import { db } from '../config/database'
import { holidayModel, NewHoliday } from '../schemas'
import { BadRequestError } from './utils/errors.utils'

// Create
export const createHoliday = async (
  holidayData: Omit<NewHoliday, 'holidayId' | 'updatedAt' | 'updatedBy'>
) => {
  try {
    const result = await db
      .insert(holidayModel)
      .values({
        ...holidayData,
        // createdAt: new Date().getTime(),
      })

    // Return the inserted data with the generated ID
    return {
      ...holidayData,
      holidayId: Number(result[0].insertId), // or result[0].insertId depending on your ORM
      createdAt: new Date().getTime(),
    }
  } catch (error) {
    throw error
  }
}

// Get All
export const getAllHolidays = async () => {
  return await db.select().from(holidayModel)
}

// Get By Id
export const getHolidayById = async (holidayId: number) => {
  const holiday = await db
    .select()
    .from(holidayModel)
    .where(eq(holidayModel.holidayId, holidayId))
    .limit(1)

  if (!holiday.length) {
    throw BadRequestError('Cloth holiday not found')
  }

  return holiday[0]
}

// Update
export const editHoliday = async (
  holidayId: number,
  holidayData: Partial<NewHoliday>
) => {
  const [updatedHoliday] = await db
    .update(holidayModel)
    .set(holidayData)
    .where(eq(holidayModel.holidayId, holidayId))

  if (!updatedHoliday) {
    throw BadRequestError('Cloth holiday not found')
  }

  return updatedHoliday
}

// Delete
export const deleteHoliday = async (holidayId: number) => {
  const result = await db
    .delete(holidayModel)
    .where(eq(holidayModel.holidayId, holidayId));
  return { message: "Fees Group deleted successfully" };
};
