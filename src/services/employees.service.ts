import { eq, InferInsertModel, sql } from 'drizzle-orm'
import { db } from '../config/database'
import {
  employeeModel,
  departmentModel,
  designationModel,
  employeeTypeModel,
  employeeLeaveTypeModel,
  NewEmployee,
  companyModel,
  divisionModel,
  costCenterModel,
  reportingAuthorityModel,
  workStationModel,
} from '../schemas'

//CREATE
export const createEmployee = async (
  data: NewEmployee & { leaveTypeIds?: number[] }
) => {
  return await db.transaction(async (tx) => {
    // 1️⃣ Insert employee - ALL FIELDS FROM SCHEMA
    const insertResult = await tx.insert(employeeModel).values({
      // Basic Information
      empCode: data.empCode,
      empFullName: data.empFullName,
      empShortName: data.empShortName ?? null,
      dob: data.dob,
      doj: data.doj,
      doc: data.doc ?? null,
      gender: data.gender,
      nationalIdNo: data.nationalIdNo ?? null,
      nationality: data.nationality ?? null,
      country: data.country ?? null,
      city: data.city ?? null,
      zipCode: data.zipCode ?? null,

      // Contact Information
      workEmail: data.workEmail ?? null,
      privateEmail: data.privateEmail ?? null,
      homePhone: data.homePhone ?? null,
      personalPhone: data.personalPhone ?? null,
      officialPhone: data.officialPhone,

      // Address Information
      presentAddress: data.presentAddress,
      permanentAddress: data.permanentAddress ?? null,

      // Emergency Contact
      emergencyContactName: data.emergencyContactName ?? null,
      emergencyContactPhone: data.emergencyContactPhone ?? null,
      emergencyContactRelation: data.emergencyContactRelation ?? null,

      // Personal Information
      maritalStatus: data.maritalStatus ?? null,
      photoUrl: data.photoUrl ?? null,
      cvUrl: data.cvUrl ?? null,
      religion: data.religion ?? null,
      bloodGroup: data.bloodGroup ?? null,

      // Qualification Information
      qualification: data.qualification,
      instituteName: data.instituteName ?? null,
      subjectName: data.subjectName ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      result: data.result ?? null,
      certificateUrl: data.certificateUrl ?? null,

      // Employment Information
      basicSalary: data.basicSalary,
      isActive: data.isActive ?? true,

      // Dependents Information
      dependentsName: data.dependentsName ?? null,
      dependentRelation: data.dependentRelation ?? null,

      // Foreign Keys
      departmentId: data.departmentId,
      designationId: data.designationId,
      employeeTypeId: data.employeeTypeId,
      officeTimingId: data.officeTimingId,
      companyId: data.companyId,
      workStationId: data.workStationId,
      divisionId: data.divisionId,
      costCenterId: data.costCenterId,
      reportingAuthorityId: data.reportingAuthorityId,

      // Audit Fields
      createdBy: data.createdBy,
    })

    // ✅ MySQL: Get insertId from result array
    const employeeId = Number(insertResult[0].insertId)

    // 2️⃣ Insert employee leave types (BULK)
    if (data.leaveTypeIds?.length) {
      await tx.insert(employeeLeaveTypeModel).values(
        data.leaveTypeIds.map((leaveTypeId) => ({
          employeeId,
          leaveTypeId,
        }))
      )
    }

    // 3️⃣ Return created employee
    const [employee] = await tx
      .select()
      .from(employeeModel)
      .where(eq(employeeModel.employeeId, employeeId))

    return employee
  })
}

