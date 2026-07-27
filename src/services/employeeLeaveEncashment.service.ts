import { and, eq } from 'drizzle-orm'
import {
  departmentModel,
  designationModel,
  employeeLeaveBalanceModel,
  employeeLeaveEncashmentModel,
  employeeModel,
  leaveTypeModel,
  NewEmployeeLeaveEncashment,
} from '../schemas'
import { db } from '../config/database'
import { BadRequestError } from './utils/errors.utils'

export const createEmployeeLeaveEncashment = async (
  data: Omit<NewEmployeeLeaveEncashment, 'createdAt' | 'updatedAt'>[]
) => {
  return await db.transaction(async (tx) => {
    const createdEncashments = []
    
    for (const item of data) {
      console.log({
        employeeId: item.employeeId,
        leaveTypeId: item.leaveTypeId,
        year: item.year,
      })
      const [leaveBalance] = await tx
        .select()
        .from(employeeLeaveBalanceModel)
        .where(
          and(
            eq(employeeLeaveBalanceModel.employeeId, item.employeeId),
            eq(employeeLeaveBalanceModel.leaveTypeId, item.leaveTypeId),
            eq(employeeLeaveBalanceModel.year, item.year)
          )
        )
        .limit(1)

      if (!leaveBalance) {
        throw BadRequestError(
          `Leave balance not found for employee ${item.employeeId}`
        )
      }

      if (leaveBalance.remainingDays < item.encashedDays) {
        throw BadRequestError(
          `Employee ${item.employeeId}: Encashed days cannot be greater than remaining balance`
        )
      }

      const [encashment] = await tx
        .insert(employeeLeaveEncashmentModel)
        .values({
          ...item,
          processedDate: new Date(item.processedDate ?? Date.now()),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .$returningId()

      await tx
        .update(employeeLeaveBalanceModel)
        .set({
          remainingDays: leaveBalance.remainingDays - item.encashedDays,
          usedDays: leaveBalance.usedDays + item.encashedDays,
        })
        .where(
          eq(
            employeeLeaveBalanceModel.employeeLeaveBalanceId,
            leaveBalance.employeeLeaveBalanceId
          )
        )

      createdEncashments.push(encashment)
    }

    return createdEncashments
  })
}

export const getAllEmployeeLeaveEncashments = async (tenantId: number) => {
  const encashments = await db
    .select({
      employeeLeaveEncashmentId: employeeLeaveEncashmentModel.employeeLeaveEncashmentId,
      employeeId: employeeLeaveEncashmentModel.employeeId,
      leaveTypeId: employeeLeaveEncashmentModel.leaveTypeId,
      year: employeeLeaveEncashmentModel.year,
      encashedDays: employeeLeaveEncashmentModel.encashedDays,
      amount: employeeLeaveEncashmentModel.amount,
      processedDate: employeeLeaveEncashmentModel.processedDate,
      tenantId: employeeLeaveEncashmentModel.tenantId,
      createdBy: employeeLeaveEncashmentModel.createdBy,
      createdAt: employeeLeaveEncashmentModel.createdAt,
      updatedBy: employeeLeaveEncashmentModel.updatedBy,
      updatedAt: employeeLeaveEncashmentModel.updatedAt,
      // joined display-only fields
      empCode: employeeModel.empCode,
      empFullName: employeeModel.empFullName,
      empDepartment: departmentModel.departmentName,
      empDesignation: designationModel.designationName,
      leaveTypeName: leaveTypeModel.name,
    })
    .from(employeeLeaveEncashmentModel)
    .leftJoin(
      employeeModel,
      eq(employeeLeaveEncashmentModel.employeeId, employeeModel.employeeId)
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
      leaveTypeModel,
      eq(employeeLeaveEncashmentModel.leaveTypeId, leaveTypeModel.leaveTypeId)
    )
    .where(eq(employeeLeaveEncashmentModel.tenantId, tenantId))

  if (!encashments.length) {
    throw BadRequestError('No leave encashments found')
  }

  return encashments
}
