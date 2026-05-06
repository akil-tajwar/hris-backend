import { eq, is } from 'drizzle-orm'
import { db } from '../config/database'
import {
  departmentModel,
  designationModel,
  employeeModel,
  employeeOtherSalaryComponentsModel,
  NewEmployeeOtherSalaryComponent,
  otherSalaryComponentsModel,
} from '../schemas'
import { BadRequestError } from './utils/errors.utils'

// Create
export const createEmployeeOtherSalaryComponent = async (
  data: Omit<
    NewEmployeeOtherSalaryComponent,
    'employeeOtherSalaryComponentId' | 'updatedAt' | 'updatedBy'
  >[]
) => {
  try {
    const now = new Date()

    const values = data.map((item) => ({
      ...item,
      createdAt: now,
    }))

    await db.insert(employeeOtherSalaryComponentsModel).values(values)

    return {
      insertedCount: values.length,
      data: values,
    }
  } catch (error) {
    throw error
  }
}

// Update
export const editEmployeeOtherSalaryComponent = async (
  employeeOtherSalaryComponentId: number,
  employeeOtherSalaryComponentData: Partial<NewEmployeeOtherSalaryComponent>
) => {
  const [updatedEmployeeOtherSalaryComponent] = await db
    .update(employeeOtherSalaryComponentsModel)
    .set(employeeOtherSalaryComponentData)
    .where(
      eq(
        employeeOtherSalaryComponentsModel.employeeOtherSalaryComponentId,
        employeeOtherSalaryComponentId
      )
    )

  if (!updatedEmployeeOtherSalaryComponent) {
    throw BadRequestError('Cloth employeeOtherSalaryComponent not found')
  }

  return updatedEmployeeOtherSalaryComponent
}

// Get All
export const getAllEmployeeOtherSalaryComponents = async () => {
  return await db
    .select({
      employeeOtherSalaryComponentId:
        employeeOtherSalaryComponentsModel.employeeOtherSalaryComponentId,

      // Employee fields
      employeeId: employeeModel.employeeId,
      employeeName: employeeModel.empFullName, // adjust column name
      empCode: employeeModel.empCode, // adjust column name
      employeeDepartmentName: departmentModel.departmentName, // adjust column name
      employeeDesignationName: designationModel.designationName, // adjust column name

      // Other salary component fields
      otherSalaryComponentId: otherSalaryComponentsModel.otherSalaryComponentId,
      componentName: otherSalaryComponentsModel.componentName, // adjust
      componentType: otherSalaryComponentsModel.componentType, // adjust
      isAbsentFee: otherSalaryComponentsModel.isAbsentFee, // adjust
      isLoneFee: otherSalaryComponentsModel.isLoneFee, // adjust

      // Salary data
      salaryMonth: employeeOtherSalaryComponentsModel.salaryMonth,
      salaryYear: employeeOtherSalaryComponentsModel.salaryYear,
      amount: employeeOtherSalaryComponentsModel.amount,
      isAuthorized: employeeOtherSalaryComponentsModel.isAuthorized,

      isSkipped: employeeOtherSalaryComponentsModel.isSkipped,
      employeeLoneId: employeeOtherSalaryComponentsModel.employeeLoneId,
      createdAt: employeeOtherSalaryComponentsModel.createdAt,
    })
    .from(employeeOtherSalaryComponentsModel)
    .leftJoin(
      employeeModel,
      eq(
        employeeOtherSalaryComponentsModel.employeeId,
        employeeModel.employeeId
      )
    )
    .leftJoin(
      otherSalaryComponentsModel,
      eq(
        employeeOtherSalaryComponentsModel.otherSalaryComponentId,
        otherSalaryComponentsModel.otherSalaryComponentId
      )
    )
    .leftJoin(
      departmentModel,
      eq(employeeModel.departmentId, departmentModel.departmentId)
    )
    .leftJoin(
      designationModel,
      eq(employeeModel.designationId, designationModel.designationId)
    )
}

// Get By Id
export const getEmployeeOtherSalaryComponentById = async (
  employeeOtherSalaryComponentId: number
) => {
  const employeeOtherSalaryComponent = await db
    .select()
    .from(employeeOtherSalaryComponentsModel)
    .where(
      eq(
        employeeOtherSalaryComponentsModel.employeeOtherSalaryComponentId,
        employeeOtherSalaryComponentId
      )
    )
    .limit(1)

  if (!employeeOtherSalaryComponent.length) {
    throw BadRequestError('Cloth employeeOtherSalaryComponent not found')
  }

  return employeeOtherSalaryComponent[0]
}

// Delete
export const deleteEmployeeOtherSalaryComponent = async (
  employeeOtherSalaryComponentId: number
) => {
  const result = await db
    .delete(employeeOtherSalaryComponentsModel)
    .where(
      eq(
        employeeOtherSalaryComponentsModel.employeeOtherSalaryComponentId,
        employeeOtherSalaryComponentId
      )
    )
  return { message: 'Fees Group deleted successfully' }
}
