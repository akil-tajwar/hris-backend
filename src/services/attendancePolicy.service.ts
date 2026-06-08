import { eq } from 'drizzle-orm'
import { db } from '../config/database'
import {
  attendancePoliciesModel,
  attendancePolicyWeekendsModel,
  weekDayModel,
  NewAttendancePolicy,
  NewAttendancePolicyWeekend,
} from '../schemas'
import { redis } from '../middlewares/redis'
import { getCache, setCache } from '../middlewares/cache'

const CACHE_KEY = 'attendance_policies:all'

// CREATE
export const createAttendancePolicy = async (
  data: NewAttendancePolicy & { weekDayIds?: number[] }
) => {
  return await db.transaction(async (tx) => {
    const { weekDayIds, ...policyData } = data

    const result = await tx.insert(attendancePoliciesModel).values(policyData)
    const policyId = Number(result[0].insertId)

    if (weekDayIds && weekDayIds.length > 0) {
      await tx.insert(attendancePolicyWeekendsModel).values(
        weekDayIds.map((weekDayId) => ({
          policyId,
          weekDayId,
          createdBy: policyData.createdBy,
        }))
      )
    }

    await redis.del(CACHE_KEY)

    const policy = await tx.query.attendancePoliciesModel.findFirst({
      where: eq(attendancePoliciesModel.id, policyId),
    })

    return policy
  })
}

// UPDATE
export const updateAttendancePolicy = async (
  id: number,
  data: Partial<NewAttendancePolicy> & { weekDayIds?: number[] }
) => {
  return await db.transaction(async (tx) => {
    const existing = await tx.query.attendancePoliciesModel.findFirst({
      where: eq(attendancePoliciesModel.id, id),
    })

    if (!existing) throw new Error('Attendance policy not found')

    const { weekDayIds, ...policyData } = data

    await tx
      .update(attendancePoliciesModel)
      .set({ ...policyData, updatedAt: new Date() })
      .where(eq(attendancePoliciesModel.id, id))

    if (weekDayIds !== undefined) {
      await tx
        .delete(attendancePolicyWeekendsModel)
        .where(eq(attendancePolicyWeekendsModel.policyId, id))

      if (weekDayIds.length > 0) {
        await tx.insert(attendancePolicyWeekendsModel).values(
          weekDayIds.map((weekDayId) => ({
            policyId: id,
            weekDayId,
            createdBy: policyData.updatedBy ?? 0,
          }))
        )
      }
    }

    await redis.del(CACHE_KEY)

    return await tx.query.attendancePoliciesModel.findFirst({
      where: eq(attendancePoliciesModel.id, id),
    })
  })
}

// GET ALL
export const getAllAttendancePolicies = async () => {
  const cached = await getCache(CACHE_KEY)
  if (cached) {
    console.log('⚡ Redis HIT')
    return cached
  }

  console.log('🐢 MySQL QUERY (CACHE MISS)')

  const policies = await db
    .select({
      id: attendancePoliciesModel.id,
      code: attendancePoliciesModel.code,
      name: attendancePoliciesModel.name,
      graceMinutes: attendancePoliciesModel.graceMinutes,
      lateAfterMinutes: attendancePoliciesModel.lateAfterMinutes,
      halfDayAfterMinutes: attendancePoliciesModel.halfDayAfterMinutes,
      absentAfterMinutes: attendancePoliciesModel.absentAfterMinutes,
      allowOvertime: attendancePoliciesModel.allowOvertime,
      overtimeAfterMinutes: attendancePoliciesModel.overtimeAfterMinutes,
      maxOvertimeMinutes: attendancePoliciesModel.maxOvertimeMinutes,
      allowCompOff: attendancePoliciesModel.allowCompOff,
      isActive: attendancePoliciesModel.isActive,
      createdBy: attendancePoliciesModel.createdBy,
      createdAt: attendancePoliciesModel.createdAt,
      updatedBy: attendancePoliciesModel.updatedBy,
      updatedAt: attendancePoliciesModel.updatedAt,
    })
    .from(attendancePoliciesModel)

  // প্রতিটা policy র weekends আলাদা fetch
  const result = await Promise.all(
    policies.map(async (policy) => {
      const weekends = await db
        .select({
          id: attendancePolicyWeekendsModel.id,
          weekDayId: attendancePolicyWeekendsModel.weekDayId,
          day: weekDayModel.day,
        })
        .from(attendancePolicyWeekendsModel)
        .leftJoin(
          weekDayModel,
          eq(attendancePolicyWeekendsModel.weekDayId, weekDayModel.weekDayId)
        )
        .where(eq(attendancePolicyWeekendsModel.policyId, policy.id))

      return { ...policy, weekends }
    })
  )

  await setCache(CACHE_KEY, result, 300)
  return result
}

// GET BY ID
export const getAttendancePolicyById = async (id: number) => {
  const policy = await db
    .select()
    .from(attendancePoliciesModel)
    .where(eq(attendancePoliciesModel.id, id))
    .limit(1)

  if (!policy || policy.length === 0) return null

  const weekends = await db
    .select({
      id: attendancePolicyWeekendsModel.id,
      weekDayId: attendancePolicyWeekendsModel.weekDayId,
      day: weekDayModel.day,
    })
    .from(attendancePolicyWeekendsModel)
    .leftJoin(
      weekDayModel,
      eq(attendancePolicyWeekendsModel.weekDayId, weekDayModel.weekDayId)
    )
    .where(eq(attendancePolicyWeekendsModel.policyId, id))

  return { ...policy[0], weekends }
}

// DELETE
export const deleteAttendancePolicy = async (id: number) => {
  return await db.transaction(async (tx) => {
    const existing = await tx.query.attendancePoliciesModel.findFirst({
      where: eq(attendancePoliciesModel.id, id),
    })

    if (!existing) throw new Error('Attendance policy not found')

    await tx
      .delete(attendancePolicyWeekendsModel)
      .where(eq(attendancePolicyWeekendsModel.policyId, id))

    await tx
      .delete(attendancePoliciesModel)
      .where(eq(attendancePoliciesModel.id, id))

    await redis.del(CACHE_KEY)

    return {
      message: 'Attendance policy deleted successfully',
      deletedPolicy: existing,
    }
  })
}