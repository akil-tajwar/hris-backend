import { eq, and, inArray, sql } from 'drizzle-orm'
import { db } from '../config/database'
import {
  employeeShiftAllocations,
  employeeModel,
  shiftModel,
  shiftDayAndWeekDaysModel,
  weekDayModel,
  NewEmployeeShiftAllocation,
} from '../schemas/schema'
import { redis } from '../middlewares/redis'
import { getCache, setCache } from '../middlewares/cache'

const CACHE_KEY = 'shift_allocations:all'

// ─── Date helpers ─────────────────────────────────────────────────
const toDateString = (date: string | Date): string => {
  if (typeof date === 'string') return date.slice(0, 10)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const getNextMonthRange = (fromDate: string) => {
  const [y, m] = fromDate.split('-').map(Number)
  const month = m - 1 // 0-indexed
  const nextMonthIndex = month + 1 > 11 ? 0 : month + 1
  const nextMonthYear = month + 1 > 11 ? y + 1 : y
  const start = new Date(nextMonthYear, nextMonthIndex, 1)
  const end = new Date(nextMonthYear, nextMonthIndex + 1, 0)
  return {
    effectiveFrom: toDateString(start),
    effectiveTo: toDateString(end),
  }
}

const getNextWeekRange = (fromDate: string) => {
  const [y, m, d] = fromDate.split('-').map(Number)
  const start = new Date(y, m - 1, d + 7)
  const end = new Date(y, m - 1, d + 13)
  return {
    effectiveFrom: toDateString(start),
    effectiveTo: toDateString(end),
  }
}

// ─── Day order map ────────────────────────────────────────────────
const DAY_ORDER: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
}

// ─── Shift-aware week range ───────────────────────────────────────
// const getShiftWeekRange = async (shiftId: number, fromDate: string) => {
//   const shiftDays = await db
//     .select({
//       day:     weekDayModel.day,
//       dayType: shiftDayAndWeekDaysModel.dayType,
//     })
//     .from(shiftDayAndWeekDaysModel)
//     .leftJoin(
//       weekDayModel,
//       eq(shiftDayAndWeekDaysModel.weekDayId, weekDayModel.weekDayId)
//     )
//     .where(eq(shiftDayAndWeekDaysModel.shiftId, shiftId))

//   const workingDays = shiftDays
//     .filter((d) => d.dayType !== 'Weekend' && d.day)
//     .map((d) => DAY_ORDER[d.day!])
//     .sort((a, b) => a - b)

//   if (!workingDays.length) return getNextWeekRange(fromDate)

//   const weekStartDay = workingDays[0]
//   const weekEndDay   = workingDays[workingDays.length - 1]

//   const [y, m, d] = fromDate.split('-').map(Number)
//   const date       = new Date(y, m - 1, d)
//   const currentDow = date.getDay()

//   let daysToAdd = weekStartDay - currentDow
//   if (daysToAdd <= 0) daysToAdd += 7

//   const start = new Date(y, m - 1, d + daysToAdd)
//   const weekLength =
//     weekEndDay >= weekStartDay
//       ? weekEndDay - weekStartDay
//       : 7 - weekStartDay + weekEndDay
//   const end = new Date(
//     start.getFullYear(),
//     start.getMonth(),
//     start.getDate() + weekLength
//   )

//   return {
//     effectiveFrom: toDateString(start),
//     effectiveTo:   toDateString(end),
//   }
// }
// ─── Shift-aware week range ───────────────────────────────────────
const getShiftWeekRange = async (shiftId: number, fromDate: string) => {
  const shiftDays = await db
    .select({
      day: weekDayModel.day,
      dayType: shiftDayAndWeekDaysModel.dayType,
    })
    .from(shiftDayAndWeekDaysModel)
    .leftJoin(
      weekDayModel,
      eq(shiftDayAndWeekDaysModel.weekDayId, weekDayModel.weekDayId)
    )
    .where(eq(shiftDayAndWeekDaysModel.shiftId, shiftId))

  const workingDays = shiftDays
    .filter((d) => d.dayType !== 'Weekend' && d.day)
    .map((d) => DAY_ORDER[d.day!])
    .sort((a, b) => a - b)

  if (!workingDays.length) return getNextWeekRange(fromDate)

  const weekStartDay = workingDays[0]
  const weekEndDay = workingDays[workingDays.length - 1]

  const [y, m, d] = fromDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const currentDow = date.getDay()

  let diff = weekStartDay - currentDow
  if (diff > 0) diff -= 7 // forward হলে পিছিয়ে আসো (current week)

  const start = new Date(y, m - 1, d + diff)

  const weekLength =
    weekEndDay >= weekStartDay
      ? weekEndDay - weekStartDay
      : 7 - weekStartDay + weekEndDay

  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + weekLength
  )

  return {
    effectiveFrom: toDateString(start),
    effectiveTo: toDateString(end),
  }
}

