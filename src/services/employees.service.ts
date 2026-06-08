import { eq, InferInsertModel, sql } from 'drizzle-orm'
import { db } from '../config/database'
import {
  employeeModel,
  departmentModel,
  designationModel,
  employmentTypeModel,
  NewEmployee,
  companyModel,
  divisionModel,
  costCenterModel,
  workStationModel,
  shiftModel,
  NewUser,
  userModel,
  employeeLeaveAssignmentModel,
  employeeSalaryStructureModel,
  employeePreboardingModel,
} from '../schemas'
import { alias } from 'drizzle-orm/mysql-core'
import { BadRequestError } from './utils/errors.utils'
import { hashPassword, validatePassword } from './utils/password.utils'
import { getCache, setCache } from '../middlewares/cache'
import { redis } from '../middlewares/redis'

//CREATE
export const createEmployee = async (input: {
  employeeData: NewEmployee & {
    preboardingId: number
    leavePolicies?: number[]
    salaryStructures?: number[]
  }
  userData: NewUser
}) => {
  const CACHE_KEY = 'employees:all'

  return await db.transaction(async (tx) => {
    const { employeeData, userData } = input

    const leavePolicies = employeeData.leavePolicies ?? []
    const salaryStructures = employeeData.salaryStructures ?? []

    // 1. Check duplicate username
    const existingUser = await tx
      .select()
      .from(userModel)
      .where(eq(userModel.username, userData.username))
      .limit(1)

    if (existingUser.length > 0) {
      throw BadRequestError('Username already registered')
    }

    // 2. Password
    validatePassword(userData.password)
    const hashedPassword = await hashPassword(userData.password)

    // 3. Create user
    const userInsertResult = await tx.insert(userModel).values({
      username: userData.username,
      password: hashedPassword,
      active: userData.active ?? true,
      isPasswordResetRequired: true,
      roleId: userData.roleId,
      tenantId: userData.tenantId,
      email: userData.email,
    })

    const userId = Number(userInsertResult[0].insertId)

    // 4. Create employee
    const employeeInsertResult = await tx.insert(employeeModel).values({
      ...employeeData,
      userId,
    })

    const employeeId = Number(employeeInsertResult[0].insertId)

    // 4.1 Update preboarding if exists
    if (
      employeeData.preboardingId !== null &&
      employeeData.preboardingId !== undefined
    ) {
      await tx
        .update(employeePreboardingModel)
        .set({
          isConfirmed: true,
        })
        .where(eq(employeePreboardingModel.preboardingId, employeeData.preboardingId))
    }

    // 5. Leave Policies mapping
    if (leavePolicies.length > 0) {
      await tx.insert(employeeLeaveAssignmentModel).values(
        leavePolicies.map((id) => ({
          employeeId,
          leavePolicyMasterId: id,
          effectiveFrom: new Date(),
          createdBy: employeeData.createdBy,
        }))
      )
    }

    // 6. Salary Structures mapping
    if (salaryStructures.length > 0) {
      await tx.insert(employeeSalaryStructureModel).values(
        salaryStructures.map((id) => ({
          employeeId,
          salaryStructureMasterId: id,
          createdBy: employeeData.createdBy,
        }))
      )
    }

    await redis.del(CACHE_KEY)

    const [employee] = await tx
      .select()
      .from(employeeModel)
      .where(eq(employeeModel.employeeId, employeeId))

    return {
      employee,
      user: {
        id: userId,
        username: userData.username,
        email: userData.email,
        roleId: userData.roleId,
        tenantId: userData.tenantId,
        active: userData.active,
      },
    }
  })
}

