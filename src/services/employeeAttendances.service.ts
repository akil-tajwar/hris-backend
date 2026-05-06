import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../config/database'
import {
  employeeAttendanceModel,
  employeeModel,
  employeeOtherSalaryComponentsModel,
  NewEmployeeAttendance,
  otherSalaryComponentsModel,
} from '../schemas'
import { BadRequestError } from './utils/errors.utils'

// Create
export const createEmployeeAttendance = async (
  data:
    | Omit<
        NewEmployeeAttendance,
        'employeeAttendanceId' | 'updatedAt' | 'updatedBy'
      >
    | Omit<
        NewEmployeeAttendance,
        'employeeAttendanceId' | 'updatedAt' | 'updatedBy'
      >[]
) => {
  const records = Array.isArray(data) ? data : [data]
  const now = Date.now()

  // Fetch salary components dynamically at the beginning
  const [absentFeeComponent] = await db
    .select()
    .from(otherSalaryComponentsModel)
    .where(eq(otherSalaryComponentsModel.isAbsentFee, true))
    .limit(1)

  const [lateEarlyOutFeeComponent] = await db
    .select()
    .from(otherSalaryComponentsModel)
    .where(eq(otherSalaryComponentsModel.isLateEarlyOutFee, true))
    .limit(1)

  // Validate that required components exist
  const hasAbsentRecords = records.some((item) => item.isAbsent === true)
  const hasLateEarlyOutRecords = records.some(
    (item) =>
      (item.lateInMinutes && item.lateInMinutes > 0) ||
      (item.earlyOutMinutes && item.earlyOutMinutes > 0)
  )

  if (hasAbsentRecords && !absentFeeComponent) {
    throw BadRequestError(
      'Absent fee salary component not configured. Please contact administrator.'
    )
  }

  if (hasLateEarlyOutRecords && !lateEarlyOutFeeComponent) {
    throw BadRequestError(
      'Late/Early out fee salary component not configured. Please contact administrator.'
    )
  }

  // Fetch all unique employees' basic salaries for optimization
  const uniqueEmployeeIds = [...new Set(records.map((r) => r.employeeId))]
  const employees = await db
    .select({
      employeeId: employeeModel.employeeId,
      basicSalary: employeeModel.basicSalary,
    })
    .from(employeeModel)
    .where(inArray(employeeModel.employeeId, uniqueEmployeeIds))

  const employeeSalaryMap = new Map(
    employees.map((e) => [e.employeeId, e.basicSalary || 0])
  )

  // Validate all employees exist
  for (const employeeId of uniqueEmployeeIds) {
    if (!employeeSalaryMap.has(employeeId)) {
      throw BadRequestError(`Employee with ID ${employeeId} not found`)
    }
  }

  // Collect conflicts
  const conflicts = []
  for (const item of records) {
    const existing = await db
      .select()
      .from(employeeAttendanceModel)
      .where(
        and(
          eq(employeeAttendanceModel.employeeId, item.employeeId),
          eq(employeeAttendanceModel.attendanceDate, item.attendanceDate)
        )
      )

    if (existing.length > 0) {
      conflicts.push(
        `This employee already has attendance for ${item.attendanceDate}`
      )
    }
  }

  if (conflicts.length > 0) {
    throw BadRequestError(conflicts.join(', '))
  }

  // Insert all attendance records
  await db.insert(employeeAttendanceModel).values(
    records.map((item) => ({
      ...item,
      createdAt: new Date(now),
    }))
  )

  // Prepare and insert other salary components
  const salaryComponentsToInsert = []

  for (const item of records) {
    // Parse attendance date to get month and year
    const attendanceDate = new Date(item.attendanceDate)
    const salaryMonth = attendanceDate.toLocaleString('default', {
      month: 'long',
    })
    const salaryYear = attendanceDate.getFullYear()

    let salaryComponentToUse = null

    // Determine which other salary component to add
    if (item.isAbsent === true) {
      salaryComponentToUse = absentFeeComponent
    } else if (
      (item.lateInMinutes && item.lateInMinutes > 0) ||
      (item.earlyOutMinutes && item.earlyOutMinutes > 0)
    ) {
      salaryComponentToUse = lateEarlyOutFeeComponent
    }

    // If we need to add a salary component
    if (salaryComponentToUse) {
      let isAuthorized = true // Default to authorized

      // Get employee's basic salary
      const basicSalary = employeeSalaryMap.get(item.employeeId) || 0

      // Calculate actual amount based on percentage
      const percentageValue = salaryComponentToUse.amount || 0
      const calculatedAmount = (basicSalary * percentageValue) / 100

      // Check if forDays is 0, then always unauthorized
      if (salaryComponentToUse.forDays === 0) {
        isAuthorized = false
      } else {
        // Get count of existing records for this employee, month, year, and component
        const existingCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(employeeOtherSalaryComponentsModel)
          .where(
            and(
              eq(
                employeeOtherSalaryComponentsModel.employeeId,
                item.employeeId
              ),
              eq(
                employeeOtherSalaryComponentsModel.otherSalaryComponentId,
                salaryComponentToUse.otherSalaryComponentId
              ),
              eq(
                employeeOtherSalaryComponentsModel.salaryMonth,
                salaryMonth as
                  | 'January'
                  | 'February'
                  | 'March'
                  | 'April'
                  | 'May'
                  | 'June'
                  | 'July'
                  | 'August'
                  | 'September'
                  | 'October'
                  | 'November'
                  | 'December'
              ),
              eq(employeeOtherSalaryComponentsModel.salaryYear, salaryYear)
            )
          )

        const existingCount = existingCountResult[0]?.count || 0

        // Calculate isAuthorized based on forDays cycle
        const forDays = salaryComponentToUse.forDays || 1 // Default to 1 if null/undefined
        // The cycle: first forDays entries = authorized, next forDays = unauthorized, repeats
        const cyclePosition = existingCount % (forDays * 2)
        isAuthorized = cyclePosition < forDays ? true : false
      }

      salaryComponentsToInsert.push({
        employeeId: item.employeeId,
        otherSalaryComponentId: salaryComponentToUse.otherSalaryComponentId,
        salaryMonth: salaryMonth as
          | 'January'
          | 'February'
          | 'March'
          | 'April'
          | 'May'
          | 'June'
          | 'July'
          | 'August'
          | 'September'
          | 'October'
          | 'November'
          | 'December',
        salaryYear: salaryYear,
        amount: calculatedAmount,
        isAuthorized: isAuthorized,
        createdBy: item.createdBy,
        createdAt: new Date(now),
      })
    }
  }

  // Insert all other salary components if any
  if (salaryComponentsToInsert.length > 0) {
    await db
      .insert(employeeOtherSalaryComponentsModel)
      .values(salaryComponentsToInsert)
  }

  return Array.isArray(data)
    ? records.map((item) => ({ ...item, createdAt: now }))
    : { ...records[0], createdAt: now }
}

