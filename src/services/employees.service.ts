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
} from '../schemas'
import { alias } from 'drizzle-orm/mysql-core'
import { BadRequestError } from './utils/errors.utils'
import { hashPassword, validatePassword } from './utils/password.utils'
import { getCache, setCache } from '../middlewares/cache'

//CREATE
export const createEmployee = async (input: {
  employeeData: NewEmployee
  userData: NewUser
}) => {
  return await db.transaction(async (tx) => {
    const { employeeData, userData } = input

    // 1️⃣ Check duplicate username
    const existingUser = await tx
      .select()
      .from(userModel)
      .where(eq(userModel.username, userData.username))
      .limit(1)

    if (existingUser.length > 0) {
      throw BadRequestError('Username already registered, Please Try Another')
    }

    // 2️⃣ Validate + hash password
    validatePassword(userData.password)
    const hashedPassword = await hashPassword(userData.password)

    // 3️⃣ Create user
    const userInsertResult = await tx.insert(userModel).values({
      username: userData.username,
      password: hashedPassword,
      active: userData.active ? true : false,
      isPasswordResetRequired: true,
      roleId: userData.roleId,
      tenantId: userData.tenantId,
      email: userData.email,
    })

    const userId = Number(userInsertResult[0].insertId)

    // 4️⃣ Create employee (attach userId)
    const employeeInsertResult = await tx.insert(employeeModel).values({
      empCode: employeeData.empCode,
      empFullName: employeeData.empFullName,
      empShortName: employeeData.empShortName ?? null,
      dob: employeeData.dob,
      doj: employeeData.doj,
      doc: employeeData.doc ?? null,
      gender: employeeData.gender,
      nationalIdNo: employeeData.nationalIdNo ?? null,
      nationality: employeeData.nationality ?? null,
      country: employeeData.country ?? null,
      city: employeeData.city ?? null,
      zipCode: employeeData.zipCode ?? null,

      workEmail: employeeData.workEmail ?? null,
      privateEmail: employeeData.privateEmail ?? null,
      homePhone: employeeData.homePhone ?? null,
      personalPhone: employeeData.personalPhone ?? null,
      officialPhone: employeeData.officialPhone,

      presentAddress: employeeData.presentAddress,
      permanentAddress: employeeData.permanentAddress ?? null,

      emergencyContactName: employeeData.emergencyContactName ?? null,
      emergencyContactPhone: employeeData.emergencyContactPhone ?? null,
      emergencyContactRelation: employeeData.emergencyContactRelation ?? null,

      maritalStatus: employeeData.maritalStatus ?? null,
      photoUrl: employeeData.photoUrl ?? null,
      cvUrl: employeeData.cvUrl ?? null,
      religion: employeeData.religion ?? null,
      bloodGroup: employeeData.bloodGroup ?? null,

      qualification: employeeData.qualification,
      instituteName: employeeData.instituteName ?? null,
      subjectName: employeeData.subjectName ?? null,
      startDate: employeeData.startDate ?? null,
      endDate: employeeData.endDate ?? null,
      result: employeeData.result ?? null,
      certificateUrl: employeeData.certificateUrl ?? null,

      basicSalary: employeeData.basicSalary,
      isActive: employeeData.isActive ?? true,

      dependentsName: employeeData.dependentsName ?? null,
      dependentRelation: employeeData.dependentRelation ?? null,

      departmentId: employeeData.departmentId,
      designationId: employeeData.designationId,
      employmentTypeId: employeeData.employmentTypeId,
      shiftId: employeeData.shiftId,
      companyId: employeeData.companyId,
      workStationId: employeeData.workStationId,
      divisionId: employeeData.divisionId,
      costCenterId: employeeData.costCenterId,
      reportingAuthorityId: employeeData.reportingAuthorityId,

      createdBy: employeeData.createdBy,
    })

    const employeeId = Number(employeeInsertResult[0].insertId)

    // 5️⃣ Return full employee
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

// UPDATE
export const updateEmployee = async (
  employeeId: number,
  data: Partial<NewEmployee>
) => {
  return await db.transaction(async (tx) => {
    const existing = await tx.query.employeeModel.findFirst({
      where: eq(employeeModel.employeeId, employeeId),
    })

    if (!existing) throw new Error('Employee not found')

    const normalizeFk = (val: any) =>
      val === 0 || val === '' || val === undefined ? null : val

    const normalizeValue = (val: any) =>
      val === '' || val === undefined ? null : val

    const updateData: any = {}

    Object.entries(data).forEach(([key, value]) => {
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

      if (fkFields.includes(key)) {
        updateData[key] = normalizeFk(value)
      } else if (key === 'isActive') {
        updateData[key] = value ? 1 : 0
      } else {
        updateData[key] = normalizeValue(value)
      }
    })

    updateData.updatedAt = new Date()

    await tx
      .update(employeeModel)
      .set(updateData)
      .where(eq(employeeModel.employeeId, employeeId))

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
