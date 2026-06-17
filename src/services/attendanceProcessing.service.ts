import { and, eq, gte, lte, or, isNull, desc } from 'drizzle-orm'
import { db } from '../config/database'
import {
  attendancePunches,
  attendanceDaily,
  employeeShiftAllocations,
  shiftModel,
  employeeModel,
  attendancePoliciesModel,
  attendancePolicyWeekendsModel,
  holidaysModel,
  holidayCalendarModel,
  weekDayModel,
  attendanceDailyAudit
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
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const [y, m, d] = dateStr.split('-').map(Number)
  return days[new Date(y, m - 1, d).getDay()]
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'HOLIDAY' | 'WEEKEND' | 'ON_LEAVE'

// ─── Get employee's active shift ──────────────────────────────────────────────
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

// ─── Get employee's active attendance policy ──────────────────────────────────
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

  const weekends = await db
    .select({ weekDayId: attendancePolicyWeekendsModel.weekDayId })
    .from(attendancePolicyWeekendsModel)
    .where(eq(attendancePolicyWeekendsModel.policyId, policy[0].id))

  return {
    ...policy[0],
    weekendDayIds: weekends.map((w) => w.weekDayId),
  }
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

// ─── Check Weekend ────────────────────────────────────────────────────────────
const isWeekendDate = async (
  attendanceDate: string,
  weekendDayIds: number[]
): Promise<boolean> => {
  if (!weekendDayIds.length) return false

  const dayName = getDayName(attendanceDate)

  const weekDay = await db
    .select({ weekDayId: weekDayModel.weekDayId })
    .from(weekDayModel)
    .where(eq(weekDayModel.day, dayName as any))
    .limit(1)

  if (!weekDay.length) return false

  return weekendDayIds.includes(weekDay[0].weekDayId)
}

// ─── UPSERT attendance_daily + Audit ─────────────────────────────────────────
// এই function টাই সব কাজ করে:
//   1. আগে record আছে কিনা দেখে
//   2. থাকলে → update করে + audit তে পুরনো vs নতুন value লেখে
//   3. না থাকলে → insert করে + audit তে INSERT action লেখে
// const upsertAttendanceDaily = async (
//   data: {
//     employeeId:      number
//     attendanceDate:  string
//     firstIn:         Date | null
//     lastOut:         Date | null
//     workedMinutes:   number
//     lateMinutes:     number
//     earlyOutMinutes: number
//     overtimeMinutes: number
//     status:          AttendanceStatus
//   },
//   changedBy: number = 1   // কোন user এই process চালাচ্ছে
// ) => {
//   const dateObj = toDateObj(data.attendanceDate)

//   const existing = await db
//     .select()
//     .from(attendanceDaily)
//     .where(
//       and(
//         eq(attendanceDaily.employeeId, data.employeeId),
//         eq(attendanceDaily.attendanceDate, dateObj)
//       )
//     )
//     .limit(1)

//   if (existing.length) {
//     const old = existing[0]

//     // ── UPDATE ──
//     await db
//       .update(attendanceDaily)
//       .set({
//         firstIn:         data.firstIn,
//         lastOut:         data.lastOut,
//         workedMinutes:   data.workedMinutes,
//         lateMinutes:     data.lateMinutes,
//         earlyOutMinutes: data.earlyOutMinutes,
//         overtimeMinutes: data.overtimeMinutes,
//         status:          data.status,
//         updatedBy:       changedBy,
//       })
//       .where(eq(attendanceDaily.id, old.id))

//     // ── AUDIT: UPDATE — আগের ও নতুন value সংরক্ষণ ──
//     await db.insert(attendanceDailyAudit).values({
//       recordId:       old.id,
//       employeeId:     data.employeeId,
//       attendanceDate: dateObj,
//       action:         'UPDATE',
//       changedBy,

//       // আগের value
//       oldStatus:          old.status,
//       oldWorkedMinutes:   old.workedMinutes ?? 0,
//       oldLateMinutes:     old.lateMinutes ?? 0,
//       oldEarlyOutMinutes: old.earlyOutMinutes ?? 0,
//       oldOvertimeMinutes: old.overtimeMinutes ?? 0,
//       oldFirstIn:         toSafeDate(old.firstIn),
//       oldLastOut:         toSafeDate(old.lastOut),

//       // নতুন value
//       newStatus:          data.status,
//       newWorkedMinutes:   data.workedMinutes,
//       newLateMinutes:     data.lateMinutes,
//       newEarlyOutMinutes: data.earlyOutMinutes,
//       newOvertimeMinutes: data.overtimeMinutes,
//       newFirstIn:         data.firstIn,
//       newLastOut:         data.lastOut,
//     })
//   } else {
//     // ── INSERT ──
//     const inserted = await db.insert(attendanceDaily).values({
//       employeeId:      data.employeeId,
//       attendanceDate:  dateObj,
//       firstIn:         data.firstIn,
//       lastOut:         data.lastOut,
//       workedMinutes:   data.workedMinutes,
//       lateMinutes:     data.lateMinutes,
//       earlyOutMinutes: data.earlyOutMinutes,
//       overtimeMinutes: data.overtimeMinutes,
//       status:          data.status,
//       createdBy:       changedBy,
//     })

//     // ── AUDIT: INSERT — পুরনো value নেই তাই old_* = null ──
//     await db.insert(attendanceDailyAudit).values({
//       recordId:       Number((inserted as any).insertId) || null,
//       employeeId:     data.employeeId,
//       attendanceDate: dateObj,
//       action:         'INSERT',
//       changedBy,

//       // INSERT এ old value নেই
//       oldStatus:          null,
//       oldWorkedMinutes:   null,
//       oldLateMinutes:     null,
//       oldEarlyOutMinutes: null,
//       oldOvertimeMinutes: null,
//       oldFirstIn:         null,
//       oldLastOut:         null,

//       // নতুন value
//       newStatus:          data.status,
//       newWorkedMinutes:   data.workedMinutes,
//       newLateMinutes:     data.lateMinutes,
//       newEarlyOutMinutes: data.earlyOutMinutes,
//       newOvertimeMinutes: data.overtimeMinutes,
//       newFirstIn:         data.firstIn,
//       newLastOut:         data.lastOut,
//     })
//   }
// }


const upsertAttendanceDaily = async (
  data: {
    employeeId:      number
    attendanceDate:  string
    firstIn:         Date | null
    lastOut:         Date | null
    workedMinutes:   number
    lateMinutes:     number
    earlyOutMinutes: number
    overtimeMinutes: number
    status:          AttendanceStatus
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
        eq(attendanceDaily.attendanceDate, dateObj)
      )
    )
    .limit(1)

  if (existing.length) {
    const old = existing[0]

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
        updatedBy:       changedBy,
      })
      .where(eq(attendanceDaily.id, old.id))

    await db.insert(attendanceDailyAudit).values({
      recordId:           old.id,
      employeeId:         data.employeeId,
      attendanceDate:     data.attendanceDate,  // ← 'YYYY-MM-DD' string
      action:             'UPDATE',
      changedBy,
      oldStatus:          old.status,
      oldWorkedMinutes:   old.workedMinutes ?? 0,
      oldLateMinutes:     old.lateMinutes ?? 0,
      oldEarlyOutMinutes: old.earlyOutMinutes ?? 0,
      oldOvertimeMinutes: old.overtimeMinutes ?? 0,
      oldFirstIn:         toSafeDate(old.firstIn),
      oldLastOut:         toSafeDate(old.lastOut),
      newStatus:          data.status,
      newWorkedMinutes:   data.workedMinutes,
      newLateMinutes:     data.lateMinutes,
      newEarlyOutMinutes: data.earlyOutMinutes,
      newOvertimeMinutes: data.overtimeMinutes,
      newFirstIn:         data.firstIn,
      newLastOut:         data.lastOut,
    })

  } else {
    const inserted = await db.insert(attendanceDaily).values({
      employeeId:      data.employeeId,
      attendanceDate:  dateObj,
      firstIn:         data.firstIn,
      lastOut:         data.lastOut,
      workedMinutes:   data.workedMinutes,
      lateMinutes:     data.lateMinutes,
      earlyOutMinutes: data.earlyOutMinutes,
      overtimeMinutes: data.overtimeMinutes,
      status:          data.status,
      createdBy:       changedBy,
    })

    await db.insert(attendanceDailyAudit).values({
      recordId:           Number((inserted as any).insertId) || null,
      employeeId:         data.employeeId,
      attendanceDate:     data.attendanceDate,  // ← 'YYYY-MM-DD' string
      action:             'INSERT',
      changedBy,
      oldStatus:          null,
      oldWorkedMinutes:   null,
      oldLateMinutes:     null,
      oldEarlyOutMinutes: null,
      oldOvertimeMinutes: null,
      oldFirstIn:         null,
      oldLastOut:         null,
      newStatus:          data.status,
      newWorkedMinutes:   data.workedMinutes,
      newLateMinutes:     data.lateMinutes,
      newEarlyOutMinutes: data.earlyOutMinutes,
      newOvertimeMinutes: data.overtimeMinutes,
      newFirstIn:         data.firstIn,
      newLastOut:         data.lastOut,
    })
  }
}

