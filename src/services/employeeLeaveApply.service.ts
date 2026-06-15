import { db } from '../config/database'
import {
  employeeLeaveApplyModel,
  employeeModel,
  leavePolicyMasterModel,
  leavePolicyDetailsModel,
  NewEmployeeLeaveApply,
  EmployeeLeaveApply,
} from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createEmployeeLeaveApply = async (
  data: NewEmployeeLeaveApply
) => {
  const result = await db.insert(employeeLeaveApplyModel).values(data)

  const employeeLeaveApplyId = Number(result[0].insertId)

  const [leaveApply] = await db
    .select()
    .from(employeeLeaveApplyModel)
    .where(
      eq(
        employeeLeaveApplyModel.employeeLeaveApplyId,
        employeeLeaveApplyId
      )
    )

  return leaveApply
}

// READ ALL
export const getEmployeeLeaveApplications = async () => {
  return await db
    .select({
      employeeLeaveApplyId:
        employeeLeaveApplyModel.employeeLeaveApplyId,

      employeeId: employeeLeaveApplyModel.employeeId,
      employeeName: employeeModel.empFullName,
      empCode: employeeModel.empCode,

      leavePolicyMasterId:
        employeeLeaveApplyModel.leavePolicyMasterId,
      policyName: leavePolicyMasterModel.policyName,

      leavePolicyDetailsId:
        employeeLeaveApplyModel.leavePolicyDetailsId,
      yearlyAllocation:
        leavePolicyDetailsModel.yearlyAllocation,
      accrualFrequency:
        leavePolicyDetailsModel.accrualFrequency,

      effectiveFrom:
        employeeLeaveApplyModel.effectiveFrom,
      effectiveTo:
        employeeLeaveApplyModel.effectiveTo,

      approvedByRepAuth:
        employeeLeaveApplyModel.approvedByRepAuth,
      approvedByHr:
        employeeLeaveApplyModel.approvedByHr,

      createdBy:
        employeeLeaveApplyModel.createdBy,
      createdAt:
        employeeLeaveApplyModel.createdAt,

      updatedBy:
        employeeLeaveApplyModel.updatedBy,
      updatedAt:
        employeeLeaveApplyModel.updatedAt,
    })
    .from(employeeLeaveApplyModel)
    .leftJoin(
      employeeModel,
      eq(
        employeeLeaveApplyModel.employeeId,
        employeeModel.employeeId
      )
    )
    .leftJoin(
      leavePolicyMasterModel,
      eq(
        employeeLeaveApplyModel.leavePolicyMasterId,
        leavePolicyMasterModel.leavePolicyMasterId
      )
    )
    .leftJoin(
      leavePolicyDetailsModel,
      eq(
        employeeLeaveApplyModel.leavePolicyDetailsId,
        leavePolicyDetailsModel.leavePolicyDetailsId
      )
    )
}

// UPDATE
export const updateEmployeeLeaveApply = async (
  employeeLeaveApplyId: number,
  data: EmployeeLeaveApply
) => {
  await db
    .update(employeeLeaveApplyModel)
    .set(data)
    .where(
      eq(
        employeeLeaveApplyModel.employeeLeaveApplyId,
        employeeLeaveApplyId
      )
    )

  const [updated] = await db
    .select()
    .from(employeeLeaveApplyModel)
    .where(
      eq(
        employeeLeaveApplyModel.employeeLeaveApplyId,
        employeeLeaveApplyId
      )
    )

  return updated
}

// APPROVE BY REPORTING AUTHORITY
export const approveLeaveByRepAuth = async (
  employeeLeaveApplyId: number,
  updatedBy: number
) => {
  await db
    .update(employeeLeaveApplyModel)
    .set({
      approvedByRepAuth: true,
      updatedBy,
    })
    .where(
      eq(
        employeeLeaveApplyModel.employeeLeaveApplyId,
        employeeLeaveApplyId
      )
    )

  const [updated] = await db
    .select()
    .from(employeeLeaveApplyModel)
    .where(
      eq(
        employeeLeaveApplyModel.employeeLeaveApplyId,
        employeeLeaveApplyId
      )
    )

  return updated
}

// APPROVE BY HR
export const approveLeaveByHr = async (
  employeeLeaveApplyId: number,
  updatedBy: number
) => {
  await db
    .update(employeeLeaveApplyModel)
    .set({
      approvedByHr: true,
      updatedBy,
    })
    .where(
      eq(
        employeeLeaveApplyModel.employeeLeaveApplyId,
        employeeLeaveApplyId
      )
    )

  const [updated] = await db
    .select()
    .from(employeeLeaveApplyModel)
    .where(
      eq(
        employeeLeaveApplyModel.employeeLeaveApplyId,
        employeeLeaveApplyId
      )
    )

  return updated
}

// DELETE
export const deleteEmployeeLeaveApply = async (
  employeeLeaveApplyId: number
) => {
  await db
    .delete(employeeLeaveApplyModel)
    .where(
      eq(
        employeeLeaveApplyModel.employeeLeaveApplyId,
        employeeLeaveApplyId
      )
    )
}