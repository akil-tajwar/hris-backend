import { db } from '../config/database'
import { notifyEmployee } from '../middlewares/notifyEmployee'
import {
  employeeLeaveApplyModel,
  employeeModel,
  NewEmployeeLeaveApply,
  EmployeeLeaveApply,
  leaveTypeModel,
  employeeShiftAllocations,
  shiftDayAndWeekDaysModel,
  attendancePoliciesModel,
  holidaysModel,
  weekDayModel,
  employeeLeaveBalanceModel,
  userModel,
} from '../schemas'
import { and, eq, inArray } from 'drizzle-orm'

// CREATE
export const createEmployeeLeaveApply = async (data: NewEmployeeLeaveApply) => {
  const formatDate = (
    value: string | Date | null | undefined
  ): string | null => {
    if (!value) return null
    return new Date(value).toISOString().split('T')[0]
  }

  return await db.transaction(async (tx) => {
    try {
      // 1. Find employee by userId
      const [employee] = await tx
        .select({
          employeeId: employeeModel.employeeId,
          responsibleEmployeeId: employeeModel.reportingAuthorityId,
        })
        .from(employeeModel)
        .where(eq(employeeModel.userId, data.employeeId))

      if (!employee) {
        throw new Error(`No employee found for userId: ${data.employeeId}`)
      }

      const effectiveFrom = formatDate(data.effectiveFrom)
      const year = new Date(effectiveFrom!).getFullYear()

      // 2. Get balance BEFORE inserting leave
      const [balance] = await tx
        .select()
        .from(employeeLeaveBalanceModel)
        .where(
          and(
            eq(employeeLeaveBalanceModel.employeeId, employee.employeeId),
            eq(employeeLeaveBalanceModel.leaveTypeId, data.leaveTypeId),
            eq(employeeLeaveBalanceModel.year, year)
          )
        )
        .limit(1)

      console.log('💰 Balance found:', balance)

      if (!balance) {
        throw new Error('Leave balance not found')
      }

      // 3. VALIDATION (IMPORTANT)
      if (balance.remainingDays < data.noOfDays) {
        throw new Error(
          `Insufficient leave balance. Remaining: ${balance.remainingDays}, Requested: ${data.noOfDays}`
        )
      }

      // 4. Insert leave application
      const payload = {
        ...data,
        employeeId: employee.employeeId,
        effectiveFrom: formatDate(data.effectiveFrom),
        effectiveTo: formatDate(data.effectiveTo),
        status: 'Pending',
      }

      const result = await tx
        .insert(employeeLeaveApplyModel)
        .values(payload as any)

      // 5. Notify reporting authority
      if (employee.responsibleEmployeeId) {
        await notifyEmployee(
          employee.responsibleEmployeeId,
          'An employee applied for a leave'
        )
      }

      const insertId =
        (result as any)?.[0]?.insertId ?? (result as any)?.insertId

      const [leaveApply] = await tx
        .select()
        .from(employeeLeaveApplyModel)
        .where(
          eq(employeeLeaveApplyModel.employeeLeaveApplyId, Number(insertId))
        )

      return leaveApply
    } catch (error: any) {
      console.error('Error in createEmployeeLeaveApply:', error)
      throw error
    }
  })
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
  return await db.transaction(async (tx) => {
    // 1. Update leave approval
    await tx
      .update(employeeLeaveApplyModel)
      .set({
        approvedByRepAuth: true,
        updatedBy,
      })
      .where(
        eq(employeeLeaveApplyModel.employeeLeaveApplyId, employeeLeaveApplyId)
      )

    // 2. Get HR users (roleId = 2)
    const hrUsers = await tx
      .select({
        userId: userModel.userId,
      })
      .from(userModel)
      .where(eq(userModel.roleId, 2))

    if (!hrUsers.length) {
      return {
        success: true,
        message: 'Leave approved but no HR users found',
      }
    }

    // 3. Get HR employees linked to users
    const hrEmployees = await tx
      .select({
        employeeId: employeeModel.employeeId,
      })
      .from(employeeModel)
      .where(
        inArray(
          employeeModel.userId,
          hrUsers.map((u) => u.userId)
        )
      )

    // 4. Send notifications
    await Promise.all(
      hrEmployees.map((emp) =>
        notifyEmployee(
          emp.employeeId,
          'You have a pending leave approval'
        )
      )
    )

    // 5. Return updated leave
    const [updated] = await tx
      .select()
      .from(employeeLeaveApplyModel)
      .where(
        eq(employeeLeaveApplyModel.employeeLeaveApplyId, employeeLeaveApplyId)
      )

    return updated
  })
}