// ─── Process single date ──────────────────────────────────────────────────────
export const processAttendanceForDate = async (
  attendanceDate: string,
  changedBy: number = 1
) => {
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

  const results: { employeeId: number; status: AttendanceStatus }[] = []

  for (const { employeeId } of activeEmployees) {
    const employeePunches = grouped.get(employeeId) ?? []
    const policy = await getEmployeeAttendancePolicy(employeeId)

    // PRIORITY 1: Holiday
    const isHoliday = await isHolidayDate(attendanceDate, policy?.holidayCalendarId ?? null)
    if (isHoliday) {
      await upsertAttendanceDaily(
        {
          employeeId,
          attendanceDate,
          firstIn:         employeePunches.length ? toSafeDate(employeePunches[0].punchTime) : null,
          lastOut:         employeePunches.length ? toSafeDate(employeePunches[employeePunches.length - 1].punchTime) : null,
          workedMinutes:   0,
          lateMinutes:     0,
          earlyOutMinutes: 0,
          overtimeMinutes: 0,
          status:          'HOLIDAY',
        },
        changedBy
      )
      results.push({ employeeId, status: 'HOLIDAY' })
      continue
    }

    // PRIORITY 2: Weekend
    const isWeekend = await isWeekendDate(attendanceDate, policy?.weekendDayIds ?? [])
    if (isWeekend) {
      await upsertAttendanceDaily(
        {
          employeeId,
          attendanceDate,
          firstIn:         null,
          lastOut:         null,
          workedMinutes:   0,
          lateMinutes:     0,
          earlyOutMinutes: 0,
          overtimeMinutes: 0,
          status:          'WEEKEND',
        },
        changedBy
      )
      results.push({ employeeId, status: 'WEEKEND' })
      continue
    }

    // PRIORITY 3: Normal attendance
    const shift = await getEmployeeShift(employeeId, attendanceDate)

    if (!employeePunches.length || !shift) {
      await upsertAttendanceDaily(
        {
          employeeId,
          attendanceDate,
          firstIn:         null,
          lastOut:         null,
          workedMinutes:   0,
          lateMinutes:     0,
          earlyOutMinutes: 0,
          overtimeMinutes: 0,
          status:          'ABSENT',
        },
        changedBy
      )
      results.push({ employeeId, status: 'ABSENT' })
      continue
    }

    const firstIn  = toSafeDate(employeePunches[0].punchTime)
    const lastOut  = toSafeDate(employeePunches[employeePunches.length - 1].punchTime)

    if (!firstIn || !lastOut) {
      await upsertAttendanceDaily(
        {
          employeeId, attendanceDate,
          firstIn: null, lastOut: null,
          workedMinutes: 0, lateMinutes: 0,
          earlyOutMinutes: 0, overtimeMinutes: 0,
          status: 'ABSENT',
        },
        changedBy
      )
      results.push({ employeeId, status: 'ABSENT' })
      continue
    }

    const workedMinutes    = differenceInMinutes(lastOut, firstIn)
    const shiftStart       = combineDateAndTime(attendanceDate, shift.startTime)
    const shiftEnd         = combineDateAndTime(attendanceDate, shift.endTime)
    const graceMinutes     = policy?.graceMinutes ?? 0
    const allowedStart     = new Date(shiftStart.getTime() + graceMinutes * 60000)

    const lateMinutes      = firstIn > allowedStart ? differenceInMinutes(firstIn, allowedStart) : 0
    const earlyOutMinutes  = lastOut < shiftEnd ? differenceInMinutes(shiftEnd, lastOut) : 0
    const overtimeMinutes  = policy?.allowOvertime
      ? Math.max(0, differenceInMinutes(lastOut, shiftEnd))
      : 0

    const minimumMinutesForPresent = shift.minimumHoursForPresent * 60
    const halfDayAfterMinutes      = policy?.halfDayAfterMinutes ?? 120
    const absentAfterMinutes       = policy?.absentAfterMinutes ?? 240

    let status: AttendanceStatus
    if (workedMinutes <= 0 || (workedMinutes < halfDayAfterMinutes && workedMinutes < absentAfterMinutes)) {
      status = 'ABSENT'
    } else if (workedMinutes >= minimumMinutesForPresent) {
      status = lateMinutes > 0 ? 'LATE' : 'PRESENT'
    } else if (workedMinutes >= minimumMinutesForPresent / 2) {
      status = 'HALF_DAY'
    } else {
      status = 'ABSENT'
    }

    await upsertAttendanceDaily(
      { employeeId, attendanceDate, firstIn, lastOut, workedMinutes, lateMinutes, earlyOutMinutes, overtimeMinutes, status },
      changedBy
    )
    results.push({ employeeId, status })
  }

  return {
    success:   true,
    date:      attendanceDate,
    processed: results.length,
    summary: {
      holiday: results.filter(r => r.status === 'HOLIDAY').length,
      weekend: results.filter(r => r.status === 'WEEKEND').length,
      present: results.filter(r => r.status === 'PRESENT').length,
      late:    results.filter(r => r.status === 'LATE').length,
      halfDay: results.filter(r => r.status === 'HALF_DAY').length,
      absent:  results.filter(r => r.status === 'ABSENT').length,
    },
  }
}

