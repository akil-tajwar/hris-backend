import { and, eq, gte, lte, or, isNull, desc } from 'drizzle-orm'
import { db } from '../config/database'
import {
  attendancePunches,
  attendanceDaily,
  employeeShiftAllocations,
  shiftModel,
  shiftDayAndWeekDaysModel,
  employeeModel,
  attendancePoliciesModel,
  holidaysModel,
  holidayCalendarModel,
  weekDayModel,
  attendanceDailyAudit,
  employeeLeaveApplyModel,
} from '../schemas/schema'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const differenceInMinutes = (a: Date, b: Date): number =>
  Math.floor((a.getTime() - b.getTime()) / 60000)

const combineDateAndTime = (dateStr: string, timeStr: string): Date => {
  const [h, m] = timeStr.split(':').map(Number)
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Date(y, mo - 1, d, h, m, 0)
}

const toDateObj = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const toSafeDate = (val: any): Date | null => {
  if (!val) return null
  const d = val instanceof Date ? val : new Date(val)
  return isNaN(d.getTime()) ? null : d
}

export const formatDate = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const getDayName = (dateStr: string): string => {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
  const [y, m, d] = dateStr.split('-').map(Number)
  return days[new Date(y, m - 1, d).getDay()]
}

type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'HOLIDAY'
  | 'WEEKEND'
  | 'ON_LEAVE'

// ─── Get employee's active shift ──────────────────────────────────────────────
const getEmployeeShift = async (
  employeeId: number,
  attendanceDate: string,
  tenantId: number
) => {
  const allocation = await db
    .select()
    .from(employeeShiftAllocations)
    .where(
      and(
        eq(employeeShiftAllocations.employeeId, employeeId),
        eq(employeeShiftAllocations.tenantId, tenantId),
        lte(employeeShiftAllocations.effectiveFrom, attendanceDate),
        or(
          isNull(employeeShiftAllocations.effectiveTo),
          gte(employeeShiftAllocations.effectiveTo, attendanceDate)
        )
      )
    )
    .orderBy(desc(employeeShiftAllocations.effectiveFrom))
    .limit(1)

  if (!allocation.length) {
    return null
  }

  const shift = await db
    .select()
    .from(shiftModel)
    .where(
      and(
        eq(shiftModel.shiftId, allocation[0].shiftId),
        eq(shiftModel.tenantId, tenantId)
      )
    )
    .limit(1)

  return shift[0] ?? null
}

// ─── Get employee's active attendance policy ──────────────────────────────────
// NOTE: this still has no tenant/company scoping on attendancePoliciesModel —
// flagging again since it affects holiday resolution below. Fix separately
// once we confirm the columns on that table.
const getEmployeeAttendancePolicy = async (employeeId: number) => {
  const employee = await db
    .select({ companyId: employeeModel.companyId })
    .from(employeeModel)
    .where(eq(employeeModel.employeeId, employeeId))
    .limit(1)

  if (!employee.length) return null

  const policy = await db
    .select()
    .from(attendancePoliciesModel)
    .where(eq(attendancePoliciesModel.isActive, true))
    .limit(1)

  if (!policy.length) return null

  return policy[0]
}

// ─── Resolve the employee's holiday calendar via their company ───────────────
// Holiday calendars are per-company (holiday_calendars.company_id), not tied
// to attendance_policies — that table has no company scoping and shouldn't be
// used to resolve holidays.
const getEmployeeHolidayCalendarId = async (
  employeeId: number,
  attendanceDate: string,
  tenantId: number
): Promise<number | null> => {
  const employee = await db
    .select({ companyId: employeeModel.companyId })
    .from(employeeModel)
    .where(eq(employeeModel.employeeId, employeeId))
    .limit(1)

  if (!employee.length) return null

  const year = Number(attendanceDate.split('-')[0])

  const calendar = await db
    .select({ id: holidayCalendarModel.id })
    .from(holidayCalendarModel)
    .where(
      and(
        eq(holidayCalendarModel.companyId, employee[0].companyId),
        eq(holidayCalendarModel.tenantId, tenantId),
        eq(holidayCalendarModel.year, year),
        eq(holidayCalendarModel.isActive, true)
      )
    )
    .limit(1)

  return calendar[0]?.id ?? null
}

