import { eq } from 'drizzle-orm'
import { db } from '../config/database'
import {
  companyModel,
  shiftDayAndWeekDaysModel,
  shiftModel,
  weekDayModel,
} from '../schemas'

/* =========================
   CREATE SHIFT
========================= */

export const createShift = async (data: any) => {
  return await db.transaction(async (tx) => {
    // 1️⃣ INSERT SHIFT
    const result = await tx.insert(shiftModel).values({
      companyId: data.shift.companyId,
      shiftName: data.shift.shiftName,
      shiftCode: data.shift.shiftCode,
      shiftType: data.shift.shiftType,
      startTime: data.shift.startTime,
      endTime: data.shift.endTime,
      breakMinutes: data.shift.breakMinutes,
      expectedWorkHours: data.shift.expectedWorkHours,
      crossDay: data.shift.crossDay ?? false,
      isFlexible: data.shift.isFlexible ?? false,
      flexibleInFrom: data.shift.flexibleInFrom || null,
      flexibleInTo: data.shift.flexibleInTo || null,
      minimumHoursForPresent: data.shift.minimumHoursForPresent,
      status: data.shift.status ?? true,
      createdBy: data.shift.createdBy,
    })

    const shiftId = Number((result as any).insertId ?? result[0]?.insertId)

    if (!shiftId) {
      throw new Error('Shift insert failed: no insertId returned')
    }

    // 2️⃣ CLEAN & INSERT SHIFT DAY CONFIGS
    const configs = (data.shiftDayAndWeekDays || []).map((item: any) => ({
      shiftId,
      weekDayId: item.weekDayId,
      dayType: item.dayType,

      startTime:
        item.dayType === 'Weekend'
          ? '00:00'
          : (item.startTime ?? data.shift.startTime),

      endTime:
        item.dayType === 'Weekend'
          ? '00:00'
          : (item.endTime ?? data.shift.endTime),

      breakMinutes:
        item.dayType === 'Weekend'
          ? 0
          : (item.breakMinutes ?? data.shift.breakMinutes),

      expectedWorkHours:
        item.dayType === 'Weekend'
          ? 0
          : (item.expectedWorkHours ?? data.shift.expectedWorkHours),

      minimumHoursForPresent:
        item.dayType === 'Weekend'
          ? 0
          : (item.minimumHoursForPresent ?? data.shift.minimumHoursForPresent),

      createdBy: data.shift.createdBy,
    }))

    if (configs.length > 0) {
      await tx.insert(shiftDayAndWeekDaysModel).values(configs)
    }

    return { shiftId }
  })
}

/* =========================
   UPDATE SHIFT
========================= */

export const updateShift = async (shiftId: number, data: any) => {
  return await db.transaction(async (tx) => {
    // 1️⃣ UPDATE SHIFT
    await tx
      .update(shiftModel)
      .set({
        companyId: data.shift.companyId,
        shiftName: data.shift.shiftName,
        shiftCode: data.shift.shiftCode,
        shiftType: data.shift.shiftType,
        startTime: data.shift.startTime,
        endTime: data.shift.endTime,
        breakMinutes: data.shift.breakMinutes,
        expectedWorkHours: data.shift.expectedWorkHours,
        crossDay: data.shift.crossDay ?? false,
        isFlexible: data.shift.isFlexible ?? false,
        flexibleInFrom: data.shift.flexibleInFrom || null,
        flexibleInTo: data.shift.flexibleInTo || null,
        minimumHoursForPresent: data.shift.minimumHoursForPresent,
        status: data.shift.status ?? true,
        updatedBy: data.shift.updatedBy,
      })
      .where(eq(shiftModel.shiftId, shiftId))

    // 2️⃣ DELETE OLD CONFIGS
    await tx
      .delete(shiftDayAndWeekDaysModel)
      .where(eq(shiftDayAndWeekDaysModel.shiftId, shiftId))

    // 3️⃣ INSERT NEW CONFIGS
    const configs = (data.shiftDayAndWeekDays || []).map((item: any) => ({
      shiftId,
      weekDayId: item.weekDayId,
      dayType: item.dayType,

      startTime:
        item.dayType === 'Weekend'
          ? '00:00'
          : (item.startTime ?? data.shift.startTime),

      endTime:
        item.dayType === 'Weekend'
          ? '00:00'
          : (item.endTime ?? data.shift.endTime),

      breakMinutes:
        item.dayType === 'Weekend'
          ? 0
          : (item.breakMinutes ?? data.shift.breakMinutes),

      expectedWorkHours:
        item.dayType === 'Weekend'
          ? 0
          : (item.expectedWorkHours ?? data.shift.expectedWorkHours),

      minimumHoursForPresent:
        item.dayType === 'Weekend'
          ? 0
          : (item.minimumHoursForPresent ?? data.shift.minimumHoursForPresent),

      createdBy: data.shift.updatedBy,
    }))

    if (configs.length > 0) {
      await tx.insert(shiftDayAndWeekDaysModel).values(configs)
    }

    return true
  })
}