// UPDATE
export const updateEmployee = async (
  employeeId: number,
  data: Partial<NewEmployee> & { leaveTypeIds?: number[] }
) => {
  console.log('🚀 ~ updateEmployee ~ data:', data)

  return await db.transaction(async (tx) => {
    // Check if employee exists
    const existing = await tx.query.employeeModel.findFirst({
      where: eq(employeeModel.employeeId, employeeId),
    })

    if (!existing) throw new Error('Employee not found')

    // ✅ Prepare update data (only include fields that are provided)
    const updateData: any = {}

    // Basic Information
    if (data.empCode !== undefined) updateData.empCode = data.empCode
    if (data.empFullName !== undefined)
      updateData.empFullName = data.empFullName
    if (data.empShortName !== undefined)
      updateData.empShortName = data.empShortName
    if (data.dob !== undefined) updateData.dob = data.dob
    if (data.doj !== undefined) updateData.doj = data.doj
    if (data.doc !== undefined) updateData.doc = data.doc
    if (data.gender !== undefined) updateData.gender = data.gender
    if (data.nationalIdNo !== undefined)
      updateData.nationalIdNo = data.nationalIdNo
    if (data.nationality !== undefined)
      updateData.nationality = data.nationality
    if (data.country !== undefined) updateData.country = data.country
    if (data.city !== undefined) updateData.city = data.city
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode

    // Contact Information
    if (data.workEmail !== undefined) updateData.workEmail = data.workEmail
    if (data.privateEmail !== undefined)
      updateData.privateEmail = data.privateEmail
    if (data.homePhone !== undefined) updateData.homePhone = data.homePhone
    if (data.personalPhone !== undefined)
      updateData.personalPhone = data.personalPhone
    if (data.officialPhone !== undefined)
      updateData.officialPhone = data.officialPhone

    // Address Information
    if (data.presentAddress !== undefined)
      updateData.presentAddress = data.presentAddress
    if (data.permanentAddress !== undefined)
      updateData.permanentAddress = data.permanentAddress

    // Emergency Contact
    if (data.emergencyContactName !== undefined)
      updateData.emergencyContactName = data.emergencyContactName
    if (data.emergencyContactPhone !== undefined)
      updateData.emergencyContactPhone = data.emergencyContactPhone
    if (data.emergencyContactRelation !== undefined)
      updateData.emergencyContactRelation = data.emergencyContactRelation

    // Personal Information
    if (data.maritalStatus !== undefined)
      updateData.maritalStatus = data.maritalStatus
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl
    if (data.cvUrl !== undefined) updateData.cvUrl = data.cvUrl
    if (data.religion !== undefined) updateData.religion = data.religion
    if (data.bloodGroup !== undefined) updateData.bloodGroup = data.bloodGroup

    // Qualification Information
    if (data.qualification !== undefined)
      updateData.qualification = data.qualification
    if (data.instituteName !== undefined)
      updateData.instituteName = data.instituteName
    if (data.subjectName !== undefined)
      updateData.subjectName = data.subjectName
    if (data.startDate !== undefined) updateData.startDate = data.startDate
    if (data.endDate !== undefined) updateData.endDate = data.endDate
    if (data.result !== undefined) updateData.result = data.result
    if (data.certificateUrl !== undefined)
      updateData.certificateUrl = data.certificateUrl

    // Employment Information
    if (data.basicSalary !== undefined)
      updateData.basicSalary = data.basicSalary
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    // Dependents Information
    if (data.dependentsName !== undefined)
      updateData.dependentsName = data.dependentsName
    if (data.dependentRelation !== undefined)
      updateData.dependentRelation = data.dependentRelation

    // Foreign Keys
    if (data.departmentId !== undefined)
      updateData.departmentId = data.departmentId
    if (data.designationId !== undefined)
      updateData.designationId = data.designationId
    if (data.employeeTypeId !== undefined)
      updateData.employeeTypeId = data.employeeTypeId
    if (data.officeTimingId !== undefined)
      updateData.officeTimingId = data.officeTimingId
    if (data.companyId !== undefined) updateData.companyId = data.companyId
    if (data.workStationId !== undefined)
      updateData.workStationId = data.workStationId
    if (data.divisionId !== undefined) updateData.divisionId = data.divisionId
    if (data.costCenterId !== undefined)
      updateData.costCenterId = data.costCenterId
    if (data.reportingAuthorityId !== undefined)
      updateData.reportingAuthorityId = data.reportingAuthorityId

    // Audit Fields
    if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy
    updateData.updatedAt = sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

    // ✅ Execute UPDATE if there are fields to update
    if (Object.keys(updateData).length > 0) {
      await tx
        .update(employeeModel)
        .set(updateData)
        .where(eq(employeeModel.employeeId, employeeId))
    }

    // 🔁 Update leave types if provided
    if (data.leaveTypeIds !== undefined) {
      await tx
        .delete(employeeLeaveTypeModel)
        .where(eq(employeeLeaveTypeModel.employeeId, employeeId))

      if (data.leaveTypeIds.length > 0) {
        await tx.insert(employeeLeaveTypeModel).values(
          data.leaveTypeIds.map((leaveTypeId) => ({
            employeeId,
            leaveTypeId,
          }))
        )
      }
    }

    // ✅ Return updated employee
    const updatedEmployee = await tx.query.employeeModel.findFirst({
      where: eq(employeeModel.employeeId, employeeId),
    })

    return updatedEmployee
  })
}

