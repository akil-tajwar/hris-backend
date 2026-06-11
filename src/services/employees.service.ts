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
  NewUser,
  userModel,
  employeePreboardingModel,
  salaryStructureMasterModel,
  leavePolicyMasterModel,
  employeeDepartmentHistoryModel,
  employeeDesignationHistoryModel,
  employeeEmploymentTypeHistoryModel,
  employeeLeavePolicyHistoryModel,
  employeeSalaryStructureHistoryModel,
  employeeLifecycleEventsModel,
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
    leavePolicyMasterId?: number | null
    salaryStructureMasterId?: number | null
  }
  userData: NewUser
}) => {
  const CACHE_KEY = 'employees:all'

  return await db.transaction(async (tx) => {
    const { employeeData, userData } = input

    // 1. Check duplicate username
    const existingUser = await tx
      .select()
      .from(userModel)
      .where(eq(userModel.username, userData.username))
      .limit(1)

    if (existingUser.length > 0) {
      throw BadRequestError('Username already registered')
    }

    // 2. Validate password
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

    // 5. Update preboarding if exists
    if (employeeData.preboardingId != null) {
      await tx
        .update(employeePreboardingModel)
        .set({
          isConfirmed: true,
        })
        .where(
          eq(employeePreboardingModel.preboardingId, employeeData.preboardingId)
        )
    }

    // 6. Fetch employment type
    const [employmentType] = await tx
      .select()
      .from(employmentTypeModel)
      .where(
        eq(employmentTypeModel.employmentTypeId, employeeData.employmentTypeId)
      )
      .limit(1)

    if (!employmentType) {
      throw new Error('Employment type not found')
    }

    // 7. Lifecycle helper
    const insertLifecycle = async (
      type: 'JOINING' | 'PROBATION_START',
      remarks: string
    ) => {
      await tx.insert(employeeLifecycleEventsModel).values({
        employeeId,
        eventDate: new Date(),
        employeeEventType: type,
        effectiveFrom: new Date(),

        remarks,

        performedBy: employeeData.employeeId ?? null,
        approvedBy: null,

        referenceType: 'EMPLOYEE_CREATION',
        referenceId: employeeId,

        oldValue: null,
        newValue: JSON.stringify({
          employeeId,
          employeeType: employmentType.employmentTypeName,
        }),

        createdBy: employeeData.createdBy,
      } as any)
    }

    // 8. Always insert JOINING
    await insertLifecycle('JOINING', 'Employee joined')

    // 9. Conditionally insert PROBATION_START
    if (employmentType.employmentTypeName === 'Probation') {
      await insertLifecycle('PROBATION_START', 'Probation started')
    }

    // 10. Clear cache
    await redis.del(CACHE_KEY)

    // 11. Return employee
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
        active: userData.active ?? true,
      },
    }
  })
}