/* =========================
   GET ALL
========================= */

export const getAllShift = async () => {
  const rows = await db
    .select({
      shiftId: shiftModel.shiftId,
      companyId: shiftModel.companyId,
      companyName: companyModel.companyName,
      shiftName: shiftModel.shiftName,
      shiftCode: shiftModel.shiftCode,
      shiftType: shiftModel.shiftType,
      startTime: shiftModel.startTime,
      endTime: shiftModel.endTime,
      breakMinutes: shiftModel.breakMinutes,
      expectedWorkHours: shiftModel.expectedWorkHours,
      crossDay: shiftModel.crossDay,
      isFlexible: shiftModel.isFlexible,
      flexibleInFrom: shiftModel.flexibleInFrom,
      flexibleInTo: shiftModel.flexibleInTo,
      minimumHoursForPresent: shiftModel.minimumHoursForPresent,
      status: shiftModel.status,
      shiftDayAndWeekDaysId: shiftDayAndWeekDaysModel.shiftDayAndWeekDaysId,
      weekDayId: shiftDayAndWeekDaysModel.weekDayId,
      dayType: shiftDayAndWeekDaysModel.dayType,
      configStartTime: shiftDayAndWeekDaysModel.startTime,
      configEndTime: shiftDayAndWeekDaysModel.endTime,
      configBreakMinutes: shiftDayAndWeekDaysModel.breakMinutes,
      configExpectedWorkHours: shiftDayAndWeekDaysModel.expectedWorkHours,
      configMinimumHoursForPresent:
        shiftDayAndWeekDaysModel.minimumHoursForPresent,
      weekDay: weekDayModel.day,
    })
    .from(shiftModel)
    .leftJoin(companyModel, eq(shiftModel.companyId, companyModel.companyId))
    .leftJoin(
      shiftDayAndWeekDaysModel,
      eq(shiftModel.shiftId, shiftDayAndWeekDaysModel.shiftId)
    )
    .leftJoin(
      weekDayModel,
      eq(shiftDayAndWeekDaysModel.weekDayId, weekDayModel.weekDayId)
    )

  const map = new Map<number, any>()

  for (const r of rows) {
    if (!map.has(r.shiftId)) {
      map.set(r.shiftId, {
        shift: {
          shiftId: r.shiftId,
          companyId: r.companyId,
          companyName: r.companyName,
          shiftName: r.shiftName,
          shiftCode: r.shiftCode,
          shiftType: r.shiftType,
          startTime: r.startTime,
          endTime: r.endTime,
          breakMinutes: r.breakMinutes,
          expectedWorkHours: r.expectedWorkHours,
          crossDay: r.crossDay,
          isFlexible: r.isFlexible,
          flexibleInFrom: r.flexibleInFrom,
          flexibleInTo: r.flexibleInTo,
          minimumHoursForPresent: r.minimumHoursForPresent,
          status: r.status,
        },
        shiftDayConfigs: [],
      })
    }

    if (r.shiftDayAndWeekDaysId) {
      map.get(r.shiftId).shiftDayConfigs.push({
        weekDayId: r.weekDayId,
        weekDay: r.weekDay,
        dayType: r.dayType,
        startTime: r.configStartTime,
        endTime: r.configEndTime,
        breakMinutes: r.configBreakMinutes,
        expectedWorkHours: r.configExpectedWorkHours,
        minimumHoursForPresent: r.configMinimumHoursForPresent,
      })
    }
  }

  return Array.from(map.values())
}