// ─── CREATE SINGLE ────────────────────────────────────────────────
export const createSingleShiftAllocation = async (
  data: NewEmployeeShiftAllocation
) => {
  const employee = await db.query.employeeModel.findFirst({
    where: eq(employeeModel.employeeId, data.employeeId),
  })
  if (!employee) throw new Error(`Employee ${data.employeeId} পাওয়া যায়নি`)

  const shift = await db.query.shiftModel.findFirst({
    where: eq(shiftModel.shiftId, data.shiftId),
  })
  if (!shift) throw new Error(`Shift ${data.shiftId} পাওয়া যায়নি`)

  // Duplicate check
  const existing = await db
    .select()
    .from(employeeShiftAllocations)
    .where(
      and(
        eq(employeeShiftAllocations.employeeId, data.employeeId),
        eq(
          employeeShiftAllocations.effectiveFrom,
          toDateString(data.effectiveFrom)
        )
      )
    )
    .limit(1)

  if (existing.length > 0)
    throw new Error(
      `এই employee এর জন্য ${toDateString(data.effectiveFrom)} তারিখে ইতিমধ্যে allocation আছে`
    )

  const [result] = await db.insert(employeeShiftAllocations).values({
    employeeId: data.employeeId,
    shiftId: data.shiftId,
    effectiveFrom: toDateString(data.effectiveFrom),
    effectiveTo: data.effectiveTo ? toDateString(data.effectiveTo) : null,
    remarks: data.remarks ?? null,
    approvedBy: data.approvedBy ?? null,
    createdBy: data.createdBy,
    recurrenceType: data.recurrenceType ?? null,
    recurrenceActive: data.recurrenceActive ?? 0,
  })

  await redis.del(CACHE_KEY)

  return {
    success: true,
    insertedId: Number(result.insertId),
    message: 'Shift allocation সফল হয়েছে',
  }
}

// ─── CREATE BULK ──────────────────────────────────────────────────
export const createBulkShiftAllocation = async (
  data: Omit<NewEmployeeShiftAllocation, 'employeeId'> & {
    employeeIds: number[]
  }
) => {
  if (!data.employeeIds.length)
    throw new Error('কমপক্ষে একজন employee দিতে হবে')

  const { employeeIds, ...rest } = data

  const employees = await db.query.employeeModel.findMany({
    where: (employeeModel, { inArray }) =>
      inArray(employeeModel.employeeId, employeeIds),
    columns: { employeeId: true, empFullName: true },
  })

  const foundIds = employees.map((e) => e.employeeId)
  const missingIds = employeeIds.filter((id) => !foundIds.includes(id))
  if (missingIds.length)
    throw new Error(
      `এই employee ID গুলো পাওয়া যায়নি: ${missingIds.join(', ')}`
    )

  const shift = await db.query.shiftModel.findFirst({
    where: eq(shiftModel.shiftId, rest.shiftId),
  })
  if (!shift) throw new Error(`Shift ${rest.shiftId} পাওয়া যায়নি`)

  // Duplicate check
  const existingAllocations = await db
    .select({ employeeId: employeeShiftAllocations.employeeId })
    .from(employeeShiftAllocations)
    .where(
      and(
        inArray(employeeShiftAllocations.employeeId, employeeIds),
        eq(
          employeeShiftAllocations.effectiveFrom,
          toDateString(rest.effectiveFrom)
        )
      )
    )

  if (existingAllocations.length > 0) {
    const duplicateIds = existingAllocations.map((e) => e.employeeId)
    throw new Error(
      `এই employee ID গুলোর জন্য ${toDateString(rest.effectiveFrom)} তারিখে ইতিমধ্যে allocation আছে: ${duplicateIds.join(', ')}`
    )
  }

  const rows = employeeIds.map((employeeId) => ({
    employeeId,
    shiftId: rest.shiftId,
    effectiveFrom: toDateString(rest.effectiveFrom),
    effectiveTo: rest.effectiveTo ? toDateString(rest.effectiveTo) : null,
    remarks: rest.remarks ?? null,
    approvedBy: rest.approvedBy ?? null,
    createdBy: rest.createdBy,
    recurrenceType: rest.recurrenceType ?? null,
    recurrenceActive: rest.recurrenceActive ?? 0,
  }))

  await db.insert(employeeShiftAllocations).values(rows)
  await redis.del(CACHE_KEY)

  return {
    success: true,
    totalAllocated: rows.length,
    employees: employees.map((e) => ({
      id: e.employeeId,
      name: e.empFullName,
    })),
    message: `${rows.length} জন employee-র shift allocation সফল হয়েছে`,
  }
}