// ─── Check Holiday ────────────────────────────────────────────────────────────
const isHolidayDate = async (
  attendanceDate: string,
  holidayCalendarId: number | null | undefined
): Promise<boolean> => {
  if (!holidayCalendarId) return false

  const calendar = await db
    .select()
    .from(holidayCalendarModel)
    .where(
      and(
        eq(holidayCalendarModel.id, holidayCalendarId),
        eq(holidayCalendarModel.isActive, true)
      )
    )
    .limit(1)

  if (!calendar.length) return false

  const holidays = await db
    .select()
    .from(holidaysModel)
    .where(eq(holidaysModel.calendarId, holidayCalendarId))

  return holidays.some((h) => {
    const holidayDateStr =
      typeof h.date === 'string'
        ? h.date.slice(0, 10)
        : new Date(h.date).toISOString().slice(0, 10)
    return holidayDateStr === attendanceDate
  })
}

// ─── Check Weekend (from the employee's shift, not the policy) ───────────────
// Every employee eventually resolves to a shift (falling back to "General
// Shift" if nothing else is assigned), so weekend is derived from
// shift_day_and_week_days.dayType for the day-of-week of attendanceDate.
const isWeekendDateFromShift = async (
  shiftId: number,
  attendanceDate: string,
  tenantId: number
): Promise<boolean> => {
  const dayName = getDayName(attendanceDate)

  const weekDay = await db
    .select({ weekDayId: weekDayModel.weekDayId })
    .from(weekDayModel)
    .where(eq(weekDayModel.day, dayName as any))
    .limit(1)

  if (!weekDay.length) return false

  const shiftDay = await db
    .select({ dayType: shiftDayAndWeekDaysModel.dayType })
    .from(shiftDayAndWeekDaysModel)
    .where(
      and(
        eq(shiftDayAndWeekDaysModel.shiftId, shiftId),
        eq(shiftDayAndWeekDaysModel.weekDayId, weekDay[0].weekDayId)
      )
    )
    .limit(1)

  if (!shiftDay.length) return false

  return shiftDay[0].dayType === 'Weekend'
}

// ─── Check Approved Leave ─────────────────────────────────────────────────────
const isOnLeaveDate = async (
  employeeId: number,
  attendanceDate: string,
  tenantId: number
): Promise<boolean> => {
  const leaves = await db
    .select({ id: employeeLeaveApplyModel.employeeLeaveApplyId })
    .from(employeeLeaveApplyModel)
    .where(
      and(
        eq(employeeLeaveApplyModel.employeeId, employeeId),
        eq(employeeLeaveApplyModel.tenantId, tenantId),
        eq(employeeLeaveApplyModel.status, 'Approved'),
        lte(employeeLeaveApplyModel.effectiveFrom, new Date(attendanceDate)),
        or(
          isNull(employeeLeaveApplyModel.effectiveTo),
          gte(employeeLeaveApplyModel.effectiveTo, new Date(attendanceDate))
        )
      )
    )
    .limit(1)

  return leaves.length > 0
}

