import { db } from '../config/database'
import {
  departmentModel,
  designationModel,
  employeeAttendanceModel,
  EmployeeLeave,
  employeeLeaveModel,
  employeeLeaveTypeModel,
  employeeModel,
  employeeOtherSalaryComponentsModel,
  leaveTypeModel,
  NewEmployeeLeave,
  otherSalaryComponentsModel,
} from '../schemas'
import { and, eq, sql } from 'drizzle-orm'
import { BadRequestError } from './utils/errors.utils'

// CREATE
export const createEmployeeLeave = async (data: NewEmployeeLeave) => {
  const now = new Date() // Use Date object instead of Date.now()

  // Parse dates - ensure they're Date objects
  const startDate = new Date(data.startDate)
  const endDate = new Date(data.endDate)

  // Validate date range
  if (startDate > endDate) {
    throw BadRequestError('Start date cannot be after end date')
  }

  // Fetch employee
  const [employee] = await db
    .select()
    .from(employeeModel)
    .where(eq(employeeModel.employeeId, data.employeeId))
    .limit(1)

  if (!employee) {
    throw BadRequestError('Employee not found')
  }

  // Fetch leave type
  const [leaveType] = await db
    .select()
    .from(leaveTypeModel)
    .where(eq(leaveTypeModel.leaveTypeId, data.leaveTypeId))
    .limit(1)

  if (!leaveType) {
    throw BadRequestError('Leave type not found')
  }

  // Check eligibility
  const [employeeLeaveType] = await db
    .select()
    .from(employeeLeaveTypeModel)
    .where(
      and(
        eq(employeeLeaveTypeModel.employeeId, data.employeeId),
        eq(employeeLeaveTypeModel.leaveTypeId, data.leaveTypeId)
      )
    )
    .limit(1)

  if (!employeeLeaveType) {
    throw BadRequestError('Employee is not eligible for this leave type')
  }

  // Calculate requested leave days
  const leaveDays =
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1

  // Year period
  const currentYear = new Date().getFullYear()
  const periodStartDate = new Date(currentYear, 0, 1)
  const periodEndDate = new Date(currentYear, 11, 31)

  // ✅ FIXED: Use proper date comparison for MySQL
  const existingLeaves = await db
    .select({
      startDate: employeeLeaveModel.startDate,
      endDate: employeeLeaveModel.endDate,
    })
    .from(employeeLeaveModel)
    .where(
      and(
        eq(employeeLeaveModel.employeeId, data.employeeId),
        eq(employeeLeaveModel.leaveTypeId, data.leaveTypeId),
        // MySQL date comparison - use Date objects directly
        sql`${employeeLeaveModel.startDate} <= ${periodEndDate}`,
        sql`${employeeLeaveModel.endDate} >= ${periodStartDate}`
      )
    )

  // Calculate total taken leave days
  let totalTakenLeaveDays = 0

  for (const leave of existingLeaves) {
    const start = new Date(leave.startDate)
    const end = new Date(leave.endDate)

    const days =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    totalTakenLeaveDays += days
  }

  // Final validation
  if (totalTakenLeaveDays + leaveDays > leaveType.totalLeaves) {
    throw BadRequestError(
      `Leave limit exceeded. Already taken ${totalTakenLeaveDays} days out of ${leaveType.totalLeaves}. Requested ${leaveDays} days.`
    )
  }

  // ✅ FIXED: Insert leave with proper MySQL date handling
  const result = await db.insert(employeeLeaveModel).values({
    ...data,
    startDate: startDate, // Use Date object directly
    endDate: endDate, // Use Date object directly
    createdAt: now,
    updatedAt: now,
  })

  // ✅ FIXED: Get insertId from MySQL result array
  const employeeLeaveId = Number(result[0].insertId)

  // Generate date array
  const dateArray: Date[] = []
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    dateArray.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const attendanceRecords = []
  const salaryComponentsToInsert = []

  // Fetch absent deduction component where isAbsentFee = 1
  const [salaryComponent] = await db
    .select()
    .from(otherSalaryComponentsModel)
    .where(eq(otherSalaryComponentsModel.isAbsentFee, true))
    .limit(1)

  if (!salaryComponent) {
    throw BadRequestError(
      'Absent fee salary component not configured. Please contact administrator.'
    )
  }

  // Get employee's basic salary for percentage calculation
  const basicSalary = employee.basicSalary || 0
  const percentageValue = salaryComponent.amount || 0
  const calculatedAmount = (basicSalary * percentageValue) / 100

  for (const date of dateArray) {
    // ✅ FIXED: Pass Date object instead of string for MySQL DATE field
    const attendanceDate = new Date(date)
    const salaryMonth = date.toLocaleString('default', { month: 'long' })
    const salaryYear = date.getFullYear()

    // Check attendance exists
    const [existingAttendance] = await db
      .select()
      .from(employeeAttendanceModel)
      .where(
        and(
          eq(employeeAttendanceModel.employeeId, data.employeeId),
          eq(employeeAttendanceModel.attendanceDate, attendanceDate)
        )
      )
      .limit(1)

    if (existingAttendance) {
      throw BadRequestError(
        `Attendance already exists for employee on ${attendanceDate.toISOString().split('T')[0]}`
      )
    }

    // Attendance insert
    attendanceRecords.push({
      employeeId: data.employeeId,
      attendanceDate: attendanceDate, // Date object
      isAbsent: true,
      isLeave: true,
      createdBy: data.createdBy,
      createdAt: now,
    })

    // Salary deduction insert
    if (salaryComponent) {
      salaryComponentsToInsert.push({
        employeeId: data.employeeId,
        otherSalaryComponentId: salaryComponent.otherSalaryComponentId,
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
        salaryYear,
        amount: calculatedAmount,
        isAuthorized: true,
        createdBy: data.createdBy,
        createdAt: now,
      })
    }
  }

  // Bulk insert attendance
  if (attendanceRecords.length) {
    await db.insert(employeeAttendanceModel).values(attendanceRecords)
  }

  // Bulk insert salary components
  if (salaryComponentsToInsert.length) {
    await db
      .insert(employeeOtherSalaryComponentsModel)
      .values(salaryComponentsToInsert)
  }

  // Return created leave
  const [employeeLeave] = await db
    .select()
    .from(employeeLeaveModel)
    .where(eq(employeeLeaveModel.employeeLeaveId, employeeLeaveId))

  return employeeLeave
}
// READ ALL
export const getEmployeeLeaves = async () => {
  return await db
    .select({
      // EmployeeLeave fields
      employeeLeaveId: employeeLeaveModel.employeeLeaveId,
      employeeId: employeeLeaveModel.employeeId,
      startDate: employeeLeaveModel.startDate,
      endDate: employeeLeaveModel.endDate,
      noOfDays: employeeLeaveModel.noOfDays,
      leaveTypeId: employeeLeaveModel.leaveTypeId,
      description: employeeLeaveModel.description,
      createdBy: employeeLeaveModel.createdBy,
      createdAt: employeeLeaveModel.createdAt,
      updatedBy: employeeLeaveModel.updatedBy,
      updatedAt: employeeLeaveModel.updatedAt,
      // Employee fields (adjust based on your employeeModel schema)
      empCode: employeeModel.empCode,
      employeeName: employeeModel.empFullName,
      departmentName: departmentModel.departmentName, // Assuming designation has department info
      designationName: designationModel.designationName,
      // LeaveType fields (adjust based on your leaveTypeModel schema)
      leaveTypeName: leaveTypeModel.leaveTypeName,
      // Add other fields as needed
    })
    .from(employeeLeaveModel)
    .leftJoin(
      employeeModel,
      eq(employeeLeaveModel.employeeId, employeeModel.employeeId)
    )
    .leftJoin(
      leaveTypeModel,
      eq(employeeLeaveModel.leaveTypeId, leaveTypeModel.leaveTypeId)
    )
    .leftJoin(
      designationModel,
      eq(employeeModel.designationId, designationModel.designationId)
    )
    .leftJoin(
      departmentModel,
      eq(employeeModel.departmentId, departmentModel.departmentId)
    )
}