// APPROVE BY HR
export const approveLeaveByHr = async (
  employeeLeaveApplyId: number,
  updatedBy: number
) => {
  return await db.transaction(async (tx) => {
    console.log('👉 Approving leave ID:', employeeLeaveApplyId)

    // 1. Get leave application
    const [leave] = await tx
      .select()
      .from(employeeLeaveApplyModel)
      .where(
        eq(employeeLeaveApplyModel.employeeLeaveApplyId, employeeLeaveApplyId)
      )

    console.log('📄 Leave application:', leave)

    if (!leave) {
      console.log('❌ Leave not found')
      throw new Error('Leave application not found')
    }

    if (leave.status === 'Approved') {
      console.log('⚠️ Leave already approved')
      throw new Error('Leave already approved')
    }

    const year = new Date(leave.effectiveFrom).getFullYear()
    console.log('📅 Year calculated:', year)

    // 2. Find balance
    console.log('🔍 Searching balance with:')
    console.log({
      employeeId: leave.employeeId,
      leaveTypeId: leave.leaveTypeId,
      year,
    })

    const [balance] = await tx
      .select()
      .from(employeeLeaveBalanceModel)
      .where(
        and(
          eq(employeeLeaveBalanceModel.employeeId, leave.employeeId),
          eq(employeeLeaveBalanceModel.leaveTypeId, leave.leaveTypeId),
          eq(employeeLeaveBalanceModel.year, year)
        )
      )
      .limit(1)

    console.log('💰 Balance result:', balance)

    if (!balance) {
      console.log('❌ No balance found for this employee/leave/year')
      throw new Error('Leave balance not found')
    }

    // 3. Validation
    console.log('🧮 Remaining vs Requested:', {
      remaining: balance.remainingDays,
      requested: leave.noOfDays,
    })

    if (balance.remainingDays < leave.noOfDays) {
      console.log('❌ Insufficient balance')
      throw new Error('Insufficient leave balance')
    }

    // 4. Update balance
    console.log('✏️ Updating balance...')

    await tx
      .update(employeeLeaveBalanceModel)
      .set({
        usedDays: balance.usedDays + leave.noOfDays,
        remainingDays: balance.remainingDays - leave.noOfDays,
      })
      .where(
        eq(
          employeeLeaveBalanceModel.employeeLeaveBalanceId,
          balance.employeeLeaveBalanceId
        )
      )

    console.log('✅ Balance updated')

    // 5. Approve leave
    await tx
      .update(employeeLeaveApplyModel)
      .set({
        approvedByHr: true,
        status: 'Approved',
        updatedBy,
      })
      .where(
        eq(employeeLeaveApplyModel.employeeLeaveApplyId, employeeLeaveApplyId)
      )

    console.log('✅ Leave marked as approved')

    // 6. Final fetch
    const [updated] = await tx
      .select()
      .from(employeeLeaveApplyModel)
      .where(
        eq(employeeLeaveApplyModel.employeeLeaveApplyId, employeeLeaveApplyId)
      )

    if (updated?.employeeId) {
      await notifyEmployee(
        updated.employeeId,
        'Your applied leave have been approved'
      )
    }

    console.log('🎯 Final updated leave:', updated)

    return updated
  })
}

export const rejectLeave = async (
  employeeLeaveApplyId: number,
  updatedBy: number
) => {
  await db
    .update(employeeLeaveApplyModel)
    .set({
      status: 'Rejected',
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

  if (updated?.employeeId) {
    await notifyEmployee(
      updated.employeeId,
      'Your applied leave have been rejected'
    )
  }

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