// ─── UPDATE ───────────────────────────────────────────────────────
export const updateShiftAllocation = async (
  id: number,
  data: Partial<NewEmployeeShiftAllocation>
) => {
  const existing = await db.query.employeeShiftAllocations.findFirst({
    where: eq(employeeShiftAllocations.id, id),
  })
  if (!existing) throw new Error('Shift allocation পাওয়া যায়নি')

  await db
    .update(employeeShiftAllocations)
    .set({
      ...(data.shiftId !== undefined && { shiftId: data.shiftId }),
      ...(data.remarks !== undefined && { remarks: data.remarks }),
      ...(data.approvedBy !== undefined && { approvedBy: data.approvedBy }),
      ...(data.effectiveFrom && {
        effectiveFrom: toDateString(data.effectiveFrom),
      }),
      ...(data.effectiveTo !== undefined && {
        effectiveTo: data.effectiveTo ? toDateString(data.effectiveTo) : null,
      }),
    })
    .where(eq(employeeShiftAllocations.id, id))

  await redis.del(CACHE_KEY)

  return await db.query.employeeShiftAllocations.findFirst({
    where: eq(employeeShiftAllocations.id, id),
  })
}

// ─── UPDATE RECURRENCE SETTING ────────────────────────────────────
export const updateRecurrenceSetting = async (
  id: number,
  recurrenceType: 'weekly' | 'monthly' | null,
  recurrenceActive: boolean
) => {
  const existing = await db.query.employeeShiftAllocations.findFirst({
    where: eq(employeeShiftAllocations.id, id),
  })
  if (!existing) throw new Error('Shift allocation পাওয়া যায়নি')

  await db
    .update(employeeShiftAllocations)
    .set({
      recurrenceType: recurrenceType,
      recurrenceActive: recurrenceActive ? 1 : 0,
    })
    .where(eq(employeeShiftAllocations.id, id))

  await redis.del(CACHE_KEY)

  return await db.query.employeeShiftAllocations.findFirst({
    where: eq(employeeShiftAllocations.id, id),
  })
}

// ─── COPY SINGLE ──────────────────────────────────────────────────
export const copyShiftAllocation = async (id: number, createdBy: number) => {
  const existing = await db.query.employeeShiftAllocations.findFirst({
    where: eq(employeeShiftAllocations.id, id),
  })
  if (!existing) throw new Error('Shift allocation পাওয়া যায়নি')
  if (!existing.recurrenceType) throw new Error('Recurrence type set করা নেই')

  const dateRange =
    existing.recurrenceType === 'weekly'
      ? await getShiftWeekRange(existing.shiftId, existing.effectiveFrom)
      : getNextMonthRange(existing.effectiveFrom)

  // Duplicate check
  const duplicate = await db
    .select()
    .from(employeeShiftAllocations)
    .where(
      and(
        eq(employeeShiftAllocations.employeeId, existing.employeeId),
        eq(employeeShiftAllocations.effectiveFrom, dateRange.effectiveFrom)
      )
    )
    .limit(1)

  if (duplicate.length > 0)
    throw new Error(
      `${dateRange.effectiveFrom} তারিখে এই employee এর allocation ইতিমধ্যে আছে`
    )

  const [result] = await db.insert(employeeShiftAllocations).values({
    employeeId: existing.employeeId,
    shiftId: existing.shiftId,
    effectiveFrom: dateRange.effectiveFrom,
    effectiveTo: dateRange.effectiveTo,
    remarks: existing.remarks,
    approvedBy: existing.approvedBy,
    createdBy: createdBy,
    recurrenceType: existing.recurrenceType,
    recurrenceActive: existing.recurrenceActive,
  })

  await redis.del(CACHE_KEY)

  return {
    success: true,
    insertedId: Number(result.insertId),
    dateRange,
    message: `${existing.recurrenceType === 'weekly' ? 'Weekly' : 'Monthly'} allocation copy সফল হয়েছে`,
  }
}