// Update
export const editEmployeeAttendance = async (
  employeeAttendanceId: number,
  employeeAttendanceData: Partial<NewEmployeeAttendance>
) => {
  const result = await db
    .update(employeeAttendanceModel)
    .set({
      ...employeeAttendanceData,
      updatedAt: new Date(Date.now()),
    })
    .where(
      eq(employeeAttendanceModel.employeeAttendanceId, employeeAttendanceId)
    )

  // ✅ Correct way for MySQL - result is an array
  // The actual result structure is [ResultSetHeader, undefined][citation:5]
  const affectedRows = result[0]?.affectedRows ?? 0

  if (affectedRows === 0) {
    throw BadRequestError('Employee attendance not found')
  }

  return {
    employeeAttendanceId,
    ...employeeAttendanceData,
  }
}

// Get All
export const getAllEmployeeAttendances = async () => {
  return await db
    .select({
      employeeAttendanceId: employeeAttendanceModel.employeeAttendanceId,
      employeeId: employeeAttendanceModel.employeeId,
      attendanceDate: employeeAttendanceModel.attendanceDate,
      inTime: employeeAttendanceModel.inTime,
      outTime: employeeAttendanceModel.outTime,
      employeeName: employeeModel.empFullName,
      lateInMinutes: employeeAttendanceModel.lateInMinutes,
      earlyOutMinutes: employeeAttendanceModel.earlyOutMinutes,
      isAbsent: employeeAttendanceModel.isAbsent,
      isLeave: employeeAttendanceModel.isLeave,
      createdBy: employeeAttendanceModel.createdBy,
      createdAt: employeeAttendanceModel.createdAt,
      updatedBy: employeeAttendanceModel.updatedBy,
      updatedAt: employeeAttendanceModel.updatedAt,
    })
    .from(employeeAttendanceModel)
    .leftJoin(
      employeeModel,
      eq(employeeAttendanceModel.employeeId, employeeModel.employeeId)
    )
}

// Get By Id
export const getEmployeeAttendanceById = async (
  employeeAttendanceId: number
) => {
  const employeeAttendance = await db
    .select()
    .from(employeeAttendanceModel)
    .where(
      eq(employeeAttendanceModel.employeeAttendanceId, employeeAttendanceId)
    )
    .limit(1)

  if (!employeeAttendance.length) {
    throw BadRequestError('Cloth employeeAttendance not found')
  }

  return employeeAttendance[0]
}

// Delete
export const deleteEmployeeAttendance = async (
  employeeAttendanceId: number
) => {
  const result = await db
    .delete(employeeAttendanceModel)
    .where(
      eq(employeeAttendanceModel.employeeAttendanceId, employeeAttendanceId)
    )
  return { message: 'Fees Group deleted successfully' }
}
