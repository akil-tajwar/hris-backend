import { and, eq, InferInsertModel, sql } from 'drizzle-orm'
import { db } from '../config/database'
import {
  employeeModel,
  departmentModel,
  designationModel,
  employmentTypeModel,
  NewEmployee,
  companyModel,
  divisionModel,
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
  employeeLeaveAssignmentModel,
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
  userData: NewUser & { userCompanies?: number[]; createdBy: number }
}) => {
  console.log('🚀 ~ createEmployee ~ input:', input)
  const CACHE_KEY = `employees:all:${input.employeeData.tenantId}`

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

    // 4.1 Create leave assignment
    await tx.insert(employeeLeaveAssignmentModel).values({
      employeeId,
      leavePolicyMasterId: employeeData.leavePolicyMasterId!,
      effectiveFrom: employeeData.doj,
      active: true,
      tenantId: employeeData.tenantId,
      createdBy: employeeData.createdBy,
    })

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

        performedBy: employeeData.createdBy,
        approvedBy: null,

        referenceType: 'EMPLOYEE_CREATION',
        referenceId: employeeId,

        oldValue: null,
        newValue: JSON.stringify({
          employmentType: employmentType.employmentTypeName,
        }),
        tenantId: employeeData.tenantId,
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
export const updateEmployees = async (
  employeesData: Array<
    Partial<NewEmployee> & {
      employeeId: number
      leavePolicyMasterId?: number | null
      salaryStructureMasterId?: number | null
      effectiveFrom?: Date | string
      effectiveTo?: Date | string | null
      changeReason?: string
      approvedBy?: number | null
      createdBy?: number
    }
  >
) => {
  const CACHE_KEY = `employees:all:${employeesData[0].tenantId}`

  return await db.transaction(async (tx) => {
    const results: any[] = []

    for (const data of employeesData) {
      const {
        employeeId,
        leavePolicyMasterId,
        salaryStructureMasterId,
        effectiveFrom,
        effectiveTo,
        changeReason,
        approvedBy,
        tenantId,
        createdBy,
        ...employeeData
      } = data

      const existing = await tx.query.employeeModel.findFirst({
        where: eq(employeeModel.employeeId, employeeId),
      })

      if (!existing) throw new Error(`Employee not found: ${employeeId}`)

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
          typeof effectiveFrom === 'string'
            ? new Date(effectiveFrom)
            : (effectiveFrom ?? new Date()),
        effectiveTo:
          effectiveTo === undefined || effectiveTo === null
            ? null
            : typeof effectiveTo === 'string'
              ? new Date(effectiveTo)
              : effectiveTo,
        changeReason: changeReason ?? null,
        approvedBy: approvedBy ?? null,
        createdBy: createdBy ?? 0,
      }

      // ===========================
      // FK RESOLVER
      // ===========================
      const resolveName = async (field: string, id: any) => {
        if (!id) return null

        switch (field) {
          case 'departmentId': {
            const row = await tx.query.departmentModel.findFirst({
              where: eq(departmentModel.departmentId, id),
            })
            return row?.departmentName ?? null
          }

          case 'designationId': {
            const row = await tx.query.designationModel.findFirst({
              where: eq(designationModel.designationId, id),
            })
            return row?.designationName ?? null
          }

          case 'employmentTypeId': {
            const row = await tx.query.employmentTypeModel.findFirst({
              where: eq(employmentTypeModel.employmentTypeId, id),
            })
            return row?.employmentTypeName ?? null
          }

          case 'leavePolicyMasterId': {
            const row = await tx.query.leavePolicyMasterModel.findFirst({
              where: eq(leavePolicyMasterModel.leavePolicyMasterId, id),
            })
            return row?.policyName ?? null
          }

          case 'salaryStructureMasterId': {
            const row = await tx.query.salaryStructureMasterModel.findFirst({
              where: eq(salaryStructureMasterModel.salaryStructureMasterId, id),
            })
            return row?.structureName ?? null
          }

          case 'reportingAuthorityId': {
            const row = await tx.query.employeeModel.findFirst({
              where: eq(employeeModel.employeeId, id),
            })
            return row?.empFullName ?? null
          }

          default:
            return id
        }
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

      const trackChange = async (field: string, eventType: any) => {
        const oldVal = (existing as any)[field]
        const newVal = (updateData as any)[field]

        if (newVal === undefined || newVal === oldVal) return

        const isFk = fkFields.includes(field)

        if (isFk) {
          const oldName = await resolveName(field, oldVal)
          const newName = await resolveName(field, newVal)

          const cleanKey = field.replace(/Id$/, 'Name')

          pushEvent(eventType, { [cleanKey]: oldName }, { [cleanKey]: newName })
        } else {
          pushEvent(eventType, { [field]: oldVal }, { [field]: newVal })
        }
      }

      // ===========================
      // TRACK CHANGES
      // ===========================
      await trackChange('departmentId', 'DEPARTMENT_CHANGE')
      await trackChange('designationId', 'DESIGNATION_CHANGE')
      await trackChange('employmentTypeId', 'EMPLOYMENT_TYPE_CHANGE')
      await trackChange('leavePolicyMasterId', 'LEAVE_POLICY_CHANGE')
      await trackChange('salaryStructureMasterId', 'SALARY_STRUCTURE_CHANGE')
      await trackChange('basicSalary', 'SALARY_REVISION')

      const historyInserts: Promise<any>[] = []

      if (
        updateData.departmentId !== undefined &&
        updateData.departmentId !== existing.departmentId
      ) {
        historyInserts.push(
          tx.insert(employeeDepartmentHistoryModel).values({
            employeeId,
            departmentId: updateData.departmentId,
            effectiveFrom: historyMeta.effectiveFrom,
            effectiveTo: historyMeta.effectiveTo,
            changeReason: historyMeta.changeReason,
            approvedBy: historyMeta.approvedBy,
            createdBy: historyMeta.createdBy,
          })
        )
      }

      if (
        updateData.designationId !== undefined &&
        updateData.designationId !== existing.designationId
      ) {
        historyInserts.push(
          tx.insert(employeeDesignationHistoryModel).values({
            employeeId,
            designationId: updateData.designationId,
            effectiveFrom: historyMeta.effectiveFrom,
            effectiveTo: historyMeta.effectiveTo,
            changeReason: historyMeta.changeReason,
            approvedBy: historyMeta.approvedBy,
            createdBy: historyMeta.createdBy,
          })
        )
      }

      if (
        updateData.employmentTypeId !== undefined &&
        updateData.employmentTypeId !== existing.employmentTypeId
      ) {
        historyInserts.push(
          tx.insert(employeeEmploymentTypeHistoryModel).values({
            employeeId,
            employmentTypeId: updateData.employmentTypeId,
            effectiveFrom: historyMeta.effectiveFrom,
            effectiveTo: historyMeta.effectiveTo,
            changeReason: historyMeta.changeReason,
            approvedBy: historyMeta.approvedBy,
            createdBy: historyMeta.createdBy,
          })
        )
      }

      if (
        updateData.leavePolicyMasterId !== undefined &&
        updateData.leavePolicyMasterId !== existing.leavePolicyMasterId
      ) {
        historyInserts.push(
          tx.insert(employeeLeavePolicyHistoryModel).values({
            employeeId,
            leavePolicyId: updateData.leavePolicyMasterId,
            effectiveFrom: historyMeta.effectiveFrom,
            effectiveTo: historyMeta.effectiveTo,
            changeReason: historyMeta.changeReason,
            approvedBy: historyMeta.approvedBy,
            createdBy: historyMeta.createdBy,
          })
        )
      }

      if (
        updateData.salaryStructureMasterId !== undefined &&
        updateData.salaryStructureMasterId !== existing.salaryStructureMasterId
      ) {
        historyInserts.push(
          tx.insert(employeeSalaryStructureHistoryModel).values({
            employeeId,
            salaryStructureMasterId: updateData.salaryStructureMasterId,
            effectiveFrom: historyMeta.effectiveFrom,
            effectiveTo: historyMeta.effectiveTo,
            changeReason: historyMeta.changeReason,
            approvedBy: historyMeta.approvedBy,
            createdBy: historyMeta.createdBy,
          })
        )
      }

      if (historyInserts.length > 0) {
        await Promise.all(historyInserts)
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

      const updatedEmployee = await tx.query.employeeModel.findFirst({
        where: eq(employeeModel.employeeId, employeeId),
      })

      results.push(updatedEmployee)
    }

    await redis.del(CACHE_KEY)

    return results
  })
}

//GET ALL EMPLOYEES
export const getAllEmployees = async (tenantId: number) => {
  const CACHE_KEY = `employees:all:${tenantId}`

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
      divisionId: employeeModel.divisionId,
      reportingAuthorityId: employeeModel.reportingAuthorityId,
      leavePolicyMasterId: employeeModel.leavePolicyMasterId,
      salaryStructureMasterId: employeeModel.salaryStructureMasterId,

      departmentName: departmentModel.departmentName,
      designationName: designationModel.designationName,
      employmentTypeName: employmentTypeModel.employmentTypeName,
      companyName: companyModel.companyName,
      divisionName: divisionModel.divisionName,
      reportingAuthorityName: reportingAuthority.empFullName,
      leavePolicyName: leavePolicyMasterModel.policyName,
      salaryStructureName: salaryStructureMasterModel.structureName,

      createdBy: employeeModel.createdBy,
      createdAt: employeeModel.createdAt,
      updatedBy: employeeModel.updatedBy,
      updatedAt: employeeModel.updatedAt,
    })
    .from(employeeModel)
    .where(eq(employeeModel.tenantId, tenantId))
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
      divisionModel,
      eq(employeeModel.divisionId, divisionModel.divisionId)
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

//GET EMPLOYEE BY ID
export const getEmployeeById = async (employeeId: number, tenantId: number) => {
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
      divisionId: employeeModel.divisionId,
      reportingAuthorityId: employeeModel.reportingAuthorityId,
      leavePolicyMasterId: employeeModel.leavePolicyMasterId,
      salaryStructureMasterId: employeeModel.salaryStructureMasterId,

      // Names
      departmentName: departmentModel.departmentName,
      designationName: designationModel.designationName,
      employmentTypeName: employmentTypeModel.employmentTypeName,
      companyName: companyModel.companyName,
      divisionName: divisionModel.divisionName,
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
    .where(
      and(
        eq(employeeModel.employeeId, employeeId),
        eq(employeeModel.tenantId, tenantId)
      )
    )
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
      divisionModel,
      eq(employeeModel.divisionId, divisionModel.divisionId)
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
export const deleteEmployee = async (employeeId: number, tenantId: number) => {
  return await db.transaction(async (tx) => {
    const existing = await tx.query.employeeModel.findFirst({
      where: and(
        eq(employeeModel.employeeId, employeeId),
        eq(employeeModel.tenantId, tenantId)
      ),
    })

    if (!existing) {
      throw new Error('Employee not found')
    }

    await tx
      .delete(employeeModel)
      .where(
        and(
          eq(employeeModel.employeeId, employeeId),
          eq(employeeModel.tenantId, tenantId)
        )
      )

    return {
      message: 'Employee deleted successfully',
      deletedEmployee: existing,
    }
  })
}

export const getEmployeeIdByUserIdService = async (
  userId: number,
  tenantId: number
) => {
  const result = await db
    .select({
      employeeId: employeeModel.employeeId,
    })
    .from(employeeModel)
    .where(
      and(
        eq(employeeModel.userId, userId),
        eq(employeeModel.tenantId, tenantId)
      )
    )
    .limit(1)

  if (!result.length) {
    throw new Error('Employee not found for this userId')
  }

  return result[0].employeeId
}
