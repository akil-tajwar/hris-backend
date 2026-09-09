import { and, asc, eq } from 'drizzle-orm'
import { db } from '../config/database'
import {
  companyModel,
  departmentModel,
  designationModel,
  employeeModel,
  employeeOfficeLocationModel,
  officeLocationsModel,
} from '../schemas'
import { AppError } from './utils/errors.utils'

/**
 * Get all employee office locations
 */
export const getAllEmployeeOfficeLocations = async (tenantId: number) => {
  return await db
    .select({
      employeeOfficeLocationId:
        employeeOfficeLocationModel.employeeOfficeLocationId,
      fromDate: employeeOfficeLocationModel.fromDate,
      toDate: employeeOfficeLocationModel.toDate,
      officeLocationId: employeeOfficeLocationModel.officeLocationId,
      employeeId: employeeOfficeLocationModel.employeeId,
      empFullName: employeeModel.empFullName,
      empCode: employeeModel.empCode,
      designationName: designationModel.designationName,
      departmentName: departmentModel.departmentName,
      companyName: companyModel.companyName,
      address: officeLocationsModel.address,
    })
    .from(employeeOfficeLocationModel)
    .leftJoin(
      employeeModel,
      eq(employeeOfficeLocationModel.employeeId, employeeModel.employeeId)
    )
    .leftJoin(
      designationModel,
      eq(employeeModel.designationId, designationModel.designationId)
    )
    .leftJoin(
      departmentModel,
      eq(employeeModel.departmentId, departmentModel.departmentId)
    )
    .leftJoin(companyModel, eq(employeeModel.companyId, companyModel.companyId))
    .leftJoin(
      officeLocationsModel,
      eq(
        employeeOfficeLocationModel.officeLocationId,
        officeLocationsModel.officeLocationId
      )
    )
    .where(eq(employeeOfficeLocationModel.tenantId, tenantId))
    .orderBy(
      asc(employeeOfficeLocationModel.fromDate),
      asc(employeeOfficeLocationModel.employeeOfficeLocationId)
    )
}

/**
 * Bulk create employee office locations
 */
export const createEmployeeOfficeLocations = async (
  tenantId: number,
  createdBy: number,
  data: {
    fromDate: string
    toDate?: string | null
    officeLocationId: number
    employeeId: number
  }[]
) => {
  if (!data.length) {
    throw new AppError('At least one employee office location is required', 400)
  }

  const insertData: (typeof employeeOfficeLocationModel.$inferInsert)[] =
    data.map((item) => ({
      fromDate: new Date(item.fromDate),
      toDate: item.toDate ? new Date(item.toDate) : null,
      officeLocationId: item.officeLocationId,
      employeeId: item.employeeId,
      tenantId,
      createdBy,
    }))

  return await db.insert(employeeOfficeLocationModel).values(insertData)
}

/**
 * Edit one employee office location
 */
export const updateEmployeeOfficeLocation = async (
  tenantId: number,
  updatedBy: number,
  employeeOfficeLocationId: number,
  data: {
    fromDate?: string
    toDate?: string | null
    officeLocationId?: number
    employeeId?: number
  }
) => {
  const existingRecord = await db
    .select({
      employeeOfficeLocationId:
        employeeOfficeLocationModel.employeeOfficeLocationId,
    })
    .from(employeeOfficeLocationModel)
    .where(
      and(
        eq(
          employeeOfficeLocationModel.employeeOfficeLocationId,
          employeeOfficeLocationId
        ),
        eq(employeeOfficeLocationModel.tenantId, tenantId)
      )
    )
    .limit(1)

  if (!existingRecord.length) {
    throw new AppError('Employee office location record not found', 404)
  }

  const { fromDate, toDate, ...updateData } = data

  await db
    .update(employeeOfficeLocationModel)
    .set({
      ...updateData,
      ...(fromDate !== undefined ? { fromDate: new Date(fromDate) } : {}),
      ...(toDate !== undefined
        ? { toDate: toDate ? new Date(toDate) : null }
        : {}),
      updatedBy,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(
          employeeOfficeLocationModel.employeeOfficeLocationId,
          employeeOfficeLocationId
        ),
        eq(employeeOfficeLocationModel.tenantId, tenantId)
      )
    )

  return await db
    .select()
    .from(employeeOfficeLocationModel)
    .where(
      and(
        eq(
          employeeOfficeLocationModel.employeeOfficeLocationId,
          employeeOfficeLocationId
        ),
        eq(employeeOfficeLocationModel.tenantId, tenantId)
      )
    )
    .limit(1)
}

/**
 * Delete one employee office location
 */
export const deleteEmployeeOfficeLocation = async (
  tenantId: number,
  employeeOfficeLocationId: number
) => {
  const existingRecord = await db
    .select({
      employeeOfficeLocationId:
        employeeOfficeLocationModel.employeeOfficeLocationId,
    })
    .from(employeeOfficeLocationModel)
    .where(
      and(
        eq(
          employeeOfficeLocationModel.employeeOfficeLocationId,
          employeeOfficeLocationId
        ),
        eq(employeeOfficeLocationModel.tenantId, tenantId)
      )
    )
    .limit(1)

  if (!existingRecord.length) {
    throw new AppError('Employee office location record not found', 404)
  }

  await db
    .delete(employeeOfficeLocationModel)
    .where(
      and(
        eq(
          employeeOfficeLocationModel.employeeOfficeLocationId,
          employeeOfficeLocationId
        ),
        eq(employeeOfficeLocationModel.tenantId, tenantId)
      )
    )

  return true
}
