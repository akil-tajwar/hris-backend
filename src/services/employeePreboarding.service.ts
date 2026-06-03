import { db } from '../config/database'
import {
  employeePreboardingModel,
  departmentModel,
  designationModel,
  employeeModel,
  employmentTypeModel,
  salaryStructureMasterModel,
  companyModel,
  employeePreboardingChecklistModel,
  NewEmployeePreboardingChecklist,
} from '../schemas'

import { aliasedTable, desc, eq } from 'drizzle-orm'

// Alias for reporting authority (employee)
const reportingEmployee = aliasedTable(employeeModel, 'reportingEmployee')

// CREATE
export const createEmployeePreboarding = async (data: any) => {
  // Get latest preboarding record
  const [lastRecord] = await db
    .select({
      preboardNo: employeePreboardingModel.preboardNo,
    })
    .from(employeePreboardingModel)
    .orderBy(desc(employeePreboardingModel.preboardingId))
    .limit(1)

  let nextNumber = 1

  if (lastRecord?.preboardNo) {
    // Extract numeric part from PRE-00001
    const lastNumber = parseInt(lastRecord.preboardNo.split('-')[1])

    nextNumber = lastNumber + 1
  }

  // Generate PRE-00001 format
  const preboardNo = `PRE-${String(nextNumber).padStart(5, '0')}`

  // Insert data
  await db.insert(employeePreboardingModel).values({
    ...data,
    preboardNo,
  })

  // Return newly created record
  const [created] = await db
    .select()
    .from(employeePreboardingModel)
    .where(eq(employeePreboardingModel.preboardNo, preboardNo))

  return created
}

// READ ALL
export const getEmployeePreboarding = async () => {
  return await db
    .select({
      // Preboarding
      preboardingId: employeePreboardingModel.preboardingId,
      preboardNo: employeePreboardingModel.preboardNo,
      fullName: employeePreboardingModel.fullName,
      gender: employeePreboardingModel.gender,
      dob: employeePreboardingModel.dob,
      personalEmail: employeePreboardingModel.personalEmail,
      personalPhone: employeePreboardingModel.personalPhone,
      tentativeJoiningDate: employeePreboardingModel.tentativeJoiningDate,
      offeredSalary: employeePreboardingModel.offeredSalary,
      probationMonths: employeePreboardingModel.probationMonths,
      status: employeePreboardingModel.status,
      createdBy: employeePreboardingModel.createdBy,
      createdAt: employeePreboardingModel.createdAt,
      updatedBy: employeePreboardingModel.updatedBy,
      updatedAt: employeePreboardingModel.updatedAt,

      // Company
      companyId: employeePreboardingModel.companyId,
      companyName: companyModel.companyName,

      // Department
      departmentId: employeePreboardingModel.departmentId,
      departmentName: departmentModel.departmentName,

      // Designation
      designationId: employeePreboardingModel.designationId,
      designationName: designationModel.designationName,

      // Employment Type
      employmentTypeId: employeePreboardingModel.employmentTypeId,
      employmentTypeName: employmentTypeModel.employmentTypeName,

      // Salary Structure
      salaryStructureMasterId: employeePreboardingModel.salaryStructureMasterId,
      salaryStructureName: salaryStructureMasterModel.structureName,

      // Reporting Authority (Employee)
      reportingAuthorityId: employeePreboardingModel.reportingAuthorityId,
      reportingEmpCode: reportingEmployee.empCode,
      reportingEmpFullName: reportingEmployee.empFullName,
    })
    .from(employeePreboardingModel)
    .leftJoin(
      companyModel,
      eq(employeePreboardingModel.companyId, companyModel.companyId)
    )
    .leftJoin(
      departmentModel,
      eq(employeePreboardingModel.departmentId, departmentModel.departmentId)
    )
    .leftJoin(
      designationModel,
      eq(employeePreboardingModel.designationId, designationModel.designationId)
    )
    .leftJoin(
      employmentTypeModel,
      eq(
        employeePreboardingModel.employmentTypeId,
        employmentTypeModel.employmentTypeId
      )
    )
    .leftJoin(
      salaryStructureMasterModel,
      eq(
        employeePreboardingModel.salaryStructureMasterId,
        salaryStructureMasterModel.salaryStructureMasterId
      )
    )
    .leftJoin(
      reportingEmployee,
      eq(
        employeePreboardingModel.reportingAuthorityId,
        reportingEmployee.employeeId
      )
    )
}

// UPDATE
export const updateEmployeePreboarding = async (
  data: { preboardingId: number } & any
) => {
  await db
    .update(employeePreboardingModel)
    .set(data)
    .where(eq(employeePreboardingModel.preboardingId, data.preboardingId))

  const [updated] = await db
    .select()
    .from(employeePreboardingModel)
    .where(eq(employeePreboardingModel.preboardingId, data.preboardingId))

  return updated
}

// DELETE
export const deleteEmployeePreboarding = async (id: number) => {
  await db
    .delete(employeePreboardingModel)
    .where(eq(employeePreboardingModel.preboardingId, id))
}

// assign checklist to preboarding employee
export const assignChecklistToPreboardingService = async (
  data: NewEmployeePreboardingChecklist[]
) => {
  const values = data.map((item) => ({
    preboardingId: item.preboardingId,
    checklistDetailsId: item.checklistDetailsId,
    responsibleEmployeeId: item.responsibleEmployeeId || null,
    completionDate: item.completionDate ? new Date(item.completionDate) : null,
    status: item.status,
    createdBy: item.createdBy,
  }))

  await db.insert(employeePreboardingChecklistModel).values(values)

  return true
}

// edit bulk checklist
export const updateAssignedChecklistService = async (
  data: NewEmployeePreboardingChecklist[]
) => {
  for (const item of data) {
    await db
      .update(employeePreboardingChecklistModel)
      .set({
        responsibleEmployeeId: item.responsibleEmployeeId || null,

        completionDate: item.completionDate
          ? new Date(item.completionDate)
          : null,

        status: item.status,
        updatedBy: item.updatedBy,
      })
      .where(
        eq(
          employeePreboardingChecklistModel.employeePreboardingChecklistId,
          item.employeePreboardingChecklistId!
        )
      )
  }

  return true
}

// get checklist by preboarding employee
export const getAssignedChecklistService = async (preboardingId: number) => {
  return await db
    .select()
    .from(employeePreboardingChecklistModel)
    .where(eq(employeePreboardingChecklistModel.preboardingId, preboardingId))
}

// get preboarding employee by id
export const getPreboardingById = async (preboardingId: number) => {
  const data = await db
    .select()
    .from(employeePreboardingModel)
    .where(eq(employeePreboardingModel.preboardingId, preboardingId))

  return data[0] || null
}
