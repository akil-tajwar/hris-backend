import { eq, and, gte, lte } from 'drizzle-orm'
import { db } from '../config/database'
import {
  departmentModel,
  designationModel,
  employeeAttendanceModel,
  employeeLeaveModel,
  employeeModel,
  leaveTypeModel,
} from '../schemas'

export const getEmployeeLeaveSummary = async () => {
  // Current year
  const currentYear = new Date().getFullYear()

  const yearStart = new Date(`${currentYear}-01-01`)
  const yearEnd = new Date(`${currentYear}-12-31`)

  // Get leave data
  const leaves = await db
    .select({
      employeeId: employeeModel.employeeId,
      empCode: employeeModel.empCode,
      empFullName: employeeModel.empFullName,

      designationName: designationModel.designationName,
      departmentName: departmentModel.departmentName,

      leaveTypeId: leaveTypeModel.leaveTypeId,
      leaveTypeName: leaveTypeModel.leaveTypeName,
      totalLeaves: leaveTypeModel.totalLeaves,

      noOfDays: employeeLeaveModel.noOfDays,
    })
    .from(employeeLeaveModel)
    .leftJoin(
      employeeModel,
      eq(employeeLeaveModel.employeeId, employeeModel.employeeId)
    )
    .leftJoin(
      designationModel,
      eq(employeeModel.designationId, designationModel.designationId)
    )
    .leftJoin(
      departmentModel,
      eq(employeeModel.departmentId, departmentModel.departmentId)
    )
    .leftJoin(
      leaveTypeModel,
      eq(employeeLeaveModel.leaveTypeId, leaveTypeModel.leaveTypeId)
    )
    .where(
      and(
        gte(employeeLeaveModel.startDate, yearStart),
        lte(employeeLeaveModel.endDate, yearEnd)
      )
    )

  const employeeMap = new Map()

  for (const leave of leaves) {
    const employeeId = leave.employeeId

    if (!employeeMap.has(employeeId)) {
      employeeMap.set(employeeId, {
        employeeDetails: {
          employeeId: leave.employeeId,
          empCode: leave.empCode,
          empFullName: leave.empFullName,
          designationName: leave.designationName,
          departmentName: leave.departmentName,
          totalLeavesTaken: 0,
        },

        leaveDetails: [],
      })
    }

    const employeeData = employeeMap.get(employeeId)

    employeeData.employeeDetails.totalLeavesTaken += leave.noOfDays ?? 0

    const existingLeaveType = employeeData.leaveDetails.find(
      (item: any) => item.leaveTypeId === leave.leaveTypeId
    )

    if (existingLeaveType) {
      existingLeaveType.takenLeaves += leave.noOfDays ?? 0

      existingLeaveType.remainingLeaves =
        existingLeaveType.totalLeaves - existingLeaveType.takenLeaves
    } else {
      employeeData.leaveDetails.push({
        leaveTypeId: leave.leaveTypeId,
        leaveTypeName: leave.leaveTypeName,
        totalLeaves: leave.totalLeaves ?? 0,
        takenLeaves: leave.noOfDays ?? 0,
        remainingLeaves: (leave.totalLeaves ?? 0) - (leave.noOfDays ?? 0),
      })
    }
  }

  return Array.from(employeeMap.values())
}

export const getEmployeeAttendanceSummary = async () => {
  const currentYear = new Date().getFullYear()

  const yearStart = new Date(`${currentYear}-01-01`)
  const yearEnd = new Date(`${currentYear}-12-31`)

  const attendances = await db
    .select({
      employeeId: employeeModel.employeeId,
      empCode: employeeModel.empCode,
      empFullName: employeeModel.empFullName,

      designationName: designationModel.designationName,
      departmentName: departmentModel.departmentName,

      attendanceDate: employeeAttendanceModel.attendanceDate,
      isAbsent: employeeAttendanceModel.isAbsent,
      lateInMinutes: employeeAttendanceModel.lateInMinutes,
      earlyOutMinutes: employeeAttendanceModel.earlyOutMinutes,
    })
    .from(employeeAttendanceModel)
    .leftJoin(
      employeeModel,
      eq(employeeAttendanceModel.employeeId, employeeModel.employeeId)
    )
    .leftJoin(
      designationModel,
      eq(employeeModel.designationId, designationModel.designationId)
    )
    .leftJoin(
      departmentModel,
      eq(employeeModel.departmentId, departmentModel.departmentId)
    )
    .where(
      and(
        gte(employeeAttendanceModel.attendanceDate, yearStart),
        lte(employeeAttendanceModel.attendanceDate, yearEnd)
      )
    )

  const employeeMap = new Map()

  for (const att of attendances) {
    const employeeId = att.employeeId

    if (!employeeMap.has(employeeId)) {
      employeeMap.set(employeeId, {
        employeeDetails: {
          employeeId: att.employeeId,
          empCode: att.empCode,
          empFullName: att.empFullName,
          designationName: att.designationName,
          departmentName: att.departmentName,

          totalAbsent: 0,
          totalLateInMinutes: 0,
          totalEarlyOutMinutes: 0,
        },

        attendanceDetails: [],
      })
    }

    const employeeData = employeeMap.get(employeeId)

    // accumulate totals
    employeeData.employeeDetails.totalAbsent += att.isAbsent ?? 0
    employeeData.employeeDetails.totalLateInMinutes += att.lateInMinutes ?? 0
    employeeData.employeeDetails.totalEarlyOutMinutes +=
      att.earlyOutMinutes ?? 0

    // push daily record
    employeeData.attendanceDetails.push({
      attendanceDate: att.attendanceDate,
      isAbsent: att.isAbsent,
      lateInMinutes: att.lateInMinutes,
      earlyOutMinutes: att.earlyOutMinutes,
    })
  }

  return Array.from(employeeMap.values())
}
