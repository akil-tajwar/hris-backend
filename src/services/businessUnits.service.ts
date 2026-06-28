import { db } from '../config/database'
import { businessUnitsModel, companyModel, departmentModel, designationModel, employeeModel, NewBusinessUnit } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createBusinessUnit = async (data: NewBusinessUnit) => {
  await db.insert(businessUnitsModel).values(data)

  const [businessUnit] = await db
    .select()
    .from(businessUnitsModel)
    .orderBy(businessUnitsModel.businessUnitId)
    .limit(1)

  return businessUnit
}

// READ ALL
export const getBusinessUnits = async (tenantId: number) => {
  return await db
    .select({
      // Business Unit fields
      businessUnitId: businessUnitsModel.businessUnitId,
      companyId: businessUnitsModel.companyId,
      unitName: businessUnitsModel.unitName,
      unitCode: businessUnitsModel.unitCode,
      description: businessUnitsModel.description,
      headEmployeeId: businessUnitsModel.headEmployeeId,
      status: businessUnitsModel.status,
      createdBy: businessUnitsModel.createdBy,
      createdAt: businessUnitsModel.createdAt,
      updatedBy: businessUnitsModel.updatedBy,
      updatedAt: businessUnitsModel.updatedAt,
      companyName: companyModel.companyName,
      empCode: employeeModel.empCode,
      empFullName: employeeModel.empFullName,
      departmentName: departmentModel.departmentName,
      designationName: designationModel.designationName,
    })
    .from(businessUnitsModel)
    .leftJoin(companyModel, eq(businessUnitsModel.companyId, companyModel.companyId))
    .leftJoin(employeeModel, eq(businessUnitsModel.headEmployeeId, employeeModel.employeeId))
    .leftJoin(departmentModel, eq(employeeModel.departmentId, departmentModel.departmentId))
    .leftJoin(designationModel, eq(employeeModel.designationId, designationModel.designationId))
    .where(eq(businessUnitsModel.tenantId, tenantId));
};

// UPDATEassetTransactionsModel
export const updateBusinessUnit = async (
  data: { businessUnitId: number } & { businessUnitName: string; updatedBy: number }
) => {
  await db
    .update(businessUnitsModel)
    .set(data)
    .where(eq(businessUnitsModel.businessUnitId, data.businessUnitId))

  const [updated] = await db
    .select()
    .from(businessUnitsModel)
    .where(eq(businessUnitsModel.businessUnitId, data.businessUnitId))

  return updated
}

// DELETE
export const deleteBusinessUnit = async (businessUnitId: number) => {
  await db
    .delete(businessUnitsModel)
    .where(eq(businessUnitsModel.businessUnitId, businessUnitId))
}
