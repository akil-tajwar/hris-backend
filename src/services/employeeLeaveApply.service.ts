import { db } from '../config/database'
import {
  employeeLeaveApplyModel,
  employeeModel,
  leavePolicyMasterModel,
  leavePolicyDetailsModel,
  NewEmployeeLeaveApply,
  EmployeeLeaveApply,
  leaveTypeModel,
  employeeShiftAllocations,
  shiftDayAndWeekDaysModel,
  attendancePoliciesModel,
  holidaysModel,
  weekDayModel,
} from '../schemas'
import { and, eq, gte, lte } from 'drizzle-orm'

// CREATE
export const createEmployeeLeaveApply = async (
  data: NewEmployeeLeaveApply
) => {
  const formatDate = (
    value: string | Date | null | undefined
  ): string | null => {
    if (!value) return null
  
    return new Date(value).toISOString().split('T')[0]
  }

  try {
    // Find employee by userId
    const [employee] = await db
      .select({
        employeeId: employeeModel.employeeId,
      })
      .from(employeeModel)
      .where(eq(employeeModel.userId, data.employeeId))

    if (!employee) {
      throw new Error(
        `No employee found for userId: ${data.employeeId}`
      )
    }

    const payload = {
      ...data,
      employeeId: employee.employeeId, // replace userId with actual employeeId
      effectiveFrom: formatDate(data.effectiveFrom),
      effectiveTo: formatDate(data.effectiveTo),
    }

    const result = await db
      .insert(employeeLeaveApplyModel)
      .values(payload)

    const insertId =
      (result as any)?.[0]?.insertId ?? (result as any)?.insertId

    const [leaveApply] = await db
      .select()
      .from(employeeLeaveApplyModel)
      .where(
        eq(
          employeeLeaveApplyModel.employeeLeaveApplyId,
          Number(insertId)
        )
      )

    return leaveApply
  } catch (error: any) {
    console.error('================ DATABASE ERROR ================')
    console.error('Message:', error?.message)
    console.error('SQL Message:', error?.cause?.sqlMessage)
    console.error('Code:', error?.cause?.code)
    console.error('Full Cause:', error?.cause)
    console.error('===============================================')

    throw error
  }
}

// READ ALL
export const getEmployeeLeaveApplications = async () => {
  return await db
    .select({
      employeeLeaveApplyId: employeeLeaveApplyModel.employeeLeaveApplyId,

      employeeId: employeeLeaveApplyModel.employeeId,
      empFullName: employeeModel.empFullName,
      empCode: employeeModel.empCode,

      leaveTypeId: employeeLeaveApplyModel.leaveTypeId,
      leaveTypeName: leaveTypeModel.name,

      effectiveFrom: employeeLeaveApplyModel.effectiveFrom,
      effectiveTo: employeeLeaveApplyModel.effectiveTo,
      noOfDays: employeeLeaveApplyModel.noOfDays,
      status: employeeLeaveApplyModel.status,
      approvedByRepAuth: employeeLeaveApplyModel.approvedByRepAuth,
      approvedByHr: employeeLeaveApplyModel.approvedByHr,

      createdBy: employeeLeaveApplyModel.createdBy,
      createdAt: employeeLeaveApplyModel.createdAt,

      updatedBy: employeeLeaveApplyModel.updatedBy,
      updatedAt: employeeLeaveApplyModel.updatedAt,
    })
    .from(employeeLeaveApplyModel)

    // employee join
    .leftJoin(
      employeeModel,
      eq(employeeLeaveApplyModel.employeeId, employeeModel.employeeId)
    )

    // leave type join
    .leftJoin(
      leaveTypeModel,
      eq(employeeLeaveApplyModel.leaveTypeId, leaveTypeModel.leaveTypeId)
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
      eq(employeeLeaveApplyModel.employeeLeaveApplyId, employeeLeaveApplyId)
    )

  const [updated] = await db
    .select()
    .from(employeeLeaveApplyModel)
    .where(
      eq(employeeLeaveApplyModel.employeeLeaveApplyId, employeeLeaveApplyId)
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
      eq(employeeLeaveApplyModel.employeeLeaveApplyId, employeeLeaveApplyId)
    )

  const [updated] = await db
    .select()
    .from(employeeLeaveApplyModel)
    .where(
      eq(employeeLeaveApplyModel.employeeLeaveApplyId, employeeLeaveApplyId)
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
      eq(employeeLeaveApplyModel.employeeLeaveApplyId, employeeLeaveApplyId)
    )

  const [updated] = await db
    .select()
    .from(employeeLeaveApplyModel)
    .where(
      eq(employeeLeaveApplyModel.employeeLeaveApplyId, employeeLeaveApplyId)
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
      eq(employeeLeaveApplyModel.employeeLeaveApplyId, employeeLeaveApplyId)
    )
}