// ─── Process date range ───────────────────────────────────────────────────────
export const processAttendanceForRange = async (
  fromDate:  string,
  toDate:    string,
  changedBy: number = 1
) => {
  const results = []
  const [fy, fm, fd] = fromDate.split('-').map(Number)
  const [ty, tm, td] = toDate.split('-').map(Number)

  const current = new Date(fy, fm - 1, fd)
  const end     = new Date(ty, tm - 1, td)

  while (current <= end) {
    const dateStr = formatDate(current)
    const result  = await processAttendanceForDate(dateStr, changedBy)
    results.push(result)
    current.setDate(current.getDate() + 1)
  }

  return { success: true, results }
}



//   import { and, eq, gte, lte, or, isNull } from 'drizzle-orm'
// import { db } from '../config/database'
// import {
//   attendancePunches,
//   attendanceDaily,
//   employeeShiftAllocations,
//   shiftModel,
//   employeeModel,
//   attendancePoliciesModel,
//   attendancePolicyWeekendsModel,
//   holidaysModel,
//   holidayCalendarModel,
// } from '../schemas/schema'

// // ─── Helpers ──────────────────────────────────────────────────────
// const differenceInMinutes = (a: Date, b: Date): number =>
//   Math.floor((a.getTime() - b.getTime()) / 60000)

