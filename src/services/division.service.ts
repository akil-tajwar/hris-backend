import { db } from '../config/database'
import {
  businessUnitsModel,
  departmentModel,
  designationModel,
  Division,
  divisionModel,
  employeeModel,
  NewDivision,
} from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createDivision = async (data: NewDivision) => {
  await db.insert(divisionModel).values(data)

  const [division] = await db
    .select()
    .from(divisionModel)
    .orderBy(divisionModel.divisionId)
    .limit(1)

  return division
}

// READ ALL
export const getDivisions = async (tenantId: number) => {
  return await db
    .select({
      // Division fields
      divisionId: divisionModel.divisionId,
      divisionName: divisionModel.divisionName,
      divisionCode: divisionModel.divisionCode,
      description: divisionModel.description,
      businessUnitId: divisionModel.businessUnitId,
      headEmployeeId: divisionModel.headEmployeeId,
      status: divisionModel.status,
      createdBy: divisionModel.createdBy,
      createdAt: divisionModel.createdAt,
      updatedBy: divisionModel.updatedBy,
      updatedAt: divisionModel.updatedAt,

      // Business Unit
      unitName: businessUnitsModel.unitName,
      unitCode: businessUnitsModel.unitCode,

      // Head Employee
      empCode: employeeModel.empCode,
      empFullName: employeeModel.empFullName,

      // Employee Department
      departmentName: departmentModel.departmentName,

      // Employee Designation
      designationName: designationModel.designationName,
    })
    .from(divisionModel)
    .where(eq(divisionModel.tenantId, tenantId))
    .leftJoin(
      businessUnitsModel,
      eq(divisionModel.businessUnitId, businessUnitsModel.businessUnitId)
    )
    .leftJoin(
      employeeModel,
      eq(divisionModel.headEmployeeId, employeeModel.employeeId)
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

// READ ONE
export const getDivisionById = async (divisionId: number) => {
  const [division] = await db
    .select()
    .from(divisionModel)
    .where(eq(divisionModel.divisionId, divisionId))

  return division
}

// UPDATE
export const updateDivision = async (
  data: Division & { divisionId: number }
) => {
  await db
    .update(divisionModel)
    .set(data)
    .where(eq(divisionModel.divisionId, data.divisionId))

  const [updated] = await db
    .select()
    .from(divisionModel)
    .where(eq(divisionModel.divisionId, data.divisionId))

  return updated
}

// DELETE
export const deleteDivision = async (divisionId: number) => {
  await db.delete(divisionModel).where(eq(divisionModel.divisionId, divisionId))
}