const upsertAttendanceDaily = async (
  data: {
    employeeId: number
    tenantId: number
    attendanceDate: string
    firstIn: Date | null
    lastOut: Date | null
    workedMinutes: number
    lateMinutes: number
    earlyOutMinutes: number
    overtimeMinutes: number
    status: AttendanceStatus
  },
  changedBy: number = 1
) => {
  const dateObj = toDateObj(data.attendanceDate)

  const existing = await db
    .select()
    .from(attendanceDaily)
    .where(
      and(
        eq(attendanceDaily.employeeId, data.employeeId),
        eq(attendanceDaily.tenantId, data.tenantId),
        eq(attendanceDaily.attendanceDate, dateObj)
      )
    )
    .limit(1)

  if (existing.length) {
    const old = existing[0]

    await db
      .update(attendanceDaily)
      .set({
        firstIn: data.firstIn,
        lastOut: data.lastOut,
        workedMinutes: data.workedMinutes,
        lateMinutes: data.lateMinutes,
        earlyOutMinutes: data.earlyOutMinutes,
        overtimeMinutes: data.overtimeMinutes,
        status: data.status,
        updatedBy: changedBy,
      })
      .where(eq(attendanceDaily.id, old.id))

    await db.insert(attendanceDailyAudit).values({
      recordId: old.id,
      employeeId: data.employeeId,
      attendanceDate: data.attendanceDate,
      action: 'UPDATE',
      changedBy,
      tenantId: data.tenantId,
      oldStatus: old.status,
      oldWorkedMinutes: old.workedMinutes ?? 0,
      oldLateMinutes: old.lateMinutes ?? 0,
      oldEarlyOutMinutes: old.earlyOutMinutes ?? 0,
      oldOvertimeMinutes: old.overtimeMinutes ?? 0,
      oldFirstIn: toSafeDate(old.firstIn),
      oldLastOut: toSafeDate(old.lastOut),
      newStatus: data.status,
      newWorkedMinutes: data.workedMinutes,
      newLateMinutes: data.lateMinutes,
      newEarlyOutMinutes: data.earlyOutMinutes,
      newOvertimeMinutes: data.overtimeMinutes,
      newFirstIn: data.firstIn,
      newLastOut: data.lastOut,
    })
  } else {
    const inserted = await db.insert(attendanceDaily).values({
      employeeId: data.employeeId,
      tenantId: data.tenantId,
      attendanceDate: dateObj,
      firstIn: data.firstIn,
      lastOut: data.lastOut,
      workedMinutes: data.workedMinutes,
      lateMinutes: data.lateMinutes,
      earlyOutMinutes: data.earlyOutMinutes,
      overtimeMinutes: data.overtimeMinutes,
      status: data.status,
      createdBy: changedBy,
    })

    await db.insert(attendanceDailyAudit).values({
      recordId: Number((inserted as any).insertId) || null,
      employeeId: data.employeeId,
      attendanceDate: data.attendanceDate,
      action: 'INSERT',
      changedBy,
      tenantId: data.tenantId,
      oldStatus: null,
      oldWorkedMinutes: null,
      oldLateMinutes: null,
      oldEarlyOutMinutes: null,
      oldOvertimeMinutes: null,
      oldFirstIn: null,
      oldLastOut: null,
      newStatus: data.status,
      newWorkedMinutes: data.workedMinutes,
      newLateMinutes: data.lateMinutes,
      newEarlyOutMinutes: data.earlyOutMinutes,
      newOvertimeMinutes: data.overtimeMinutes,
      newFirstIn: data.firstIn,
      newLastOut: data.lastOut,
    })
  }
}

