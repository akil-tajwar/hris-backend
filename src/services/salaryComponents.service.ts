import { eq } from 'drizzle-orm'
import { db } from '../config/database'
import { salaryComponentsModel, NewSalaryComponent } from '../schemas'
import { BadRequestError } from './utils/errors.utils'

// Create
export const createSalaryComponent = async (
  salaryComponentData: Omit<
    NewSalaryComponent,
    'salaryComponentId' | 'updatedAt' | 'updatedBy'
  >
) => {
  try {
    const result = await db.insert(salaryComponentsModel).values({
      ...salaryComponentData,
      // createdAt: new Date().getTime(),
    })

    // Return the inserted data with the generated ID
    return {
      ...salaryComponentData,
      salaryComponentId: Number(result[0].insertId), // or result[0].insertId depending on your ORM
      createdAt: new Date().getTime(),
    }
  } catch (error) {
    throw error
  }
}

// Get All
export const getAllSalaryComponents = async (tenantId: number) => {
  return await db
    .select()
    .from(salaryComponentsModel)
    .where(eq(salaryComponentsModel.tenantId, tenantId))
}

// Get By Id
export const getSalaryComponentById = async (salaryComponentId: number) => {
  const salaryComponent = await db
    .select()
    .from(salaryComponentsModel)
    .where(eq(salaryComponentsModel.salaryComponentId, salaryComponentId))
    .limit(1)

  if (!salaryComponent.length) {
    throw BadRequestError('Cloth salaryComponent not found')
  }

  return salaryComponent[0]
}

// Update
export const editSalaryComponent = async (
  salaryComponentId: number,
  salaryComponentData: Partial<NewSalaryComponent>
) => {
  const [updatedSalaryComponent] = await db
    .update(salaryComponentsModel)
    .set(salaryComponentData)
    .where(eq(salaryComponentsModel.salaryComponentId, salaryComponentId))

  if (!updatedSalaryComponent) {
    throw BadRequestError('Cloth salaryComponent not found')
  }

  return updatedSalaryComponent
}

// Delete
export const deleteSalaryComponent = async (salaryComponentId: number) => {
  const result = await db
    .delete(salaryComponentsModel)
    .where(eq(salaryComponentsModel.salaryComponentId, salaryComponentId))
  return { message: 'Other salary component deleted successfully' }
}
