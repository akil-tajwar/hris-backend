import { and, eq, gte, like, lt, or } from 'drizzle-orm'
import { db } from '../config/database'
import { attendanceDaily, employeeModel } from '../schemas'

export const getTodayAttendanceSummary = async (tenantId: number) => {
  const now = new Date()

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  )

  const result = await db
    .select({
      employeeId: employeeModel.employeeId,
      employeeName: employeeModel.empFullName,
      status: attendanceDaily.status,
      firstIn: attendanceDaily.firstIn,
      lastOut: attendanceDaily.lastOut,
      lateMinutes: attendanceDaily.lateMinutes,
    })
    .from(attendanceDaily)
    .innerJoin(
      employeeModel,
      eq(attendanceDaily.employeeId, employeeModel.employeeId)
    )
    .where(
      and(
        eq(attendanceDaily.tenantId, tenantId),
        gte(attendanceDaily.attendanceDate, startOfDay),
        lt(attendanceDaily.attendanceDate, startOfTomorrow)
      )
    )

  const present = result.filter(
    (employee) => employee.status === 'PRESENT'
  ).length

  const late = result.filter((employee) => employee.status === 'LATE').length

  const absent = result.filter(
    (employee) => employee.status === 'ABSENT'
  ).length

  return {
    date: startOfDay.toISOString().split('T')[0],
    totalRecords: result.length,
    present,
    late,
    absent,
  }
}

export const searchEmployees = async (tenantId: number, name: string) => {
  const result = await db
    .select({
      employeeId: employeeModel.employeeId,
      employeeCode: employeeModel.empCode,
      employeeName: employeeModel.empFullName,
    })
    .from(employeeModel)
    .where(
      and(
        eq(employeeModel.tenantId, tenantId),
        or(
          like(employeeModel.empFullName, `%${name}%`),
          like(employeeModel.empCode, `%${name}%`)
        )
      )
    )

  return result
}

export const getEmployeeAttendance = async (
  tenantId: number,
  employeeId: number,
  date: string
) => {
  const result = await db
    .select({
      employeeId: employeeModel.employeeId,
      employeeName: employeeModel.empFullName,
      status: attendanceDaily.status,
      firstIn: attendanceDaily.firstIn,
      lastOut: attendanceDaily.lastOut,
      workedMinutes: attendanceDaily.workedMinutes,
      lateMinutes: attendanceDaily.lateMinutes,
    })
    .from(attendanceDaily)
    .innerJoin(
      employeeModel,
      eq(attendanceDaily.employeeId, employeeModel.employeeId)
    )
    .where(
      and(
        eq(attendanceDaily.tenantId, tenantId),
        eq(attendanceDaily.employeeId, employeeId),
        eq(attendanceDaily.attendanceDate, new Date(date))
      )
    )
    .limit(1)

  return result[0] ?? null
}

export const getAbsentEmployees = async (tenantId: number, date: string) => {
  return db
    .select({
      employeeId: employeeModel.employeeId,
      employeeCode: employeeModel.empCode,
      employeeName: employeeModel.empFullName,
    })
    .from(attendanceDaily)
    .innerJoin(
      employeeModel,
      eq(attendanceDaily.employeeId, employeeModel.employeeId)
    )
    .where(
      and(
        eq(attendanceDaily.tenantId, tenantId),
        eq(attendanceDaily.attendanceDate, new Date(date)),
        eq(attendanceDaily.status, 'ABSENT')
      )
    )
}

export const getLateEmployees = async (tenantId: number, date: string) => {
  return db
    .select({
      employeeId: employeeModel.employeeId,
      employeeName: employeeModel.empFullName,
      firstIn: attendanceDaily.firstIn,
      lateMinutes: attendanceDaily.lateMinutes,
    })
    .from(attendanceDaily)
    .innerJoin(
      employeeModel,
      eq(attendanceDaily.employeeId, employeeModel.employeeId)
    )
    .where(
      and(
        eq(attendanceDaily.tenantId, tenantId),
        eq(attendanceDaily.attendanceDate, new Date(date)),
        eq(attendanceDaily.status, 'LATE')
      )
    )
}