export const getShiftById = async (shiftId: number) => {
  const rows = await db
    .select({
      shiftId: shiftModel.shiftId,
      companyId: shiftModel.companyId,
      companyName: companyModel.companyName,
      shiftName: shiftModel.shiftName,
      shiftCode: shiftModel.shiftCode,
      shiftType: shiftModel.shiftType,
      startTime: shiftModel.startTime,
      endTime: shiftModel.endTime,
      breakMinutes: shiftModel.breakMinutes,
      expectedWorkHours: shiftModel.expectedWorkHours,
      crossDay: shiftModel.crossDay,
      isFlexible: shiftModel.isFlexible,
      flexibleInFrom: shiftModel.flexibleInFrom,
      flexibleInTo: shiftModel.flexibleInTo,
      minimumHoursForPresent: shiftModel.minimumHoursForPresent,
      status: shiftModel.status,
      shiftDayAndWeekDaysId: shiftDayAndWeekDaysModel.shiftDayAndWeekDaysId,
      weekDayId: shiftDayAndWeekDaysModel.weekDayId,
      dayType: shiftDayAndWeekDaysModel.dayType,
      configStartTime: shiftDayAndWeekDaysModel.startTime,
      configEndTime: shiftDayAndWeekDaysModel.endTime,
      configBreakMinutes: shiftDayAndWeekDaysModel.breakMinutes,
      configExpectedWorkHours: shiftDayAndWeekDaysModel.expectedWorkHours,
      configMinimumHoursForPresent:
        shiftDayAndWeekDaysModel.minimumHoursForPresent,
      weekDay: weekDayModel.day,
    })
    .from(shiftModel)
    .leftJoin(companyModel, eq(shiftModel.companyId, companyModel.companyId))
    .leftJoin(
      shiftDayAndWeekDaysModel,
      eq(shiftModel.shiftId, shiftDayAndWeekDaysModel.shiftId)
    )
    .leftJoin(
      weekDayModel,
      eq(shiftDayAndWeekDaysModel.weekDayId, weekDayModel.weekDayId)
    )
    .where(eq(shiftModel.shiftId, shiftId))

  if (!rows.length) return null

  const first = rows[0]

  const shift = {
    shiftId: first.shiftId,
    companyId: first.companyId,
    companyName: first.companyName,
    shiftName: first.shiftName,
    shiftCode: first.shiftCode,
    shiftType: first.shiftType,
    startTime: first.startTime,
    endTime: first.endTime,
    breakMinutes: first.breakMinutes,
    expectedWorkHours: first.expectedWorkHours,
    crossDay: first.crossDay,
    isFlexible: first.isFlexible,
    flexibleInFrom: first.flexibleInFrom,
    flexibleInTo: first.flexibleInTo,
    minimumHoursForPresent: first.minimumHoursForPresent,
    status: first.status,
  }

  const shiftDayConfigs = rows
    .filter((r) => r.shiftDayAndWeekDaysId)
    .map((r) => ({
      weekDayId: r.weekDayId,
      weekDay: r.weekDay,
      dayType: r.dayType,
      startTime: r.configStartTime,
      endTime: r.configEndTime,
      breakMinutes: r.configBreakMinutes,
      expectedWorkHours: r.configExpectedWorkHours,
      minimumHoursForPresent: r.configMinimumHoursForPresent,
    }))

  return {
    shift,
    shiftDayConfigs,
  }
}

export const deleteShift = async (shiftId: number) => {
  if (!shiftId || isNaN(shiftId)) {
    throw new Error('Invalid shiftId')
  }

  return await db.transaction(async (tx) => {
    // 1️⃣ Check shift exists
    const existingShift = await tx
      .select({ shiftId: shiftModel.shiftId })
      .from(shiftModel)
      .where(eq(shiftModel.shiftId, shiftId))
      .limit(1)

    if (!existingShift.length) {
      throw new Error('Shift not found')
    }

    // 2️⃣ Delete child table first
    await tx
      .delete(shiftDayAndWeekDaysModel)
      .where(eq(shiftDayAndWeekDaysModel.shiftId, shiftId))

    // 3️⃣ Delete parent shift
    await tx.delete(shiftModel).where(eq(shiftModel.shiftId, shiftId))

    return {
      success: true,
      message: 'Shift deleted successfully',
      shiftId,
    }
  })
}