// ─── Process single date ──────────────────────────────────────────────────────
export const processAttendanceForDate = async (
  attendanceDate: string,
  changedBy: number = 1,
  tenantId?: number
) => {
  if (!attendanceDate || !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
    throw new Error(`Invalid attendanceDate: "${attendanceDate}"`)
  }

  if (!tenantId) {
    throw new Error('Tenant ID is required')
  }

  const startOfDay = `${attendanceDate} 00:00:00`
  const endOfDay = `${attendanceDate} 23:59:59`

  const punches = await db
    .select()
    .from(attendancePunches)
    .where(
      and(
        gte(attendancePunches.punchTime, startOfDay),
        lte(attendancePunches.punchTime, endOfDay),
        eq(attendancePunches.tenantId, tenantId)
      )
    )
    .orderBy(attendancePunches.employeeId, attendancePunches.punchTime)

  const grouped = new Map<number, typeof punches>()

  for (const punch of punches) {
    if (!grouped.has(punch.employeeId)) {
      grouped.set(punch.employeeId, [])
    }
    grouped.get(punch.employeeId)!.push(punch)
  }

  const activeEmployees = await db
    .select({
      employeeId: employeeModel.employeeId,
    })
    .from(employeeModel)
    .where(
      and(
        eq(employeeModel.isActive, true),
        eq(employeeModel.tenantId, tenantId)
      )
    )

  const results: { employeeId: number; status: AttendanceStatus }[] = []

  for (const { employeeId } of activeEmployees) {
    const employeePunches = grouped.get(employeeId) ?? []

    const policy = await getEmployeeAttendancePolicy(employeeId)

    // Fetched up front now — weekend resolution (priority 2) needs the
    // shift's shiftId, and normal attendance processing (priority 4) needs
    // it too. Every employee should resolve to a shift eventually (falling
    // back to "General Shift"), but we still guard against null below.
    const shift = await getEmployeeShift(employeeId, attendanceDate, tenantId)

    // PRIORITY 1: Holiday — calendar resolved from the employee's company,
    // not from attendance_policies (that table has no company scoping).
    const holidayCalendarId = await getEmployeeHolidayCalendarId(
      employeeId,
      attendanceDate,
      tenantId
    )
    const isHoliday = await isHolidayDate(attendanceDate, holidayCalendarId)

    if (isHoliday) {
      await upsertAttendanceDaily(
        {
          employeeId,
          tenantId,
          attendanceDate,
          firstIn: employeePunches.length
            ? toSafeDate(employeePunches[0].punchTime)
            : null,
          lastOut: employeePunches.length
            ? toSafeDate(employeePunches[employeePunches.length - 1].punchTime)
            : null,
          workedMinutes: 0,
          lateMinutes: 0,
          earlyOutMinutes: 0,
          overtimeMinutes: 0,
          status: 'HOLIDAY',
        },
        changedBy
      )

      results.push({ employeeId, status: 'HOLIDAY' })
      continue
    }

    // PRIORITY 2: Weekend — now derived from the employee's shift config
    // (shift_day_and_week_days.dayType === 'Weekend'), not the policy's
    // weekend list.
    const isWeekend = shift
      ? await isWeekendDateFromShift(shift.shiftId, attendanceDate, tenantId)
      : false

    if (isWeekend) {
      await upsertAttendanceDaily(
        {
          employeeId,
          tenantId,
          attendanceDate,
          firstIn: null,
          lastOut: null,
          workedMinutes: 0,
          lateMinutes: 0,
          earlyOutMinutes: 0,
          overtimeMinutes: 0,
          status: 'WEEKEND',
        },
        changedBy
      )

      results.push({ employeeId, status: 'WEEKEND' })
      continue
    }

    // PRIORITY 3: Approved Leave
    // Checked before any punch/shift logic so a leave day is never miscounted
    // as ABSENT, regardless of whether stray punches exist for that date.
    const onLeave = await isOnLeaveDate(employeeId, attendanceDate, tenantId)

    if (onLeave) {
      await upsertAttendanceDaily(
        {
          employeeId,
          tenantId,
          attendanceDate,
          firstIn: null,
          lastOut: null,
          workedMinutes: 0,
          lateMinutes: 0,
          earlyOutMinutes: 0,
          overtimeMinutes: 0,
          status: 'ON_LEAVE',
        },
        changedBy
      )

      results.push({ employeeId, status: 'ON_LEAVE' })
      continue
    }

    // PRIORITY 4: Normal attendance
    if (!employeePunches.length || !shift) {
      await upsertAttendanceDaily(
        {
          employeeId,
          tenantId,
          attendanceDate,
          firstIn: null,
          lastOut: null,
          workedMinutes: 0,
          lateMinutes: 0,
          earlyOutMinutes: 0,
          overtimeMinutes: 0,
          status: 'ABSENT',
        },
        changedBy
      )

      results.push({ employeeId, status: 'ABSENT' })
      continue
    }

    const firstIn = toSafeDate(employeePunches[0].punchTime)
    const lastOut =
      employeePunches.length > 1
        ? toSafeDate(employeePunches[employeePunches.length - 1].punchTime)
        : null // only one punch recorded — no punch-out yet, don't treat firstIn as lastOut

    if (!firstIn) {
      await upsertAttendanceDaily(
        {
          employeeId,
          tenantId,
          attendanceDate,
          firstIn: null,
          lastOut: null,
          workedMinutes: 0,
          lateMinutes: 0,
          earlyOutMinutes: 0,
          overtimeMinutes: 0,
          status: 'ABSENT',
        },
        changedBy
      )

      results.push({ employeeId, status: 'ABSENT' })
      continue
    }

    const shiftStart = combineDateAndTime(attendanceDate, shift.startTime)
    const shiftEnd = combineDateAndTime(attendanceDate, shift.endTime)
    const graceMinutes = policy?.graceMinutes ?? 0
    const allowedStart = new Date(shiftStart.getTime() + graceMinutes * 60000)
    const lateMinutes =
      firstIn > allowedStart ? differenceInMinutes(firstIn, allowedStart) : 0

    if (!lastOut) {
      const isToday = attendanceDate === formatDate(new Date())

      if (isToday) {
        // Day still in progress — employee has checked in, no punch-out expected yet
        const status: AttendanceStatus = lateMinutes > 0 ? 'LATE' : 'PRESENT'

        await upsertAttendanceDaily(
          {
            employeeId,
            tenantId,
            attendanceDate,
            firstIn,
            lastOut: null,
            workedMinutes: 0,
            lateMinutes,
            earlyOutMinutes: 0,
            overtimeMinutes: 0,
            status,
          },
          changedBy
        )

        results.push({ employeeId, status })
      } else {
        // Past date with only a check-in and no check-out — data anomaly, not a normal absence
        await upsertAttendanceDaily(
          {
            employeeId,
            tenantId,
            attendanceDate,
            firstIn,
            lastOut: null,
            workedMinutes: 0,
            lateMinutes,
            earlyOutMinutes: 0,
            overtimeMinutes: 0,
            status: 'PRESENT', // flagged via lastOut: null, see note below
          },
          changedBy
        )

        results.push({ employeeId, status: 'PRESENT' })
      }

      continue
    }

    const workedMinutes = differenceInMinutes(lastOut, firstIn)

    const earlyOutMinutes =
      lastOut < shiftEnd ? differenceInMinutes(shiftEnd, lastOut) : 0

    const overtimeMinutes = policy?.allowOvertime
      ? Math.max(0, differenceInMinutes(lastOut, shiftEnd))
      : 0

    const minimumMinutesForPresent = shift.minimumHoursForPresent * 60

    const halfDayAfterMinutes = policy?.halfDayAfterMinutes ?? 120

    const absentAfterMinutes = policy?.absentAfterMinutes ?? 240

    let status: AttendanceStatus

    if (
      workedMinutes <= 0 ||
      (workedMinutes < halfDayAfterMinutes &&
        workedMinutes < absentAfterMinutes)
    ) {
      status = 'ABSENT'
    } else if (workedMinutes >= minimumMinutesForPresent) {
      status = lateMinutes > 0 ? 'LATE' : 'PRESENT'
    } else if (workedMinutes >= minimumMinutesForPresent / 2) {
      status = 'HALF_DAY'
    } else {
      status = 'ABSENT'
    }

    await upsertAttendanceDaily(
      {
        employeeId,
        tenantId,
        attendanceDate,
        firstIn,
        lastOut,
        workedMinutes,
        lateMinutes,
        earlyOutMinutes,
        overtimeMinutes,
        status,
      },
      changedBy
    )

    results.push({ employeeId, status })
  }

  return {
    success: true,
    date: attendanceDate,
    processed: results.length,
    summary: {
      holiday: results.filter((r) => r.status === 'HOLIDAY').length,
      weekend: results.filter((r) => r.status === 'WEEKEND').length,
      onLeave: results.filter((r) => r.status === 'ON_LEAVE').length,
      present: results.filter((r) => r.status === 'PRESENT').length,
      late: results.filter((r) => r.status === 'LATE').length,
      halfDay: results.filter((r) => r.status === 'HALF_DAY').length,
      absent: results.filter((r) => r.status === 'ABSENT').length,
    },
  }
}

// ─── Process date range ───────────────────────────────────────────────────────
export const processAttendanceForRange = async (
  fromDate: string,
  toDate: string,
  changedBy: number,
  tenantId: number
) => {
  const results = []
  const [fy, fm, fd] = fromDate.split('-').map(Number)
  const [ty, tm, td] = toDate.split('-').map(Number)

  const current = new Date(fy, fm - 1, fd)
  const end = new Date(ty, tm - 1, td)

  while (current <= end) {
    const dateStr = formatDate(current)
    const result = await processAttendanceForDate(dateStr, changedBy, tenantId)
    results.push(result)
    current.setDate(current.getDate() + 1)
  }

  return { success: true, results }
}
