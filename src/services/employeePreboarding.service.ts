import { db } from '../config/database'
import {
  employeePreboardingModel,
  departmentModel,
  designationModel,
  employeeModel,
  employmentTypeModel,
  salaryStructureMasterModel,
  companyModel,
  NewEmployeePreboardingChecklist,
  employeePreboardingChecklistModel,
  checklistDetailsModel,
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
      isConfirmed: employeePreboardingModel.isConfirmed,
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
  console.log(
    '🚀 ~ updateEmployeePreboarding ~ preboardingId:',
    data.preboardingId
  )
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
    .select({
      employeePreboardingChecklistId:
        employeePreboardingChecklistModel.employeePreboardingChecklistId,
      preboardingId: employeePreboardingChecklistModel.preboardingId,
      checklistDetailsId: employeePreboardingChecklistModel.checklistDetailsId,
      checklistDetailsName: checklistDetailsModel.checklistDetailsName,
      responsibleEmployeeId:
        employeePreboardingChecklistModel.responsibleEmployeeId,
      completionDate: employeePreboardingChecklistModel.completionDate,
      isComplete: employeePreboardingChecklistModel.isComplete,
      status: employeePreboardingChecklistModel.status,
      createdBy: employeePreboardingChecklistModel.createdBy,
      createdAt: employeePreboardingChecklistModel.createdAt,
      updatedBy: employeePreboardingChecklistModel.updatedBy,
      updatedAt: employeePreboardingChecklistModel.updatedAt,
      responsibleEmployeeName: employeeModel.empFullName,
    })
    .from(employeePreboardingChecklistModel)
    .leftJoin(
      employeeModel,
      eq(
        employeePreboardingChecklistModel.responsibleEmployeeId, // Use responsibleEmployeeId, not checklistDetailsId
        employeeModel.employeeId
      )
    )
    .leftJoin(
      checklistDetailsModel,
      eq(
        employeePreboardingChecklistModel.checklistDetailsId,
        checklistDetailsModel.checklistDetailsId
      )
    )
    .where(eq(employeePreboardingChecklistModel.preboardingId, preboardingId))
}

// Get employee preboarding checklists by userId
export const getAssignedChecklistByUserService = async (userId: number) => {
  console.log("🚀 ~ getAssignedChecklistByUserService ~ userId:", userId)
  // Step 1: Find employee by userId
  const employee = await db.query.employeeModel.findFirst({
    where: eq(employeeModel.userId, userId),
    columns: {
      employeeId: true,
    },
  })
  console.log("🚀 ~ getAssignedChecklistByUserService ~ employee:", employee)

  if (!employee) {
    throw new Error('Employee not found for this user')
  }

  // Step 2: Get assigned checklists
  return await db
    .select({
      employeePreboardingChecklistId:
        employeePreboardingChecklistModel.employeePreboardingChecklistId,
      preboardingId: employeePreboardingChecklistModel.preboardingId,
      preboardingFullName: employeePreboardingModel.fullName,
      checklistDetailsId:
        employeePreboardingChecklistModel.checklistDetailsId,
      checklistDetailsName: checklistDetailsModel.checklistDetailsName,
      responsibleEmployeeId:
        employeePreboardingChecklistModel.responsibleEmployeeId,
        responsibleEmployeeName: employeeModel.empFullName,
      completionDate: employeePreboardingChecklistModel.completionDate,
      isComplete: employeePreboardingChecklistModel.isComplete,
      status: employeePreboardingChecklistModel.status,
      createdBy: employeePreboardingChecklistModel.createdBy,
      createdAt: employeePreboardingChecklistModel.createdAt,
      updatedBy: employeePreboardingChecklistModel.updatedBy,
      updatedAt: employeePreboardingChecklistModel.updatedAt,
    })
    .from(employeePreboardingChecklistModel)
    .leftJoin(
      employeeModel,
      eq(
        employeePreboardingChecklistModel.responsibleEmployeeId,
        employeeModel.employeeId
      )
    )
    .leftJoin(
      checklistDetailsModel,
      eq(
        employeePreboardingChecklistModel.checklistDetailsId,
        checklistDetailsModel.checklistDetailsId
      )
    )
    .leftJoin(
      employeePreboardingModel,
      eq(
        employeePreboardingChecklistModel.preboardingId,
        employeePreboardingModel.preboardingId
      )
    )
    .where(
      eq(
        employeePreboardingChecklistModel.responsibleEmployeeId,
        employee.employeeId
      )
    )
}

// get preboarding employee by id
export const getPreboardingById = async (preboardingId: number) => {
  const data = await db
    .select()
    .from(employeePreboardingModel)
    .where(eq(employeePreboardingModel.preboardingId, preboardingId))

  return data[0] || null
}

export const completeEmployeePreboardingChecklist = async ({
  employeePreboardingChecklistId,
  completionDate,
}: {
  employeePreboardingChecklistId: number
  completionDate: string | Date
}) => {
  const [existing] = await db
    .select()
    .from(employeePreboardingChecklistModel)
    .where(
      eq(
        employeePreboardingChecklistModel.employeePreboardingChecklistId,
        employeePreboardingChecklistId
      )
    )
    .limit(1)

  if (!existing) {
    throw new Error('Checklist not found')
  }

  await db
    .update(employeePreboardingChecklistModel)
    .set({
      isComplete: true,
      completionDate: new Date(completionDate),
    })
    .where(
      eq(
        employeePreboardingChecklistModel.employeePreboardingChecklistId,
        employeePreboardingChecklistId
      )
    )

  const [updated] = await db
    .select()
    .from(employeePreboardingChecklistModel)
    .where(
      eq(
        employeePreboardingChecklistModel.employeePreboardingChecklistId,
        employeePreboardingChecklistId
      )
    )
    .limit(1)

  return updated
}