// UPDATE EMPLOYEE
export const updateEmployee = async (
  employeeId: number,
  data: Partial<NewEmployee> & {
    leavePolicies?: number[]
    salaryStructures?: number[]
  }
) => {
  const CACHE_KEY = 'employees:all'

  return await db.transaction(async (tx) => {
    const existing = await tx.query.employeeModel.findFirst({
      where: eq(employeeModel.employeeId, employeeId),
    })

    if (!existing) throw new Error('Employee not found')

    const { leavePolicies, salaryStructures, ...employeeData } = data

    const fkFields = [
      'departmentId',
      'designationId',
      'employmentTypeId',
      'shiftId',
      'companyId',
      'workStationId',
      'divisionId',
      'costCenterId',
      'reportingAuthorityId',
    ]

    const updateData: any = {}

    Object.entries(employeeData).forEach(([key, value]) => {
      if (fkFields.includes(key)) {
        updateData[key] =
          value === 0 || value === '' || value === undefined ? null : value
      } else if (key === 'isActive') {
        updateData[key] = value ? 1 : 0
      } else {
        updateData[key] = value === '' || value === undefined ? null : value
      }
    })

    updateData.updatedAt = new Date()

    // 1. update employee
    await tx
      .update(employeeModel)
      .set(updateData)
      .where(eq(employeeModel.employeeId, employeeId))

    // 2. update leave policies (replace strategy)
    if (leavePolicies !== undefined) {
      await tx
        .delete(employeeLeaveAssignmentModel)
        .where(eq(employeeLeaveAssignmentModel.employeeId, employeeId))

      if (leavePolicies.length > 0) {
        await tx.insert(employeeLeaveAssignmentModel).values(
          leavePolicies.map((id) => ({
            employeeId,
            leavePolicyMasterId: id,
            effectiveFrom: new Date(),
            createdBy: employeeData.updatedBy ?? employeeData.createdBy ?? 0,
          }))
        )
      }
    }

    // 3. update salary structures
    if (salaryStructures !== undefined) {
      await tx
        .delete(employeeSalaryStructureModel)
        .where(eq(employeeSalaryStructureModel.employeeId, employeeId))

      if (salaryStructures.length > 0) {
        await tx.insert(employeeSalaryStructureModel).values(
          salaryStructures.map((id) => ({
            employeeId,
            salaryStructureMasterId: id,
            createdBy: employeeData.updatedBy ?? employeeData.createdBy ?? 0,
          }))
        )
      }
    }

    await redis.del(CACHE_KEY)

    const updatedEmployee = await tx.query.employeeModel.findFirst({
      where: eq(employeeModel.employeeId, employeeId),
    })

    return updatedEmployee
  })
}

