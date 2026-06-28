import { and, eq, gte, lte, desc } from 'drizzle-orm'
import { db } from '../config/database'
import { employeeModel, attendanceDailyAudit } from '../schemas/schema'

// ─── Get audit logs (filter by employee, date range, action) ─────────────────
export const getAttendanceAuditLogs = async (tenantId: number, filters: {
  employeeId?: number
  fromDate?: string
  toDate?: string
  action?: 'INSERT' | 'UPDATE'
  page?: number
  limit?: number
}) => {
  const { employeeId, fromDate, toDate, action, page = 1, limit = 20 } = filters
  const offset = (page - 1) * limit

  const conditions = []

  if (employeeId) {
    conditions.push(eq(attendanceDailyAudit.employeeId, employeeId))
  }
  if (fromDate) {
    conditions.push(gte(attendanceDailyAudit.attendanceDate, fromDate)) // ← Date না, string
  }
  if (toDate) {
    conditions.push(lte(attendanceDailyAudit.attendanceDate, toDate)) // ← Date না, string
  }
  if (action) {
    conditions.push(eq(attendanceDailyAudit.action, action))
  }

  // employee name join এর জন্য subquery style
  const logs = await db
    .select({
      // audit fields
      id: attendanceDailyAudit.id,
      recordId: attendanceDailyAudit.recordId,
      employeeId: attendanceDailyAudit.employeeId,
      attendanceDate: attendanceDailyAudit.attendanceDate,
      action: attendanceDailyAudit.action,
      changedBy: attendanceDailyAudit.changedBy,
      changedAt: attendanceDailyAudit.changedAt,
      remark: attendanceDailyAudit.remark,

      // আগের value
      oldStatus: attendanceDailyAudit.oldStatus,
      oldWorkedMinutes: attendanceDailyAudit.oldWorkedMinutes,
      oldLateMinutes: attendanceDailyAudit.oldLateMinutes,
      oldEarlyOutMinutes: attendanceDailyAudit.oldEarlyOutMinutes,
      oldOvertimeMinutes: attendanceDailyAudit.oldOvertimeMinutes,
      oldFirstIn: attendanceDailyAudit.oldFirstIn,
      oldLastOut: attendanceDailyAudit.oldLastOut,

      // নতুন value
      newStatus: attendanceDailyAudit.newStatus,
      newWorkedMinutes: attendanceDailyAudit.newWorkedMinutes,
      newLateMinutes: attendanceDailyAudit.newLateMinutes,
      newEarlyOutMinutes: attendanceDailyAudit.newEarlyOutMinutes,
      newOvertimeMinutes: attendanceDailyAudit.newOvertimeMinutes,
      newFirstIn: attendanceDailyAudit.newFirstIn,
      newLastOut: attendanceDailyAudit.newLastOut,

      // employee info
      employeeName: employeeModel.empFullName,
      empCode: employeeModel.empCode,
    })
    .from(attendanceDailyAudit)
    .leftJoin(
      employeeModel,
      eq(attendanceDailyAudit.employeeId, employeeModel.employeeId)
    )
    .where(
      and(
        ...(conditions.length > 0 ? conditions : []),
        eq(attendanceDailyAudit.tenantId, tenantId)
      )
    )
    .orderBy(desc(attendanceDailyAudit.changedAt))
    .limit(limit)
    .offset(offset)

  // total count (pagination এর জন্য)
  const totalResult = await db
    .select({ count: attendanceDailyAudit.id })
    .from(attendanceDailyAudit)
    .where(conditions.length > 0 ? and(...conditions) : undefined)

  return {
    data: logs,
    total: totalResult.length,
    page,
    limit,
    totalPages: Math.ceil(totalResult.length / limit),
  }
}

// ─── Get audit history for a specific attendance record ───────────────────────
export const getAuditByRecordId = async (recordId: number, tenantId: number) => {
  const logs = await db
    .select({
      id: attendanceDailyAudit.id,
      action: attendanceDailyAudit.action,
      changedBy: attendanceDailyAudit.changedBy,
      changedAt: attendanceDailyAudit.changedAt,
      remark: attendanceDailyAudit.remark,

      oldStatus: attendanceDailyAudit.oldStatus,
      oldWorkedMinutes: attendanceDailyAudit.oldWorkedMinutes,
      oldFirstIn: attendanceDailyAudit.oldFirstIn,
      oldLastOut: attendanceDailyAudit.oldLastOut,

      newStatus: attendanceDailyAudit.newStatus,
      newWorkedMinutes: attendanceDailyAudit.newWorkedMinutes,
      newFirstIn: attendanceDailyAudit.newFirstIn,
      newLastOut: attendanceDailyAudit.newLastOut,
    })
    .from(attendanceDailyAudit)
    .where(and(
      eq(attendanceDailyAudit.recordId, recordId),
      eq(attendanceDailyAudit.tenantId, tenantId)
    ))
    .orderBy(desc(attendanceDailyAudit.changedAt))

  return logs
}
