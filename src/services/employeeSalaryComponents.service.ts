import { eq, is } from 'drizzle-orm'
import { db } from '../config/database'
import {
  departmentModel,
  designationModel,
  employeeModel,
  employeeSalaryComponentsModel,
  NewEmployeeSalaryComponent,
  salaryComponentsModel,
} from '../schemas'
import { BadRequestError } from './utils/errors.utils'

// Create
export const createEmployeeSalaryComponent = async (
  data: Omit<
    NewEmployeeSalaryComponent,
    'employeeSalaryComponentId' | 'updatedAt' | 'updatedBy'
  >[]
) => {
  try {
    const now = new Date()

    const values = data.map((item) => ({
      ...item,
      createdAt: now,
    }))

    await db.insert(employeeSalaryComponentsModel).values(values)

    return {
      insertedCount: values.length,
      data: values,
    }
  } catch (error) {
    throw error
  }
}

// Update
export const editEmployeeSalaryComponent = async (
  employeeSalaryComponentId: number,
  employeeSalaryComponentData: Partial<NewEmployeeSalaryComponent>
) => {
  const [updatedEmployeeSalaryComponent] = await db
    .update(employeeSalaryComponentsModel)
    .set(employeeSalaryComponentData)
    .where(
      eq(
        employeeSalaryComponentsModel.employeeSalaryComponentId,
        employeeSalaryComponentId
      )
    )

  if (!updatedEmployeeSalaryComponent) {
    throw BadRequestError('Cloth employeeSalaryComponent not found')
  }

  return updatedEmployeeSalaryComponent
}

// Get All
export const getAllEmployeeSalaryComponents = async () => {
  return await db
    .select({
      employeeSalaryComponentId:
        employeeSalaryComponentsModel.employeeSalaryComponentId,

      // Employee fields
      employeeId: employeeModel.employeeId,
      employeeName: employeeModel.empFullName, // adjust column name
      empCode: employeeModel.empCode, // adjust column name
      employeeDepartmentName: departmentModel.departmentName, // adjust column name
      employeeDesignationName: designationModel.designationName, // adjust column name

      // Other salary component fields
      salaryComponentId: salaryComponentsModel.salaryComponentId,
      componentName: salaryComponentsModel.componentName, // adjust
      componentType: salaryComponentsModel.componentType, // adjust
      isAbsentFee: salaryComponentsModel.isAbsentFee, // adjust
      isLoneFee: salaryComponentsModel.isLoneFee, // adjust

      // Salary data
      salaryMonth: employeeSalaryComponentsModel.salaryMonth,
      salaryYear: employeeSalaryComponentsModel.salaryYear,
      amount: employeeSalaryComponentsModel.amount,
      isAuthorized: employeeSalaryComponentsModel.isAuthorized,

      isSkipped: employeeSalaryComponentsModel.isSkipped,
      employeeLoneId: employeeSalaryComponentsModel.employeeLoneId,
      createdAt: employeeSalaryComponentsModel.createdAt,
    })
    .from(employeeSalaryComponentsModel)
    .leftJoin(
      employeeModel,
      eq(
        employeeSalaryComponentsModel.employeeId,
        employeeModel.employeeId
      )
    )
    .leftJoin(
      salaryComponentsModel,
      eq(
        employeeSalaryComponentsModel.salaryComponentId,
        salaryComponentsModel.salaryComponentId
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
export const getEmployeeSalaryComponentById = async (
  employeeSalaryComponentId: number
) => {
  const employeeSalaryComponent = await db
    .select()
    .from(employeeSalaryComponentsModel)
    .where(
      eq(
        employeeSalaryComponentsModel.employeeSalaryComponentId,
        employeeSalaryComponentId
      )
    )
    .limit(1)

  if (!employeeSalaryComponent.length) {
    throw BadRequestError('Cloth employeeSalaryComponent not found')
  }

  return employeeSalaryComponent[0]
}

// Delete
export const deleteEmployeeSalaryComponent = async (
  employeeSalaryComponentId: number
) => {
  const result = await db
    .delete(employeeSalaryComponentsModel)
    .where(
      eq(
        employeeSalaryComponentsModel.employeeSalaryComponentId,
        employeeSalaryComponentId
      )
    )
  return { message: 'Fees Group deleted successfully' }
}
