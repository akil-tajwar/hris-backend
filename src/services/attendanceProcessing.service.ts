import { and, eq, gte, lte, or, isNull } from 'drizzle-orm'
import { db } from '../config/database'
import {
  attendancePunches,
  attendanceDaily,
  employeeShiftAllocations,
  shiftModel,
  employeeModel,
} from '../schemas/schema'

// ─── Helpers ──────────────────────────────────────────────────────
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

const formatDate = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ─── Get employee's active shift ──────────────────────────────────
const getEmployeeShift = async (employeeId: number, attendanceDate: string) => {
  const allocation = await db
    .select()
    .from(employeeShiftAllocations)
    .where(
      and(
        eq(employeeShiftAllocations.employeeId, employeeId),
        lte(employeeShiftAllocations.effectiveFrom, attendanceDate),
        or(
          isNull(employeeShiftAllocations.effectiveTo),
          gte(employeeShiftAllocations.effectiveTo, attendanceDate)
        )
      )
    )
    .orderBy(employeeShiftAllocations.effectiveFrom)
    .limit(1)

  if (!allocation.length) return null

  const shift = await db
    .select()
    .from(shiftModel)
    .where(eq(shiftModel.shiftId, allocation[0].shiftId))
    .limit(1)

  return shift[0] ?? null
}

// ─── UPSERT attendance_daily ───────────────────────────────────────
const upsertAttendanceDaily = async (data: {
  employeeId:      number
  attendanceDate:  string
  firstIn:         Date | null
  lastOut:         Date | null
  workedMinutes:   number
  lateMinutes:     number
  earlyOutMinutes: number
  overtimeMinutes: number
  status:          string
}) => {
  const dateObj = toDateObj(data.attendanceDate)

  const existing = await db
    .select()
    .from(attendanceDaily)
    .where(
      and(
        eq(attendanceDaily.employeeId, data.employeeId),
        eq(attendanceDaily.attendanceDate, dateObj)
      )
    )
    .limit(1)

  if (existing.length) {
    await db
      .update(attendanceDaily)
      .set({
        firstIn:         data.firstIn,
        lastOut:         data.lastOut,
        workedMinutes:   data.workedMinutes,
        lateMinutes:     data.lateMinutes,
        earlyOutMinutes: data.earlyOutMinutes,
        overtimeMinutes: data.overtimeMinutes,
        status:          data.status,
      })
      .where(eq(attendanceDaily.id, existing[0].id))
  } else {
    await db.insert(attendanceDaily).values({
      employeeId:      data.employeeId,
      attendanceDate:  dateObj,
      firstIn:         data.firstIn,
      lastOut:         data.lastOut,
      workedMinutes:   data.workedMinutes,
      lateMinutes:     data.lateMinutes,
      earlyOutMinutes: data.earlyOutMinutes,
      overtimeMinutes: data.overtimeMinutes,
      status:          data.status,
      createdBy:       1,
    })
  }
}