//GET ALL EMPLOYEES
export const getAllEmployees = async () => {
  return await db
    .select({
      // Employee Basic Information
      employeeId: employeeModel.employeeId,
      empCode: employeeModel.empCode,
      empFullName: employeeModel.empFullName,
      empShortName: employeeModel.empShortName,
      dob: employeeModel.dob,
      doj: employeeModel.doj,
      doc: employeeModel.doc,
      gender: employeeModel.gender,
      nationalIdNo: employeeModel.nationalIdNo,
      nationality: employeeModel.nationality,
      country: employeeModel.country,
      city: employeeModel.city,
      zipCode: employeeModel.zipCode,

      // Contact Information
      workEmail: employeeModel.workEmail,
      privateEmail: employeeModel.privateEmail,
      homePhone: employeeModel.homePhone,
      personalPhone: employeeModel.personalPhone,
      officialPhone: employeeModel.officialPhone,

      // Address Information
      presentAddress: employeeModel.presentAddress,
      permanentAddress: employeeModel.permanentAddress,

      // Emergency Contact
      emergencyContactName: employeeModel.emergencyContactName,
      emergencyContactPhone: employeeModel.emergencyContactPhone,
      emergencyContactRelation: employeeModel.emergencyContactRelation,

      // Personal Information
      maritalStatus: employeeModel.maritalStatus,
      photoUrl: employeeModel.photoUrl,
      cvUrl: employeeModel.cvUrl,
      religion: employeeModel.religion,
      bloodGroup: employeeModel.bloodGroup,

      // Qualification Information
      qualification: employeeModel.qualification,
      instituteName: employeeModel.instituteName,
      subjectName: employeeModel.subjectName,
      startDate: employeeModel.startDate,
      endDate: employeeModel.endDate,
      result: employeeModel.result,
      certificateUrl: employeeModel.certificateUrl,

      // Employment Information
      basicSalary: employeeModel.basicSalary,
      isActive: employeeModel.isActive,

      // Dependents Information
      dependentsName: employeeModel.dependentsName,
      dependentRelation: employeeModel.dependentRelation,

      // Foreign Keys (IDs)
      departmentId: employeeModel.departmentId,
      designationId: employeeModel.designationId,
      employeeTypeId: employeeModel.employeeTypeId,
      officeTimingId: employeeModel.officeTimingId,
      companyId: employeeModel.companyId,
      workStationId: employeeModel.workStationId,
      divisionId: employeeModel.divisionId,
      costCenterId: employeeModel.costCenterId,
      reportingAuthorityId: employeeModel.reportingAuthorityId,

      // Related Names
      departmentName: departmentModel.departmentName,
      designationName: designationModel.designationName,
      employeeTypeName: employeeTypeModel.employeeTypeName,
      companyName: companyModel.companyName,
      workStationName: workStationModel.workStationName,
      divisionName: divisionModel.divisionName,
      costCenterName: costCenterModel.costCenterName,
      reportingAuthorityName: reportingAuthorityModel.reportingAuthorityName,

      // Audit Fields
      createdBy: employeeModel.createdBy,
      createdAt: employeeModel.createdAt,
      updatedBy: employeeModel.updatedBy,
      updatedAt: employeeModel.updatedAt,
    })
    .from(employeeModel)
    .leftJoin(
      departmentModel,
      eq(employeeModel.departmentId, departmentModel.departmentId)
    )
    .leftJoin(
      designationModel,
      eq(employeeModel.designationId, designationModel.designationId)
    )
    .leftJoin(
      employeeTypeModel,
      eq(employeeModel.employeeTypeId, employeeTypeModel.employeeTypeId)
    )
    .leftJoin(companyModel, eq(employeeModel.companyId, companyModel.companyId))
    .leftJoin(
      workStationModel,
      eq(employeeModel.workStationId, workStationModel.workStationId)
    )
    .leftJoin(
      divisionModel,
      eq(employeeModel.divisionId, divisionModel.divisionId)
    )
    .leftJoin(
      costCenterModel,
      eq(employeeModel.costCenterId, costCenterModel.costCenterId)
    )
    .leftJoin(
      reportingAuthorityModel,
      eq(
        employeeModel.reportingAuthorityId,
        reportingAuthorityModel.reportingAuthorityId
      )
    )
}