//GET ALL EMPLOYEES
export const getAllEmployees = async () => {
  const CACHE_KEY = 'employees:all'

  // 1️⃣ CHECK CACHE FIRST
  const cachedData = await getCache(CACHE_KEY)

  if (cachedData) {
    console.log('⚡ Redis HIT')
    return cachedData
  }

  console.log('🐢 MySQL QUERY (CACHE MISS)')

  const reportingAuthority = alias(employeeModel, 'reportingAuthority')

  const data = await db
    .select({
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

      workEmail: employeeModel.workEmail,
      privateEmail: employeeModel.privateEmail,
      homePhone: employeeModel.homePhone,
      personalPhone: employeeModel.personalPhone,
      officialPhone: employeeModel.officialPhone,

      presentAddress: employeeModel.presentAddress,
      permanentAddress: employeeModel.permanentAddress,

      emergencyContactName: employeeModel.emergencyContactName,
      emergencyContactPhone: employeeModel.emergencyContactPhone,
      emergencyContactRelation: employeeModel.emergencyContactRelation,

      maritalStatus: employeeModel.maritalStatus,
      photoUrl: employeeModel.photoUrl,
      cvUrl: employeeModel.cvUrl,
      religion: employeeModel.religion,
      bloodGroup: employeeModel.bloodGroup,

      qualification: employeeModel.qualification,
      instituteName: employeeModel.instituteName,
      subjectName: employeeModel.subjectName,
      startDate: employeeModel.startDate,
      endDate: employeeModel.endDate,
      result: employeeModel.result,
      certificateUrl: employeeModel.certificateUrl,

      basicSalary: employeeModel.basicSalary,
      isActive: employeeModel.isActive,

      dependentsName: employeeModel.dependentsName,
      dependentRelation: employeeModel.dependentRelation,

      departmentId: employeeModel.departmentId,
      designationId: employeeModel.designationId,
      employmentTypeId: employeeModel.employmentTypeId,
      shiftId: employeeModel.shiftId,
      companyId: employeeModel.companyId,
      workStationId: employeeModel.workStationId,
      divisionId: employeeModel.divisionId,
      costCenterId: employeeModel.costCenterId,
      reportingAuthorityId: employeeModel.reportingAuthorityId,

      departmentName: departmentModel.departmentName,
      designationName: designationModel.designationName,
      employmentTypeName: employmentTypeModel.employmentTypeName,
      companyName: companyModel.companyName,
      workStationName: workStationModel.workStationName,
      divisionName: divisionModel.divisionName,
      shiftName: shiftModel.shiftName,
      startTime: shiftModel.startTime,
      endTime: shiftModel.endTime,
      costCenterName: costCenterModel.costCenterName,

      reportingAuthorityName: reportingAuthority.empFullName,

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
      employmentTypeModel,
      eq(employeeModel.employmentTypeId, employmentTypeModel.employmentTypeId)
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
    .leftJoin(shiftModel, eq(employeeModel.shiftId, shiftModel.shiftId))
    .leftJoin(
      reportingAuthority,
      eq(employeeModel.reportingAuthorityId, reportingAuthority.employeeId)
    )

  // 2️⃣ SAVE TO REDIS
  await setCache(CACHE_KEY, data, 300)

  return data
}

//GET EMPLOYEE BY ID (WITH WEEKENDS)
export const getEmployeeById = async (employeeId: number) => {
  const reportingAuthority = alias(employeeModel, 'reportingAuthority')

  const employee = await db
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

      // Address
      presentAddress: employeeModel.presentAddress,
      permanentAddress: employeeModel.permanentAddress,

      // Emergency Contact
      emergencyContactName: employeeModel.emergencyContactName,
      emergencyContactPhone: employeeModel.emergencyContactPhone,
      emergencyContactRelation: employeeModel.emergencyContactRelation,

      // Personal
      maritalStatus: employeeModel.maritalStatus,
      photoUrl: employeeModel.photoUrl,
      cvUrl: employeeModel.cvUrl,
      religion: employeeModel.religion,
      bloodGroup: employeeModel.bloodGroup,

      // Qualification
      qualification: employeeModel.qualification,
      instituteName: employeeModel.instituteName,
      subjectName: employeeModel.subjectName,
      startDate: employeeModel.startDate,
      endDate: employeeModel.endDate,
      result: employeeModel.result,
      certificateUrl: employeeModel.certificateUrl,

      // Employment
      basicSalary: employeeModel.basicSalary,
      isActive: employeeModel.isActive,

      // Dependents
      dependentsName: employeeModel.dependentsName,
      dependentRelation: employeeModel.dependentRelation,

      // Foreign Keys
      departmentId: employeeModel.departmentId,
      designationId: employeeModel.designationId,
      employmentTypeId: employeeModel.employmentTypeId,
      shiftId: employeeModel.shiftId,
      companyId: employeeModel.companyId,
      workStationId: employeeModel.workStationId,
      divisionId: employeeModel.divisionId,
      costCenterId: employeeModel.costCenterId,
      reportingAuthorityId: employeeModel.reportingAuthorityId,

      // Names
      departmentName: departmentModel.departmentName,
      designationName: designationModel.designationName,
      employmentTypeName: employmentTypeModel.employmentTypeName,
      companyName: companyModel.companyName,
      workStationName: workStationModel.workStationName,
      divisionName: divisionModel.divisionName,
      shiftName: shiftModel.shiftName,
      costCenterName: costCenterModel.costCenterName,

      // Self join
      reportingAuthorityName: reportingAuthority.empFullName,

      // Audit
      createdBy: employeeModel.createdBy,
      createdAt: employeeModel.createdAt,
      updatedBy: employeeModel.updatedBy,
      updatedAt: employeeModel.updatedAt,
    })
    .from(employeeModel)
    .where(eq(employeeModel.employeeId, employeeId))
    .leftJoin(
      departmentModel,
      eq(employeeModel.departmentId, departmentModel.departmentId)
    )
    .leftJoin(
      designationModel,
      eq(employeeModel.designationId, designationModel.designationId)
    )
    .leftJoin(
      employmentTypeModel,
      eq(employeeModel.employmentTypeId, employmentTypeModel.employmentTypeId)
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
    .leftJoin(shiftModel, eq(employeeModel.shiftId, shiftModel.shiftId))
    .leftJoin(
      reportingAuthority,
      eq(employeeModel.reportingAuthorityId, reportingAuthority.employeeId)
    )
    .limit(1)

  if (!employee || employee.length === 0) return null

  return employee[0]
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