// ─── Process single date ───────────────────────────────────────────
export const processAttendanceForDate = async (attendanceDate: string) => {
  if (!attendanceDate || !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
    throw new Error(`Invalid attendanceDate: "${attendanceDate}"`)
  }

  const [y, mo, d] = attendanceDate.split('-').map(Number)
  const startOfDay = new Date(y, mo - 1, d, 0, 0, 0)
  const endOfDay   = new Date(y, mo - 1, d, 23, 59, 59)

  const punches = await db
    .select()
    .from(attendancePunches)
    .where(
      and(
        gte(attendancePunches.punchTime, startOfDay),
        lte(attendancePunches.punchTime, endOfDay)
      )
    )
    .orderBy(attendancePunches.employeeId, attendancePunches.punchTime)

  const grouped = new Map<number, typeof punches>()
  for (const punch of punches) {
    if (!grouped.has(punch.employeeId)) grouped.set(punch.employeeId, [])
    grouped.get(punch.employeeId)!.push(punch)
  }

  const activeEmployees = await db
    .select({ employeeId: employeeModel.employeeId })
    .from(employeeModel)
    .where(eq(employeeModel.isActive, true))

  const results: { employeeId: number; status: string }[] = []

  for (const { employeeId } of activeEmployees) {
    const employeePunches = grouped.get(employeeId) ?? []
    const shift = await getEmployeeShift(employeeId, attendanceDate)

    if (!employeePunches.length || !shift) {
      await upsertAttendanceDaily({
        employeeId,
        attendanceDate,
        firstIn:         null,
        lastOut:         null,
        workedMinutes:   0,
        lateMinutes:     0,
        earlyOutMinutes: 0,
        overtimeMinutes: 0,
        status:          'ABSENT',
      })
      results.push({ employeeId, status: 'ABSENT' })
      continue
    }

    const firstIn = toSafeDate(employeePunches[0].punchTime)
    const lastOut = toSafeDate(employeePunches[employeePunches.length - 1].punchTime)

    if (!firstIn || !lastOut) {
      await upsertAttendanceDaily({
        employeeId,
        attendanceDate,
        firstIn:         null,
        lastOut:         null,
        workedMinutes:   0,
        lateMinutes:     0,
        earlyOutMinutes: 0,
        overtimeMinutes: 0,
        status:          'ABSENT',
      })
      results.push({ employeeId, status: 'ABSENT' })
      continue
    }

    const workedMinutes = differenceInMinutes(lastOut, firstIn)
    const shiftStart    = combineDateAndTime(attendanceDate, shift.startTime)
    const shiftEnd      = combineDateAndTime(attendanceDate, shift.endTime)

    // graceMinutes → boss এর pseudocode এ shift থেকে, কিন্তু shift এ নেই তাই 0
    const graceMinutes  = 0
    const allowedStart  = new Date(shiftStart.getTime() + graceMinutes * 60000)

    const lateMinutes = firstIn > allowedStart
      ? differenceInMinutes(firstIn, allowedStart)
      : 0

    const earlyOutMinutes = lastOut < shiftEnd
      ? differenceInMinutes(shiftEnd, lastOut)
      : 0

    const overtimeMinutes = lastOut > shiftEnd
      ? differenceInMinutes(lastOut, shiftEnd)
      : 0

    // status → shift.minimumHoursForPresent থেকে
    const minimumMinutesForPresent = shift.minimumHoursForPresent * 60

    let status: string
    if (workedMinutes >= minimumMinutesForPresent)
      status = 'PRESENT'
    else if (workedMinutes >= minimumMinutesForPresent / 2)
      status = 'HALF_DAY'
    else
      status = 'ABSENT'

    if (status === 'PRESENT' && lateMinutes > 0) status = 'LATE'

    await upsertAttendanceDaily({
      employeeId,
      attendanceDate,
      firstIn,
      lastOut,
      workedMinutes,
      lateMinutes,
      earlyOutMinutes,
      overtimeMinutes,
      status,
    })

    results.push({ employeeId, status })
  }

  return {
    success:   true,
    date:      attendanceDate,
    processed: results.length,
    summary: {
      present:  results.filter(r => r.status === 'PRESENT').length,
      late:     results.filter(r => r.status === 'LATE').length,
      halfDay:  results.filter(r => r.status === 'HALF_DAY').length,
      absent:   results.filter(r => r.status === 'ABSENT').length,
    },
  }
}

// ─── Process date range ────────────────────────────────────────────
export const processAttendanceForRange = async (
  fromDate: string,
  toDate:   string
) => {
  const results = []
  const [fy, fm, fd] = fromDate.split('-').map(Number)
  const [ty, tm, td] = toDate.split('-').map(Number)

  const current = new Date(fy, fm - 1, fd)
  const end     = new Date(ty, tm - 1, td)

  while (current <= end) {
    const dateStr = formatDate(current)
    const result  = await processAttendanceForDate(dateStr)
    results.push(result)
    current.setDate(current.getDate() + 1)
  }

  return { success: true, results }
}