// const combineDateAndTime = (dateStr: string, timeStr: string): Date => {
//   const [h, m] = timeStr.split(':').map(Number)
//   const [y, mo, d] = dateStr.split('-').map(Number)
//   return new Date(y, mo - 1, d, h, m, 0)
// }

// const toDateObj = (dateStr: string): Date => {
//   const [y, m, d] = dateStr.split('-').map(Number)
//   return new Date(y, m - 1, d)
// }

// const toSafeDate = (val: any): Date | null => {
//   if (!val) return null
//   const d = val instanceof Date ? val : new Date(val)
//   return isNaN(d.getTime()) ? null : d
// }

// const formatDate = (date: Date): string => {
//   const y = date.getFullYear()
//   const m = String(date.getMonth() + 1).padStart(2, '0')
//   const d = String(date.getDate()).padStart(2, '0')
//   return `${y}-${m}-${d}`
// }

// // day name বের করার helper — week_days table এর enum এর সাথে match করতে হবে
// const getDayName = (dateStr: string): string => {
//   const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
//   const [y, m, d] = dateStr.split('-').map(Number)
//   return days[new Date(y, m - 1, d).getDay()]
// }

// // ─── Get employee's active shift ──────────────────────────────────
// const getEmployeeShift = async (employeeId: number, attendanceDate: string) => {
//   const allocation = await db
//     .select()
//     .from(employeeShiftAllocations)
//     .where(
//       and(
//         eq(employeeShiftAllocations.employeeId, employeeId),
//         lte(employeeShiftAllocations.effectiveFrom, attendanceDate),
//         or(
//           isNull(employeeShiftAllocations.effectiveTo),
//           gte(employeeShiftAllocations.effectiveTo, attendanceDate)
//         )
//       )
//     )
//     .orderBy(employeeShiftAllocations.effectiveFrom)
//     .limit(1)

