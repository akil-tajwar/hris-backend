import { and, eq } from 'drizzle-orm'
import {
  employeeLeaveBalanceModel,
  employeeLeaveEncashmentModel,
  NewEmployeeLeaveEncashment,
} from '../schemas'
import { db } from '../config/database'
import { BadRequestError } from './utils/errors.utils'

export const createEmployeeLeaveEncashment = async (
  data: Omit<NewEmployeeLeaveEncashment, 'createdAt' | 'updatedAt'>
) => {
  return await db.transaction(async (tx) => {
    const [leaveBalance] = await tx
      .select()
      .from(employeeLeaveBalanceModel)
      .where(
        and(
          eq(employeeLeaveBalanceModel.employeeId, data.employeeId),
          eq(employeeLeaveBalanceModel.leaveTypeId, data.leaveTypeId),
          eq(employeeLeaveBalanceModel.year, data.year)
        )
      )
      .limit(1)

    if (!leaveBalance) {
      throw BadRequestError('Leave balance not found')
    }

    if (leaveBalance.remainingDays < data.encashedDays) {
      throw BadRequestError(
        'Encashed days cannot be greater than remaining balance'
      )
    }

    const [encashment] = await tx
      .insert(employeeLeaveEncashmentModel)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId()

    await tx
      .update(employeeLeaveBalanceModel)
      .set({
        remainingDays: leaveBalance.remainingDays - data.encashedDays,
      })
      .where(
        eq(
          employeeLeaveBalanceModel.employeeLeaveBalanceId,
          leaveBalance.employeeLeaveBalanceId
        )
      )

    return encashment
  })
}

export const getAllEmployeeLeaveEncashments = async (tenantId: number) => {
  const encashments = await db
    .select()
    .from(employeeLeaveEncashmentModel)
    .where(eq(employeeLeaveEncashmentModel.tenantId, tenantId))

  if (!encashments.length) {
    throw BadRequestError('No leave encashments found')
  }

  return encashments
}
