import { eq } from 'drizzle-orm'
import { db } from '../config/database'
import { otherSalaryComponentsModel, NewOtherSalaryComponent } from '../schemas'
import { BadRequestError } from './utils/errors.utils'

// Create
export const createOtherSalaryComponent = async (
  otherSalaryComponentData: Omit<
    NewOtherSalaryComponent,
    'otherSalaryComponentId' | 'updatedAt' | 'updatedBy'
  >
) => {
  try {
    const result = await db.insert(otherSalaryComponentsModel).values({
      ...otherSalaryComponentData,
      // createdAt: new Date().getTime(),
    })

    // Return the inserted data with the generated ID
    return {
      ...otherSalaryComponentData,
      otherSalaryComponentId: Number(result[0].insertId), // or result[0].insertId depending on your ORM
      createdAt: new Date().getTime(),
    }
  } catch (error) {
    throw error
  }
}

// Get All
export const getAllOtherSalaryComponents = async () => {
  return await db.select().from(otherSalaryComponentsModel)
}

// Get By Id
export const getOtherSalaryComponentById = async (
  otherSalaryComponentId: number
) => {
  const otherSalaryComponent = await db
    .select()
    .from(otherSalaryComponentsModel)
    .where(
      eq(
        otherSalaryComponentsModel.otherSalaryComponentId,
        otherSalaryComponentId
      )
    )
    .limit(1)

  if (!otherSalaryComponent.length) {
    throw BadRequestError('Cloth otherSalaryComponent not found')
  }

  return otherSalaryComponent[0]
}

// Update
export const editOtherSalaryComponent = async (
  otherSalaryComponentId: number,
  otherSalaryComponentData: Partial<NewOtherSalaryComponent>
) => {
  const [updatedOtherSalaryComponent] = await db
    .update(otherSalaryComponentsModel)
    .set(otherSalaryComponentData)
    .where(
      eq(
        otherSalaryComponentsModel.otherSalaryComponentId,
        otherSalaryComponentId
      )
    )

  if (!updatedOtherSalaryComponent) {
    throw BadRequestError('Cloth otherSalaryComponent not found')
  }

  return updatedOtherSalaryComponent
}

// Delete
export const deleteOtherSalaryComponent = async (
  otherSalaryComponentId: number
) => {
  const result = await db
    .delete(otherSalaryComponentsModel)
    .where(
      eq(
        otherSalaryComponentsModel.otherSalaryComponentId,
        otherSalaryComponentId
      )
    )
  return { message: 'Other salary component deleted successfully' }
}