//   if (!allocation.length) return null

//   const shift = await db
//     .select()
//     .from(shiftModel)
//     .where(eq(shiftModel.shiftId, allocation[0].shiftId))
//     .limit(1)

//   return shift[0] ?? null
// }

// // ─── Get employee's active attendance policy ───────────────────────
// const getEmployeeAttendancePolicy = async (employeeId: number) => {
//   // employee এর companyId বের করো
//   const employee = await db
//     .select({ companyId: employeeModel.companyId })
//     .from(employeeModel)
//     .where(eq(employeeModel.employeeId, employeeId))
//     .limit(1)

//   if (!employee.length) return null

//   // সেই company র active attendance policy বের করো
//   // (employee_attendance_policy table populate না হওয়া পর্যন্ত
//   //  company র যেকোনো active policy নেওয়া হচ্ছে)
//   const policy = await db
//     .select()
//     .from(attendancePoliciesModel)
//     .where(eq(attendancePoliciesModel.isActive, true))
//     .limit(1)

//   if (!policy.length) return null

//   // policy র weekends বের করো
//   const weekends = await db
//     .select({ weekDayId: attendancePolicyWeekendsModel.weekDayId })
//     .from(attendancePolicyWeekendsModel)
//     .where(eq(attendancePolicyWeekendsModel.policyId, policy[0].id))

//   return {
//     ...policy[0],
//     weekendDayIds: weekends.map((w) => w.weekDayId),
//   }
// }

// // ─── Check if date is a Holiday ───────────────────────────────────
// const isHolidayDate = async (
//   attendanceDate: string,
//   holidayCalendarId: number | null | undefined
// ): Promise<boolean> => {
//   if (!holidayCalendarId) return false

//   const year = parseInt(attendanceDate.split('-')[0])

//   // calendar active এবং year match করে কিনা চেক
//   const calendar = await db
//     .select()
//     .from(holidayCalendarModel)
//     .where(
//       and(
//         eq(holidayCalendarModel.id, holidayCalendarId),
//         // eq(holidayCalendarModel.year, year),
//         eq(holidayCalendarModel.isActive, true)
//       )
//     )
//     .limit(1)

//   if (!calendar.length) return false

//   // holidays table এ date match করে কিনা চেক
//   // holidays.date টা timestamp — date part compare করতে হবে
//   const holidays = await db
//     .select()
//     .from(holidaysModel)
//     .where(eq(holidaysModel.calendarId, holidayCalendarId))

//   // date string compare: 'YYYY-MM-DD' prefix match
//   const match = holidays.some((h) => {
//     const holidayDateStr = typeof h.date === 'string'
//       ? h.date.slice(0, 10)
//       : new Date(h.date).toISOString().slice(0, 10)
//     return holidayDateStr === attendanceDate
//   })

//   return match
// }

// // ─── Check if date is a Weekend (policy based) ────────────────────
// const isWeekendDate = async (
//   attendanceDate: string,
//   weekendDayIds: number[]
// ): Promise<boolean> => {
//   if (!weekendDayIds.length) return false

//   const dayName = getDayName(attendanceDate)

//   // week_days table থেকে day name → id বের করো
//   const { weekDayModel } = await import('../schemas/schema')
//   const weekDay = await db
//     .select({ weekDayId: weekDayModel.weekDayId })
//     .from(weekDayModel)
//     .where(eq(weekDayModel.day, dayName as any))
//     .limit(1)

//   if (!weekDay.length) return false

//   return weekendDayIds.includes(weekDay[0].weekDayId)
// }

// type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'HOLIDAY' | 'WEEKEND' | 'ON_LEAVE'

// // ─── UPSERT attendance_daily ───────────────────────────────────────
// const upsertAttendanceDaily = async (data: {
//   employeeId:      number
//   attendanceDate:  string
//   firstIn:         Date | null
//   lastOut:         Date | null
//   workedMinutes:   number
//   lateMinutes:     number
//   earlyOutMinutes: number
//   overtimeMinutes: number
//   status:          AttendanceStatus
// }) => {
//   const dateObj = toDateObj(data.attendanceDate)