//returns noOfDays
const formatDate = (d: Date) => d.toISOString().split('T')[0]

const getDatesBetween = (from: Date, to: Date) => {
  const dates: string[] = []
  const current = new Date(from)

  while (current <= to) {
    dates.push(formatDate(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

const weekdayNames = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

// ---------------- SERVICE ----------------
export const calculateLeaveDaysService = async ({
  userId,
  leaveTypeId,
  fromDate,
  toDate,
}: {
  userId: number
  leaveTypeId: number
  fromDate: string
  toDate: string
}) => {
  // 1. Employee
  const employee = await db
    .select()
    .from(employeeModel)
    .where(eq(employeeModel.userId, userId))
    .limit(1)

  if (!employee.length) throw new Error('Employee not found')

  const employeeId = employee[0].employeeId

  // 2. Leave Type
  const leaveType = await db
    .select()
    .from(leaveTypeModel)
    .where(eq(leaveTypeModel.leaveTypeId, leaveTypeId))
    .limit(1)

  if (!leaveType.length) throw new Error('Leave type not found')

  const sandwichPolicyApplicable =
    leaveType[0].sandwichPolicyApplicable ?? false

  const allDates = getDatesBetween(new Date(fromDate), new Date(toDate))

  // CASE 1: no sandwich policy
  if (!sandwichPolicyApplicable) {
    return allDates.length
  }

  // ---------------- SHIFT WEEKENDS ----------------
  const shiftAlloc = await db
    .select()
    .from(employeeShiftAllocations)
    .where(eq(employeeShiftAllocations.employeeId, employeeId))
    .limit(1)

  let weekendDays: string[] = []

  if (shiftAlloc.length) {
    const shiftId = shiftAlloc[0].shiftId

    const weekendRows = await db
      .select({
        day: weekDayModel.day,
      })
      .from(shiftDayAndWeekDaysModel)
      .innerJoin(
        weekDayModel,
        eq(shiftDayAndWeekDaysModel.weekDayId, weekDayModel.weekDayId)
      )
      .where(
        and(
          eq(shiftDayAndWeekDaysModel.shiftId, shiftId),
          eq(shiftDayAndWeekDaysModel.dayType, 'Weekend')
        )
      )

    weekendDays = weekendRows.map((r) => r.day)
  }

  // ---------------- HOLIDAYS ----------------
  const activePolicy = await db
    .select()
    .from(attendancePoliciesModel)
    .where(eq(attendancePoliciesModel.isActive, true))
    .limit(1)

  const holidaySet = new Set<string>()

  if (activePolicy.length && activePolicy[0].holidayCalendarId) {
    const holidays = await db
      .select()
      .from(holidaysModel)
      .where(eq(holidaysModel.calendarId, activePolicy[0].holidayCalendarId))

    for (const h of holidays) {
      const dateOnly = formatDate(new Date(h.date))

      // filter range in JS (avoids timestamp mismatch issues)
      if (dateOnly >= fromDate && dateOnly <= toDate) {
        holidaySet.add(dateOnly)
      }
    }
  }

  // ---------------- FINAL CALCULATION ----------------
  const excluded = new Set<string>()

  for (const dateStr of allDates) {
    const date = new Date(dateStr)

    const dayName = weekdayNames[date.getDay()]

    const isWeekend = weekendDays.includes(dayName)
    const isHoliday = holidaySet.has(dateStr)

    if (isWeekend || isHoliday) {
      excluded.add(dateStr)
    }
  }

  return allDates.length - excluded.size
}