// ─── COPY ALL ACTIVE ──────────────────────────────────────────────
export const copyAllActiveAllocations = async (
  recurrenceType: 'weekly' | 'monthly',
  createdBy: number
) => {
  const activeAllocations = await db
    .select()
    .from(employeeShiftAllocations)
    .where(
      and(
        eq(employeeShiftAllocations.recurrenceType, recurrenceType),
        eq(employeeShiftAllocations.recurrenceActive, 1)
      )
    )

  if (!activeAllocations.length)
    throw new Error(`কোনো active ${recurrenceType} allocation পাওয়া যায়নি`)

  // প্রতিটা employee এর latest allocation বের করো
  const latestPerEmployee = new Map<number, (typeof activeAllocations)[0]>()
  for (const alloc of activeAllocations) {
    const existing = latestPerEmployee.get(alloc.employeeId)
    if (!existing || alloc.effectiveFrom > existing.effectiveFrom) {
      latestPerEmployee.set(alloc.employeeId, alloc)
    }
  }

  const latestAllocations = Array.from(latestPerEmployee.values())

  // প্রতিটার জন্য আলাদাভাবে next date calculate করো
  const rowsPromises = latestAllocations.map(async (alloc) => {
    const dateRange =
      recurrenceType === 'weekly'
        ? await getShiftWeekRange(alloc.shiftId, alloc.effectiveFrom)
        : getNextMonthRange(alloc.effectiveFrom)

    return {
      employeeId: alloc.employeeId,
      shiftId: alloc.shiftId,
      effectiveFrom: dateRange.effectiveFrom,
      effectiveTo: dateRange.effectiveTo,
      remarks: alloc.remarks,
      approvedBy: alloc.approvedBy,
      createdBy: createdBy,
      recurrenceType: alloc.recurrenceType,
      recurrenceActive: alloc.recurrenceActive,
    }
  })

  const rows = await Promise.all(rowsPromises)

  // Duplicate check — employee + effectiveFrom combination
  const employeeIds = rows.map((r) => r.employeeId)
  const fromDates = [...new Set(rows.map((r) => r.effectiveFrom))]

  const alreadyExists = await db
    .select({ employeeId: employeeShiftAllocations.employeeId })
    .from(employeeShiftAllocations)
    .where(
      and(
        inArray(employeeShiftAllocations.employeeId, employeeIds),
        inArray(employeeShiftAllocations.effectiveFrom, fromDates)
      )
    )

  const existingSet = new Set(alreadyExists.map((e) => `${e.employeeId}`))
  const filteredRows = rows.filter((r) => !existingSet.has(`${r.employeeId}`))

  if (!filteredRows.length)
    throw new Error(`সব employee এর পরবর্তী period এ allocation ইতিমধ্যে আছে`)

  await db.insert(employeeShiftAllocations).values(filteredRows)
  await redis.del(CACHE_KEY)

  return {
    success: true,
    totalCopied: filteredRows.length,
    skipped: rows.length - filteredRows.length,
    message: `${filteredRows.length} টি allocation copy হয়েছে${
      rows.length - filteredRows.length > 0
        ? `, ${rows.length - filteredRows.length} টি skip হয়েছে (duplicate)`
        : ''
    }`,
  }
}

// ─── GET ALL ──────────────────────────────────────────────────────
export const getAllShiftAllocations = async () => {
  const cached = await getCache(CACHE_KEY)
  if (cached) {
    console.log('⚡ Redis HIT')
    return cached
  }

  console.log('🐢 MySQL QUERY (CACHE MISS)')

  const result = await db
    .select({
      id: employeeShiftAllocations.id,
      employeeId: employeeShiftAllocations.employeeId,
      employeeName: employeeModel.empFullName,
      shiftId: employeeShiftAllocations.shiftId,
      shiftName: shiftModel.shiftName,
      effectiveFrom: employeeShiftAllocations.effectiveFrom,
      effectiveTo: employeeShiftAllocations.effectiveTo,
      remarks: employeeShiftAllocations.remarks,
      approvedBy: employeeShiftAllocations.approvedBy,
      createdBy: employeeShiftAllocations.createdBy,
      createdAt: employeeShiftAllocations.createdAt,
      recurrenceType: employeeShiftAllocations.recurrenceType,
      recurrenceActive: employeeShiftAllocations.recurrenceActive,
    })
    .from(employeeShiftAllocations)
    .leftJoin(
      employeeModel,
      eq(employeeShiftAllocations.employeeId, employeeModel.employeeId)
    )
    .leftJoin(
      shiftModel,
      eq(employeeShiftAllocations.shiftId, shiftModel.shiftId)
    )

  await setCache(CACHE_KEY, result, 300)
  return result
}