//   const existing = await db
//     .select()
//     .from(attendanceDaily)
//     .where(
//       and(
//         eq(attendanceDaily.employeeId, data.employeeId),
//         eq(attendanceDaily.attendanceDate, dateObj)
//       )
//     )
//     .limit(1)

//   if (existing.length) {
//     await db
//       .update(attendanceDaily)
//       .set({
//         firstIn:         data.firstIn,
//         lastOut:         data.lastOut,
//         workedMinutes:   data.workedMinutes,
//         lateMinutes:     data.lateMinutes,
//         earlyOutMinutes: data.earlyOutMinutes,
//         overtimeMinutes: data.overtimeMinutes,
//         status:          data.status,
//       })
//       .where(eq(attendanceDaily.id, existing[0].id))
//   } else {
//     await db.insert(attendanceDaily).values({
//       employeeId:      data.employeeId,
//       attendanceDate:  dateObj,
//       firstIn:         data.firstIn,
//       lastOut:         data.lastOut,
//       workedMinutes:   data.workedMinutes,
//       lateMinutes:     data.lateMinutes,
//       earlyOutMinutes: data.earlyOutMinutes,
//       overtimeMinutes: data.overtimeMinutes,
//       status:          data.status,
//       createdBy:       1,
//     })
//   }
// }

// // ─── Process single date ───────────────────────────────────────────
// export const processAttendanceForDate = async (attendanceDate: string) => {
//   if (!attendanceDate || !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
//     throw new Error(`Invalid attendanceDate: "${attendanceDate}"`)
//   }

//   const [y, mo, d] = attendanceDate.split('-').map(Number)
//   const startOfDay = new Date(y, mo - 1, d, 0, 0, 0)
//   const endOfDay   = new Date(y, mo - 1, d, 23, 59, 59)

//   const punches = await db
//     .select()
//     .from(attendancePunches)
//     .where(
//       and(
//         gte(attendancePunches.punchTime, startOfDay),
//         lte(attendancePunches.punchTime, endOfDay)
//       )
//     )
//     .orderBy(attendancePunches.employeeId, attendancePunches.punchTime)

//   const grouped = new Map<number, typeof punches>()
//   for (const punch of punches) {
//     if (!grouped.has(punch.employeeId)) grouped.set(punch.employeeId, [])
//     grouped.get(punch.employeeId)!.push(punch)
//   }

//   const activeEmployees = await db
//     .select({ employeeId: employeeModel.employeeId })
//     .from(employeeModel)
//     .where(eq(employeeModel.isActive, true))

//   const results: { employeeId: number; status: AttendanceStatus }[] = []

//   for (const { employeeId } of activeEmployees) {
//     const employeePunches = grouped.get(employeeId) ?? []

//     // ── Attendance Policy + Holiday Calendar ──
//     const policy = await getEmployeeAttendancePolicy(employeeId)

//     // ✅ PRIORITY 1: Holiday check
//     const isHoliday = await isHolidayDate(
//       attendanceDate,
//       policy?.holidayCalendarId ?? null
//     )

//     if (isHoliday) {
//       await upsertAttendanceDaily({
//         employeeId,
//         attendanceDate,
//         firstIn:         employeePunches.length ? toSafeDate(employeePunches[0].punchTime) : null,
//         lastOut:         employeePunches.length ? toSafeDate(employeePunches[employeePunches.length - 1].punchTime) : null,
//         workedMinutes:   0,
//         lateMinutes:     0,
//         earlyOutMinutes: 0,
//         overtimeMinutes: 0,
//         status:          'HOLIDAY',
//       })
//       results.push({ employeeId, status: 'HOLIDAY' })
//       continue
//     }

//     // ✅ PRIORITY 2: Weekend check
//     const isWeekend = await isWeekendDate(
//       attendanceDate,
//       policy?.weekendDayIds ?? []
//     )

//     if (isWeekend) {
//       await upsertAttendanceDaily({
//         employeeId,
//         attendanceDate,
//         firstIn:         null,
//         lastOut:         null,
//         workedMinutes:   0,
//         lateMinutes:     0,
//         earlyOutMinutes: 0,
//         overtimeMinutes: 0,
//         status:          'WEEKEND',
//       })
//       results.push({ employeeId, status: 'WEEKEND' })
//       continue
//     }

