// employee-leave-assignment.service.ts

import { db } from '../config/database'
import {
  departmentModel,
  designationModel,
  employeeLeaveAssignmentModel,
  employeeLeaveBalanceModel,
  employeeModel,
  leavePolicyDetailsModel,
  leavePolicyMasterModel,
  leaveTypeModel,
  NewEmployee,
  NewEmployeeLeaveAssignment,
} from '../schemas'
import { eq, sql } from 'drizzle-orm'

const toDate = (value: Date | string) => new Date(value)

function calculateAllocatedLeaves(
  maxDaysPerYear: number,
  doj: Date,
  effectiveFrom: Date
): number {
  const startDate = doj > effectiveFrom ? doj : effectiveFrom
  const remainingMonths = 12 - startDate.getMonth()

  return Math.round((maxDaysPerYear / 12) * remainingMonths)
}

export const createEmployeeLeaveAssignmentService = async (
  data: NewEmployeeLeaveAssignment
) => {
  return await db.transaction(async (tx) => {
    // Create assignment
    const [assignment] = await tx
      .insert(employeeLeaveAssignmentModel)
      .values({
        employeeId: data.employeeId,
        leavePolicyMasterId: data.leavePolicyMasterId,
        effectiveFrom: toDate(data.effectiveFrom),
        effectiveTo: data.effectiveTo ? toDate(data.effectiveTo) : null,
        active: data.active,
        createdBy: data.createdBy,
      })
      .$returningId()

    // Get employee
    const [employee] = await tx
      .select({
        doj: employeeModel.doj,
      })
      .from(employeeModel)
      .where(eq(employeeModel.employeeId, data.employeeId))

    if (!employee) {
      throw new Error('Employee not found')
    }

    const doj = new Date(employee.doj)
    const effectiveFrom = new Date(data.effectiveFrom)

    // Get policy details + leave type
    const policyDetails = await tx
      .select({
        leaveTypeId: leavePolicyDetailsModel.leaveTypeId,
        maxDaysPerYear: leaveTypeModel.maxDaysPerYear,
      })
      .from(leavePolicyDetailsModel)
      .innerJoin(
        leaveTypeModel,
        eq(leavePolicyDetailsModel.leaveTypeId, leaveTypeModel.leaveTypeId)
      )
      .where(
        eq(
          leavePolicyDetailsModel.leavePolicyMasterId,
          data.leavePolicyMasterId
        )
      )

    if (policyDetails.length === 0) {
      throw new Error('No leave policy details found')
    }

    const balanceRows = policyDetails.map((detail) => {
      const earnedDays = calculateAllocatedLeaves(
        detail.maxDaysPerYear,
        doj,
        effectiveFrom
      )

      return {
        employeeId: data.employeeId,
        leaveTypeId: detail.leaveTypeId,
        year: effectiveFrom.getFullYear(),
        earnedDays,
        usedDays: 0,
      }
    })

    await tx.insert(employeeLeaveBalanceModel).values(balanceRows)

    return {
      success: true,
      assignmentId: assignment.employeeLeaveAssignmentId,
    }
  })
}

export const updateEmployeeLeaveAssignmentService = async (
  id: number,
  data: Partial<{
    employeeId: number
    leavePolicyMasterId: number
    effectiveFrom: Date | string
    effectiveTo: Date | string | null
    active: boolean
    updatedBy: number
  }>
) => {
  try {
    const toDate = (v: Date | string) => new Date(v)

    await db
      .update(employeeLeaveAssignmentModel)
      .set({
        ...(data.employeeId !== undefined && {
          employeeId: data.employeeId,
        }),
        ...(data.leavePolicyMasterId !== undefined && {
          leavePolicyMasterId: data.leavePolicyMasterId,
        }),
        ...(data.effectiveFrom !== undefined && {
          effectiveFrom: toDate(data.effectiveFrom),
        }),
        ...(data.effectiveTo !== undefined && {
          effectiveTo: data.effectiveTo ? toDate(data.effectiveTo) : null,
        }),
        ...(data.active !== undefined && {
          active: data.active,
        }),
        ...(data.updatedBy !== undefined && {
          updatedBy: data.updatedBy,
        }),
        updatedAt: new Date(),
      })
      .where(
        sql`${employeeLeaveAssignmentModel.employeeLeaveAssignmentId} = ${id}`
      )

    return {
      success: true,
      message: 'Updated successfully',
    }
  } catch (error) {
    console.error('Update Error:', error)
    throw new Error('Failed to update employee leave assignment')
  }
}

export const getAllEmployeeLeaveAssignmentsService = async () => {
  try {
    const result = await db
      .select({
        employeeLeaveAssignmentId:
          employeeLeaveAssignmentModel.employeeLeaveAssignmentId,
        employeeId: employeeLeaveAssignmentModel.employeeId,
        leavePolicyMasterId: employeeLeaveAssignmentModel.leavePolicyMasterId,
        effectiveFrom: employeeLeaveAssignmentModel.effectiveFrom,
        effectiveTo: employeeLeaveAssignmentModel.effectiveTo,
        active: employeeLeaveAssignmentModel.active,
        createdBy: employeeLeaveAssignmentModel.createdBy,
        createdAt: employeeLeaveAssignmentModel.createdAt,
        updatedBy: employeeLeaveAssignmentModel.updatedBy,
        updatedAt: employeeLeaveAssignmentModel.updatedAt,

        // employee info
        empCode: employeeModel.empCode,
        employeeName: employeeModel.empFullName,

        // designation + department
        designationName: designationModel.designationName,
        departmentName: departmentModel.departmentName,

        // leave policy
        policyName: leavePolicyMasterModel.policyName,
      })
      .from(employeeLeaveAssignmentModel)

      // employee join
      .leftJoin(
        employeeModel,
        eq(employeeLeaveAssignmentModel.employeeId, employeeModel.employeeId)
      )

      // designation join
      .leftJoin(
        designationModel,
        eq(employeeModel.designationId, designationModel.designationId)
      )

      // department join
      .leftJoin(
        departmentModel,
        eq(employeeModel.departmentId, departmentModel.departmentId)
      )

      // leave policy join
      .leftJoin(
        leavePolicyMasterModel,
        eq(
          employeeLeaveAssignmentModel.leavePolicyMasterId,
          leavePolicyMasterModel.leavePolicyMasterId
        )
      )

    return result
  } catch (error) {
    console.error('Fetch Leave Assignments Error:', error)
    throw new Error('Failed to fetch employee leave assignments')
  }
}

export const getEmployeeLeaveAssignmentByIdService = async (id: number) => {
  try {
    const result = await db
      .select()
      .from(employeeLeaveAssignmentModel)
      .where(
        sql`${employeeLeaveAssignmentModel.employeeLeaveAssignmentId} = ${id}`
      )

    return result[0] || null
  } catch (error) {
    console.error(error)
    throw new Error('Failed to fetch employee leave assignment')
  }
}

export const deleteEmployeeLeaveAssignmentService = async (id: number) => {
  try {
    await db
      .delete(employeeLeaveAssignmentModel)
      .where(
        sql`${employeeLeaveAssignmentModel.employeeLeaveAssignmentId} = ${id}`
      )

    return true
  } catch (error) {
    console.error(error)
    throw new Error('Failed to delete employee leave assignment')
  }
}