// UPDATE EMPLOYEE
export const updateEmployee = async (
  employeeId: number,
  data: Partial<NewEmployee> & {
    leavePolicyMasterId?: number | null
    salaryStructureMasterId?: number | null

    effectiveFrom?: Date | string
    effectiveTo?: Date | string | null
    changeReason?: string
    approvedBy?: number | null
    createdBy?: number
  }
) => {
  const CACHE_KEY = 'employees:all'

  return await db.transaction(async (tx) => {
    const existing = await tx.query.employeeModel.findFirst({
      where: eq(employeeModel.employeeId, employeeId),
    })

    if (!existing) throw new Error('Employee not found')

    const {
      leavePolicyMasterId,
      salaryStructureMasterId,
      effectiveFrom,
      effectiveTo,
      changeReason,
      approvedBy,
      createdBy,
      ...employeeData
    } = data

    const fkFields = [
      'departmentId',
      'designationId',
      'employmentTypeId',
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

    if (leavePolicyMasterId !== undefined) {
      updateData.leavePolicyMasterId =
        leavePolicyMasterId === 0 ? null : leavePolicyMasterId
    }

    if (salaryStructureMasterId !== undefined) {
      updateData.salaryStructureMasterId =
        salaryStructureMasterId === 0 ? null : salaryStructureMasterId
    }

    updateData.updatedAt = new Date()

    // ===========================
    // HISTORY META
    // ===========================
    const historyMeta = {
      effectiveFrom:
        effectiveFrom !== undefined
          ? typeof effectiveFrom === 'string'
            ? new Date(effectiveFrom)
            : effectiveFrom
          : new Date(),
      effectiveTo:
        effectiveTo !== undefined && effectiveTo !== null
          ? typeof effectiveTo === 'string'
            ? new Date(effectiveTo)
            : effectiveTo
          : null,
      changeReason: changeReason ?? null,
      approvedBy: approvedBy ?? null,
      createdBy: createdBy ?? 0,
    }

    // ===========================
    // LIFECYCLE EVENTS
    // ===========================
    const lifecycleEvents: any[] = []

    const pushEvent = (
      type: any,
      oldValue: any,
      newValue: any,
      referenceType?: string,
      referenceId?: number
    ) => {
      lifecycleEvents.push({
        employeeId,
        eventDate: new Date(),
        employeeEventType: type,
        effectiveFrom: historyMeta.effectiveFrom,
        remarks: changeReason ?? null,
        performedBy: createdBy ?? null,
        approvedBy: approvedBy ?? null,
        referenceType: referenceType ?? null,
        referenceId: referenceId ?? null,
        oldValue,
        newValue,
        createdBy: createdBy ?? 5,
      })
    }

    const trackChange = (field: string, eventType: any) => {
      const oldVal = (existing as any)[field]
      const newVal = (updateData as any)[field]

      if (newVal !== undefined && newVal !== oldVal) {
        pushEvent(eventType, { [field]: oldVal }, { [field]: newVal })
      }
    }

    // ===========================
    // BASIC TRACKING
    // ===========================
    trackChange('departmentId', 'DEPARTMENT_CHANGE')
    trackChange('designationId', 'DESIGNATION_CHANGE')
    trackChange('employmentTypeId', 'EMPLOYMENT_TYPE_CHANGE')
    trackChange('leavePolicyMasterId', 'LEAVE_POLICY_CHANGE')
    trackChange('salaryStructureMasterId', 'SALARY_STRUCTURE_CHANGE')
    trackChange('basicSalary', 'SALARY_REVISION')

    // ===========================
    // PROBATION CHANGE
    // ===========================
    const oldProbation = existing.probationMonths
    const newProbation = updateData.probationMonths

    if (
      newProbation !== undefined &&
      newProbation !== oldProbation &&
      newProbation !== null
    ) {
      pushEvent(
        'PROBATION_EXTEND',
        { probationMonths: oldProbation },
        { probationMonths: newProbation }
      )
    }

    // ===========================
    // EMPLOYMENT TYPE → CONFIRMATION
    // ===========================
    let oldEmploymentTypeName: string | undefined
    let newEmploymentTypeName: string | undefined

    if (existing.employmentTypeId) {
      const oldType = await tx.query.employmentTypeModel.findFirst({
        where: eq(
          employmentTypeModel.employmentTypeId,
          existing.employmentTypeId
        ),
      })
      oldEmploymentTypeName = oldType?.employmentTypeName
    }

    if (updateData.employmentTypeId) {
      const newType = await tx.query.employmentTypeModel.findFirst({
        where: eq(
          employmentTypeModel.employmentTypeId,
          updateData.employmentTypeId
        ),
      })
      newEmploymentTypeName = newType?.employmentTypeName
    }

    if (
      newEmploymentTypeName === 'Confirmed' &&
      oldEmploymentTypeName !== 'Confirmed'
    ) {
      pushEvent(
        'CONFIRMATION',
        { employmentType: oldEmploymentTypeName },
        { employmentType: newEmploymentTypeName }
      )
    }

    // ===========================
    // LOCATION CHANGE
    // ===========================
    const locationChanged =
      (updateData.city !== undefined && updateData.city !== existing.city) ||
      (updateData.country !== undefined &&
        updateData.country !== existing.country)

    if (locationChanged) {
      pushEvent(
        'LOCATION_CHANGE',
        {
          city: existing.city,
          country: existing.country,
        },
        {
          city: updateData.city ?? existing.city,
          country: updateData.country ?? existing.country,
        }
      )
    }

    // ===========================
    // REPORTING AUTHORITY CHANGE
    // ===========================
    if (
      updateData.reportingAuthorityId !== undefined &&
      updateData.reportingAuthorityId !== existing.reportingAuthorityId &&
      updateData.reportingAuthorityId !== null
    ) {
      pushEvent(
        'REPORTING_AUTHORITY_CHANGE',
        { reportingAuthorityId: existing.reportingAuthorityId },
        { reportingAuthorityId: updateData.reportingAuthorityId }
      )
    }

    // ===========================
    // HISTORY TABLE INSERTS
    // ===========================
    if (
      updateData.departmentId !== undefined &&
      updateData.departmentId !== existing.departmentId &&
      updateData.departmentId !== null
    ) {
      await tx.insert(employeeDepartmentHistoryModel).values({
        employeeId,
        departmentId: updateData.departmentId,
        ...historyMeta,
      })
    }

    if (
      updateData.designationId !== undefined &&
      updateData.designationId !== existing.designationId &&
      updateData.designationId !== null
    ) {
      await tx.insert(employeeDesignationHistoryModel).values({
        employeeId,
        designationId: updateData.designationId,
        ...historyMeta,
      })
    }

    if (
      updateData.employmentTypeId !== undefined &&
      updateData.employmentTypeId !== existing.employmentTypeId &&
      updateData.employmentTypeId !== null
    ) {
      await tx.insert(employeeEmploymentTypeHistoryModel).values({
        employeeId,
        employmentTypeId: updateData.employmentTypeId,
        ...historyMeta,
      })
    }

    if (
      updateData.leavePolicyMasterId !== undefined &&
      updateData.leavePolicyMasterId !== existing.leavePolicyMasterId &&
      updateData.leavePolicyMasterId !== null
    ) {
      await tx.insert(employeeLeavePolicyHistoryModel).values({
        employeeId,
        leavePolicyId: updateData.leavePolicyMasterId,
        ...historyMeta,
      })
    }

    if (
      updateData.salaryStructureMasterId !== undefined &&
      updateData.salaryStructureMasterId !== existing.salaryStructureMasterId &&
      updateData.salaryStructureMasterId !== null
    ) {
      await tx.insert(employeeSalaryStructureHistoryModel).values({
        employeeId,
        salaryStructureId: updateData.salaryStructureMasterId,
        ...historyMeta,
      })
    }

    // ===========================
    // UPDATE EMPLOYEE
    // ===========================
    await tx
      .update(employeeModel)
      .set(updateData)
      .where(eq(employeeModel.employeeId, employeeId))

    // ===========================
    // INSERT LIFECYCLE EVENTS
    // ===========================
    if (lifecycleEvents.length > 0) {
      await tx.insert(employeeLifecycleEventsModel).values(lifecycleEvents)
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
      probationMonths: employeeModel.probationMonths,
      companyId: employeeModel.companyId,
      workStationId: employeeModel.workStationId,
      divisionId: employeeModel.divisionId,
      costCenterId: employeeModel.costCenterId,
      reportingAuthorityId: employeeModel.reportingAuthorityId,
      leavePolicyMasterId: employeeModel.leavePolicyMasterId,
      salaryStructureMasterId: employeeModel.salaryStructureMasterId,

      departmentName: departmentModel.departmentName,
      designationName: designationModel.designationName,
      employmentTypeName: employmentTypeModel.employmentTypeName,
      companyName: companyModel.companyName,
      workStationName: workStationModel.workStationName,
      divisionName: divisionModel.divisionName,
      costCenterName: costCenterModel.costCenterName,
      reportingAuthorityName: reportingAuthority.empFullName,
      leavePolicyName: leavePolicyMasterModel.policyName,
      salaryStructureName: salaryStructureMasterModel.structureName,

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
    .leftJoin(
      reportingAuthority,
      eq(employeeModel.reportingAuthorityId, reportingAuthority.employeeId)
    )
    .leftJoin(
      leavePolicyMasterModel,
      eq(
        employeeModel.leavePolicyMasterId,
        leavePolicyMasterModel.leavePolicyMasterId
      )
    )
    .leftJoin(
      salaryStructureMasterModel,
      eq(
        employeeModel.salaryStructureMasterId,
        salaryStructureMasterModel.salaryStructureMasterId
      )
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
      probationMonths: employeeModel.probationMonths,
      companyId: employeeModel.companyId,
      workStationId: employeeModel.workStationId,
      divisionId: employeeModel.divisionId,
      costCenterId: employeeModel.costCenterId,
      reportingAuthorityId: employeeModel.reportingAuthorityId,
      leavePolicyMasterId: employeeModel.leavePolicyMasterId,
      salaryStructureMasterId: employeeModel.salaryStructureMasterId,

      // Names
      departmentName: departmentModel.departmentName,
      designationName: designationModel.designationName,
      employmentTypeName: employmentTypeModel.employmentTypeName,
      companyName: companyModel.companyName,
      workStationName: workStationModel.workStationName,
      divisionName: divisionModel.divisionName,
      costCenterName: costCenterModel.costCenterName,
      leavePolicyName: leavePolicyMasterModel.policyName,
      salaryStructureName: salaryStructureMasterModel.structureName,

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
    .leftJoin(
      reportingAuthority,
      eq(employeeModel.reportingAuthorityId, reportingAuthority.employeeId)
    )
    .leftJoin(
      leavePolicyMasterModel,
      eq(
        employeeModel.leavePolicyMasterId,
        leavePolicyMasterModel.leavePolicyMasterId
      )
    )
    .leftJoin(
      salaryStructureMasterModel,
      eq(
        employeeModel.salaryStructureMasterId,
        salaryStructureMasterModel.salaryStructureMasterId
      )
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