//     // ✅ PRIORITY 3: Normal attendance processing
//     const shift = await getEmployeeShift(employeeId, attendanceDate)

//     if (!employeePunches.length || !shift) {
//       await upsertAttendanceDaily({
//         employeeId,
//         attendanceDate,
//         firstIn:         null,
//         lastOut:         null,
//         workedMinutes:   0,
//         lateMinutes:     0,
//         earlyOutMinutes: 0,
//         overtimeMinutes: 0,
//         status:          'ABSENT',
//       })
//       results.push({ employeeId, status: 'ABSENT' })
//       continue
//     }

//     const firstIn = toSafeDate(employeePunches[0].punchTime)
//     const lastOut = toSafeDate(employeePunches[employeePunches.length - 1].punchTime)

//     if (!firstIn || !lastOut) {
//       await upsertAttendanceDaily({
//         employeeId,
//         attendanceDate,
//         firstIn:         null,
//         lastOut:         null,
//         workedMinutes:   0,
//         lateMinutes:     0,
//         earlyOutMinutes: 0,
//         overtimeMinutes: 0,
//         status:          'ABSENT',
//       })
//       results.push({ employeeId, status: 'ABSENT' })
//       continue
//     }

//     const workedMinutes    = differenceInMinutes(lastOut, firstIn)
//     const shiftStart       = combineDateAndTime(attendanceDate, shift.startTime)
//     const shiftEnd         = combineDateAndTime(attendanceDate, shift.endTime)
//     const graceMinutes     = policy?.graceMinutes ?? 0
//     const allowedStart     = new Date(shiftStart.getTime() + graceMinutes * 60000)

//     const lateMinutes = firstIn > allowedStart
//       ? differenceInMinutes(firstIn, allowedStart)
//       : 0

//     const earlyOutMinutes = lastOut < shiftEnd
//       ? differenceInMinutes(shiftEnd, lastOut)
//       : 0

//     const overtimeMinutes = shift && (policy?.allowOvertime)
//       ? Math.max(0, differenceInMinutes(lastOut, shiftEnd))
//       : 0

//     const minimumMinutesForPresent = shift.minimumHoursForPresent * 60
//     const halfDayAfterMinutes      = policy?.halfDayAfterMinutes ?? 120
//     const absentAfterMinutes       = policy?.absentAfterMinutes ?? 240

//     let status: AttendanceStatus

//     if (workedMinutes <= 0 || workedMinutes >= absentAfterMinutes === false && workedMinutes < halfDayAfterMinutes) {
//       status = 'ABSENT'
//     } else if (workedMinutes >= minimumMinutesForPresent) {
//       status = lateMinutes > 0 ? 'LATE' : 'PRESENT'
//     } else if (workedMinutes >= minimumMinutesForPresent / 2) {
//       status = 'HALF_DAY'
//     } else {
//       status = 'ABSENT'
//     }

//     await upsertAttendanceDaily({
//       employeeId,
//       attendanceDate,
//       firstIn,
//       lastOut,
//       workedMinutes,
//       lateMinutes,
//       earlyOutMinutes,
//       overtimeMinutes,
//       status,
//     })

//     results.push({ employeeId, status })
//   }

//   return {
//     success:   true,
//     date:      attendanceDate,
//     processed: results.length,
//     summary: {
//       holiday:  results.filter(r => r.status === 'HOLIDAY').length,
//       weekend:  results.filter(r => r.status === 'WEEKEND').length,
//       present:  results.filter(r => r.status === 'PRESENT').length,
//       late:     results.filter(r => r.status === 'LATE').length,
//       halfDay:  results.filter(r => r.status === 'HALF_DAY').length,
//       absent:   results.filter(r => r.status === 'ABSENT').length,
//     },
//   }
// }

// // ─── Process date range ────────────────────────────────────────────
// export const processAttendanceForRange = async (
//   fromDate: string,
//   toDate:   string
// ) => {
//   const results = []
//   const [fy, fm, fd] = fromDate.split('-').map(Number)
//   const [ty, tm, td] = toDate.split('-').map(Number)

//   const current = new Date(fy, fm - 1, fd)
//   const end     = new Date(ty, tm - 1, td)

//   while (current <= end) {
//     const dateStr = formatDate(current)
//     const result  = await processAttendanceForDate(dateStr)
//     results.push(result)
//     current.setDate(current.getDate() + 1)
//   }

//   return { success: true, results }
// }