// UPDATE
export const updateEmployeeLeave = async (data: EmployeeLeave) => {
  await db
    .update(employeeLeaveModel)
    .set({ ...data })
    .where(eq(employeeLeaveModel.employeeLeaveId, data.employeeLeaveId))

  const [updated] = await db
    .select()
    .from(employeeLeaveModel)
    .where(eq(employeeLeaveModel.employeeLeaveId, data.employeeLeaveId))

  return updated
}

// DELETE
export const deleteEmployeeLeave = async (employeeLeaveId: number) => {
  await db
    .delete(employeeLeaveModel)
    .where(eq(employeeLeaveModel.employeeLeaveId, employeeLeaveId))
}

export const getEmployeeLeaveTypes = async () => {
  const result = await db
    .select({
      employeeLeaveTypeId: employeeLeaveTypeModel.employeeLeaveTypeId,
      employeeId: employeeLeaveTypeModel.employeeId,
      leaveTypeId: employeeLeaveTypeModel.leaveTypeId,
      leaveTypeName: leaveTypeModel.leaveTypeName,
      totalLeaves: leaveTypeModel.totalLeaves,
      employeeName: employeeModel.empFullName,
      empCode: employeeModel.empCode,
      designationName: designationModel.designationName,
      departmentName: departmentModel.departmentName,
    })
    .from(employeeLeaveTypeModel)
    .leftJoin(
      employeeModel,
      eq(employeeLeaveTypeModel.employeeId, employeeModel.employeeId)
    )
    .leftJoin(
      leaveTypeModel,
      eq(employeeLeaveTypeModel.leaveTypeId, leaveTypeModel.leaveTypeId)
    )
    .leftJoin(
      designationModel,
      eq(employeeModel.designationId, designationModel.designationId)
    )
    .leftJoin(
      departmentModel,
      eq(employeeModel.departmentId, departmentModel.departmentId)
    )

  return result
}
