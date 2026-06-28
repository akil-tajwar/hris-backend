import { db } from '../config/database'
import { costCenterModel, departmentModel, designationModel, divisionModel, employeeModel, NewDepartment } from '../schemas'
import { aliasedTable, eq } from 'drizzle-orm'

// CREATE
export const createDepartment = async (data: NewDepartment) => {
  await db.insert(departmentModel).values(data)

  const [department] = await db
    .select()
    .from(departmentModel)
    .orderBy(departmentModel.departmentId)
    .limit(1)

  return department
}

// READ ALL
const parentDepartment = aliasedTable(
  departmentModel,
  'parentDepartment'
)

const employeeDepartment = aliasedTable(
  departmentModel,
  'employeeDepartment'
)

export const getDepartments = async (tenantId: number) => {
  return await db
    .select({
      // Department fields
      departmentId: departmentModel.departmentId,
      departmentName: departmentModel.departmentName,
      departmentCode: departmentModel.departmentCode,
      divisionId: departmentModel.divisionId,
      parentDepartmentId: departmentModel.parentDepartmentId,
      costCenterId: departmentModel.costCenterId,
      headEmployeeId: departmentModel.headEmployeeId,
      status: departmentModel.status,
      createdBy: departmentModel.createdBy,
      createdAt: departmentModel.createdAt,
      updatedBy: departmentModel.updatedBy,
      updatedAt: departmentModel.updatedAt,

      // Division
      divisionName: divisionModel.divisionName,

      // Parent Department
      parentDepartmentName: parentDepartment.departmentName,

      // Cost Center
      costCenterName: costCenterModel.costCenterName,

      // Head Employee
      empCode: employeeModel.empCode,
      empFullName: employeeModel.empFullName,

      // Employee Department
      employeeDepartmentName: employeeDepartment.departmentName,

      // Employee Designation
      designationName: designationModel.designationName,
    })
    .from(departmentModel)
    .where(eq(departmentModel.tenantId, tenantId))
    .leftJoin(
      divisionModel,
      eq(departmentModel.divisionId, divisionModel.divisionId)
    )
    .leftJoin(
      parentDepartment,
      eq(
        departmentModel.parentDepartmentId,
        parentDepartment.departmentId
      )
    )
    .leftJoin(
      costCenterModel,
      eq(departmentModel.costCenterId, costCenterModel.costCenterId)
    )
    .leftJoin(
      employeeModel,
      eq(departmentModel.headEmployeeId, employeeModel.employeeId)
    )
    .leftJoin(
      employeeDepartment,
      eq(
        employeeModel.departmentId,
        employeeDepartment.departmentId
      )
    )
    .leftJoin(
      designationModel,
      eq(employeeModel.designationId, designationModel.designationId)
    )
}

// UPDATE
export const updateDepartment = async (
  data: { departmentId: number } & { departmentName: string; updatedBy: number }
) => {
  await db
    .update(departmentModel)
    .set(data)
    .where(eq(departmentModel.departmentId, data.departmentId))

  const [updated] = await db
    .select()
    .from(departmentModel)
    .where(eq(departmentModel.departmentId, data.departmentId))

  return updated
}

// DELETE
export const deleteDepartment = async (departmentId: number) => {
  await db
    .delete(departmentModel)
    .where(eq(departmentModel.departmentId, departmentId))
}
