import { db } from '../config/database'
import { companyModel, leaveTypeModel, NewLeaveType } from '../schemas'
import { eq, inArray } from 'drizzle-orm'

// CREATE
export const createLeaveType = async (data: NewLeaveType | NewLeaveType[]) => {
  // normalize to array
  const values = Array.isArray(data) ? data : [data]

  const result = await db.insert(leaveTypeModel).values(values)

  const lastId = Number(result[0].insertId)
  const firstId = lastId - values.length + 1

  return await db
    .select()
    .from(leaveTypeModel)
    .where(
      inArray(
        leaveTypeModel.leaveTypeId,
        Array.from({ length: values.length }, (_, i) => firstId + i)
      )
    )
}

// READ ALL
export const getLeaveTypes = async (tenantId: number) => {
  return await db
    .select({
      leaveTypeId: leaveTypeModel.leaveTypeId,
      companyId: leaveTypeModel.companyId,
      companyName: companyModel.companyName,
      code: leaveTypeModel.code,
      name: leaveTypeModel.name,
      category: leaveTypeModel.category,
      genderApplicable: leaveTypeModel.genderApplicable,
      religionApplicable: leaveTypeModel.religionApplicable,
      maritalStatusApplicable: leaveTypeModel.maritalStatusApplicable,
      maxDaysPerYear: leaveTypeModel.maxDaysPerYear,
      maxDaysPerRequest: leaveTypeModel.maxDaysPerRequest,
      minDaysPerRequest: leaveTypeModel.minDaysPerRequest,
      allowHalfDay: leaveTypeModel.allowHalfDay,
      allowHourly: leaveTypeModel.allowHourly,
      attachmentRequired: leaveTypeModel.attachmentRequired,
      attachmentAfterDays: leaveTypeModel.attachmentAfterDays,
      carryForwardAllowed: leaveTypeModel.carryForwardAllowed,
      maxCarryForwardDays: leaveTypeModel.maxCarryForwardDays,
      encashmentAllowed: leaveTypeModel.encashmentAllowed,
      negativeBalanceAllowed: leaveTypeModel.negativeBalanceAllowed,
      sandwichPolicyApplicable: leaveTypeModel.sandwichPolicyApplicable,
      probationAllowed: leaveTypeModel.probationAllowed,
      noticePeriodAllowed: leaveTypeModel.noticePeriodAllowed,
      active: leaveTypeModel.active,
      createdAt: leaveTypeModel.createdAt,
      updatedAt: leaveTypeModel.updatedAt,
    })
    .from(leaveTypeModel)
    .where(eq(leaveTypeModel.tenantId, tenantId))
    .leftJoin(
      companyModel,
      eq(leaveTypeModel.companyId, companyModel.companyId)
    )
}

// UPDATE
export const updateLeaveType = async (
  leaveTypeId: number,
  data: Partial<NewLeaveType>
) => {
  await db
    .update(leaveTypeModel)
    .set(data)
    .where(eq(leaveTypeModel.leaveTypeId, leaveTypeId))

  const [updated] = await db
    .select()
    .from(leaveTypeModel)
    .where(eq(leaveTypeModel.leaveTypeId, leaveTypeId))

  return updated
}

// DELETE
export const deleteLeaveType = async (leaveTypeId: number) => {
  await db
    .delete(leaveTypeModel)
    .where(eq(leaveTypeModel.leaveTypeId, leaveTypeId))
}