// ─── GET BY ID ────────────────────────────────────────────────────
export const getShiftAllocationById = async (id: number) => {
  const result = await db
    .select({
      id: employeeShiftAllocations.id,
      employeeId: employeeShiftAllocations.employeeId,
      employeeName: employeeModel.empFullName,
      shiftId: employeeShiftAllocations.shiftId,
      shiftName: shiftModel.shiftName,
      effectiveFrom: employeeShiftAllocations.effectiveFrom,
      effectiveTo: employeeShiftAllocations.effectiveTo,
      remarks: employeeShiftAllocations.remarks,
      approvedBy: employeeShiftAllocations.approvedBy,
      createdBy: employeeShiftAllocations.createdBy,
      createdAt: employeeShiftAllocations.createdAt,
      recurrenceType: employeeShiftAllocations.recurrenceType,
      recurrenceActive: employeeShiftAllocations.recurrenceActive,
    })
    .from(employeeShiftAllocations)
    .leftJoin(
      employeeModel,
      eq(employeeShiftAllocations.employeeId, employeeModel.employeeId)
    )
    .leftJoin(
      shiftModel,
      eq(employeeShiftAllocations.shiftId, shiftModel.shiftId)
    )
    .where(eq(employeeShiftAllocations.id, id))
    .limit(1)

  return result[0] ?? null
}

// ─── GET BY EMPLOYEE ──────────────────────────────────────────────
export const getShiftAllocationsByEmployee = async (employeeId: number) => {
  return await db
    .select({
      id: employeeShiftAllocations.id,
      shiftId: employeeShiftAllocations.shiftId,
      shiftName: shiftModel.shiftName,
      effectiveFrom: employeeShiftAllocations.effectiveFrom,
      effectiveTo: employeeShiftAllocations.effectiveTo,
      remarks: employeeShiftAllocations.remarks,
      createdAt: employeeShiftAllocations.createdAt,
      recurrenceType: employeeShiftAllocations.recurrenceType,
      recurrenceActive: employeeShiftAllocations.recurrenceActive,
    })
    .from(employeeShiftAllocations)
    .leftJoin(
      shiftModel,
      eq(employeeShiftAllocations.shiftId, shiftModel.shiftId)
    )
    .where(eq(employeeShiftAllocations.employeeId, employeeId))
}

// ─── DELETE ───────────────────────────────────────────────────────
export const deleteShiftAllocation = async (id: number) => {
  const existing = await db.query.employeeShiftAllocations.findFirst({
    where: eq(employeeShiftAllocations.id, id),
  })
  if (!existing) throw new Error('Shift allocation পাওয়া যায়নি')

  await db
    .delete(employeeShiftAllocations)
    .where(eq(employeeShiftAllocations.id, id))

  await redis.del(CACHE_KEY)

  return {
    message: 'Shift allocation মুছে ফেলা হয়েছে',
    deletedAllocation: existing,
  }
}

export const getEmployeeWeekDaysByUserId = async (userId: number) => {
  // Get employee from userId
  const employee = await db.query.employeeModel.findFirst({
    where: eq(employeeModel.userId, userId),
  })

  if (!employee) {
    throw new Error('Employee not found')
  }

  // Get all allocated weekdays
  const weekDays = await db
    .select({
      employeeId: sql<number>`${employee.employeeId}`.as('employeeId'),
      shiftId: employeeShiftAllocations.shiftId,
      weekDayId: weekDayModel.weekDayId,
      day: weekDayModel.day,
      dayType: shiftDayAndWeekDaysModel.dayType,
      startTime: shiftDayAndWeekDaysModel.startTime,
      endTime: shiftDayAndWeekDaysModel.endTime,
      breakMinutes: shiftDayAndWeekDaysModel.breakMinutes,
      expectedWorkHours: shiftDayAndWeekDaysModel.expectedWorkHours,
      minimumHoursForPresent: shiftDayAndWeekDaysModel.minimumHoursForPresent,
    })
    .from(employeeShiftAllocations)
    .innerJoin(
      shiftDayAndWeekDaysModel,
      eq(employeeShiftAllocations.shiftId, shiftDayAndWeekDaysModel.shiftId)
    )
    .innerJoin(
      weekDayModel,
      eq(shiftDayAndWeekDaysModel.weekDayId, weekDayModel.weekDayId)
    )
    .where(eq(employeeShiftAllocations.employeeId, employee.employeeId))

  return weekDays
}