//GET EMPLOYEE BY ID (WITH WEEKENDS)
export const getEmployeeById = async (employeeId: number) => {
  const employee = await db
    .select()
    .from(employeeModel)
    .where(eq(employeeModel.employeeId, employeeId))
    .limit(1)

  if (!employee || employee.length === 0) return null

  const weekends = await db
    .select({ weekendId: employeeLeaveTypeModel.leaveTypeId })
    .from(employeeLeaveTypeModel)
    .where(eq(employeeLeaveTypeModel.employeeId, employeeId))

  return {
    ...employee[0],
    leaveTypeIds: weekends.map((w) => w.weekendId),
  }
}

//DELETE
export const deleteEmployee = async (employeeId: number) => {
  return await db.transaction(async (tx) => {
    const existing = await tx.query.employeeModel.findFirst({
      where: eq(employeeModel.employeeId, employeeId),
    })

    if (!existing) {
      throw new Error('Employee not found')
    }

    await tx
      .delete(employeeModel)
      .where(eq(employeeModel.employeeId, employeeId))

    return {
      message: 'Employee deleted successfully',
      deletedEmployee: existing,
    }
  })
}

// ASSIGN LEAVE TYPES TO EMPLOYEES
type AssignLeaveTypeGrouped = {
  employeeId: number
  leaveTypeIds: number[]
}

type AssignLeaveTypeFlat = {
  employeeId: number
  leaveTypeId: number
}

export const assignLeaveType = async (
  payload:
    | AssignLeaveTypeGrouped
    | AssignLeaveTypeFlat
    | AssignLeaveTypeGrouped[]
    | AssignLeaveTypeFlat[]
) => {
  const data = Array.isArray(payload) ? payload : [payload]

  console.log('🚀 ~ assignLeaveType ~ raw data:', data)

  return await db.transaction(async (tx) => {
    const groupedByEmployee = new Map<number, Set<number>>()

    for (const item of data) {
      const { employeeId } = item
      if (!employeeId) continue

      if (!groupedByEmployee.has(employeeId)) {
        groupedByEmployee.set(employeeId, new Set())
      }

      const bucket = groupedByEmployee.get(employeeId)!

      // 🟢 Grouped payload
      if ('leaveTypeIds' in item && Array.isArray(item.leaveTypeIds)) {
        item.leaveTypeIds
          .filter((id): id is number => Number.isInteger(id))
          .forEach((id) => bucket.add(id))
      }

      // 🟢 Flat payload
      if ('leaveTypeId' in item && Number.isInteger(item.leaveTypeId)) {
        bucket.add(item.leaveTypeId)
      }
    }

    // Process each employee
    for (const [employeeId, leaveTypeSet] of groupedByEmployee) {
      const leaveTypeIds = Array.from(leaveTypeSet)

      // 1️⃣ Delete old assignments
      await tx
        .delete(employeeLeaveTypeModel)
        .where(eq(employeeLeaveTypeModel.employeeId, employeeId))

      // 2️⃣ Insert new ones
      if (leaveTypeIds.length > 0) {
        await tx.insert(employeeLeaveTypeModel).values(
          leaveTypeIds.map((leaveTypeId) => ({
            employeeId,
            leaveTypeId,
          }))
        )
      }
    }

    return {
      success: true,
      message: 'Leave types assigned successfully',
    }
  })
}
