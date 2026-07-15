import { db } from '../config/database'
import { eq, and, desc } from 'drizzle-orm'
import {
  attendanceDaily,
  AttendanceDailyApply,
  attendanceDailyApply,
  attendanceDailyAudit,
  employeeModel,
  NewAttendanceDailyApply,
} from '../schemas'

// ---------------------------------------------------------------------------
// Helper: the client sends `employeeId` in the payload, but it's actually
// the logged-in user's userId. We resolve the real employeeId from it here.
// ---------------------------------------------------------------------------
const resolveEmployeeIdFromUserId = async (userId: number) => {
  const employee = await db
    .select({ employeeId: employeeModel.employeeId })
    .from(employeeModel)
    .where(eq(employeeModel.userId, userId))
    .limit(1)

  if (!employee.length) {
    throw new Error('No employee record found for this user')
  }

  return employee[0].employeeId
}

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------
export const createAttendanceDailyApply = async (
  data: NewAttendanceDailyApply,
  attendanceDailyId: number
) => {
  try {
    console.log('🚀 ~ createAttendanceDailyApply ~ data:', data)
    const realEmployeeId = await resolveEmployeeIdFromUserId(data.employeeId)

    const [inserted] = await db.insert(attendanceDailyApply).values({
      employeeId: realEmployeeId,
      attendanceDailyId: attendanceDailyId,
      tenantId: data.tenantId,
      attendanceDate: data.attendanceDate,
      firstIn: data.firstIn ? new Date(data.firstIn) : null,
      lastOut: data.lastOut ? new Date(data.lastOut) : null,
      workedMinutes: data.workedMinutes,
      lateMinutes: data.lateMinutes,
      earlyOutMinutes: data.earlyOutMinutes,
      overtimeMinutes: data.overtimeMinutes,
      status: data.status,
      applyType: data.applyType,
      createdBy: data.createdBy,
    })

    const [created] = await db
      .select()
      .from(attendanceDailyApply)
      .where(eq(attendanceDailyApply.id, inserted.insertId))
      .limit(1)

    return created
  } catch (err) {
    console.error(err)
    throw err
  }
}

// ---------------------------------------------------------------------------
// EDIT
// ---------------------------------------------------------------------------
export const editAttendanceDailyApply = async (
  id: number,
  data: AttendanceDailyApply
) => {
  const updatePayload: Record<string, unknown> = { ...data }

  // immutable fields
  delete updatePayload.id
  delete updatePayload.employeeId
  delete updatePayload.createdAt
  delete updatePayload.updatedAt
  delete updatePayload.tenantId
  delete updatePayload.createdBy

  if (data.firstIn) {
    updatePayload.firstIn = new Date(data.firstIn)
  }

  if (data.lastOut) {
    updatePayload.lastOut = new Date(data.lastOut)
  }

  if (data.attendanceDate) {
    updatePayload.attendanceDate = new Date(data.attendanceDate)
  }

  console.log(updatePayload)

  await db
    .update(attendanceDailyApply)
    .set(updatePayload)
    .where(eq(attendanceDailyApply.id, id))

  const [updated] = await db
    .select()
    .from(attendanceDailyApply)
    .where(eq(attendanceDailyApply.id, id))
    .limit(1)

  return updated
}

// ---------------------------------------------------------------------------
// GET BY USER ID
// ---------------------------------------------------------------------------
export const getAttendanceApplyByUserId = async (
  userId: number,
  tenantId?: number
) => {
  const realEmployeeId = await resolveEmployeeIdFromUserId(userId)

  const conditions = tenantId
    ? and(
        eq(attendanceDailyApply.employeeId, realEmployeeId),
        eq(attendanceDailyApply.tenantId, tenantId)
      )
    : eq(attendanceDailyApply.employeeId, realEmployeeId)

  return db
    .select()
    .from(attendanceDailyApply)
    .where(conditions)
    .orderBy(desc(attendanceDailyApply.createdAt))
}

export const getAllAttendanceApply = async (
  tenantId?: number
) => {
  const query = db
    .select({
      id: attendanceDailyApply.id,
      employeeId: attendanceDailyApply.employeeId,
      empCode: employeeModel.empCode,
      employeeName: employeeModel.empFullName,
      attendanceDailyId: attendanceDailyApply.attendanceDailyId,
      tenantId: attendanceDailyApply.tenantId,
      attendanceDate: attendanceDailyApply.attendanceDate,
      firstIn: attendanceDailyApply.firstIn,
      lastOut: attendanceDailyApply.lastOut,
      workedMinutes: attendanceDailyApply.workedMinutes,
      lateMinutes: attendanceDailyApply.lateMinutes,
      earlyOutMinutes: attendanceDailyApply.earlyOutMinutes,
      overtimeMinutes: attendanceDailyApply.overtimeMinutes,
      status: attendanceDailyApply.status,
      applyType: attendanceDailyApply.applyType,
      applyStatus: attendanceDailyApply.applyStatus,
      approvedByRepAuth: attendanceDailyApply.approvedByRepAuth,
      approvedByHr: attendanceDailyApply.approvedByHr,
      createdBy: attendanceDailyApply.createdBy,
      createdAt: attendanceDailyApply.createdAt,
      updatedBy: attendanceDailyApply.updatedBy,
      updatedAt: attendanceDailyApply.updatedAt,
    })
    .from(attendanceDailyApply)
    .innerJoin(
      employeeModel,
      eq(attendanceDailyApply.employeeId, employeeModel.employeeId)
    )

  if (tenantId !== undefined) {
    query.where(eq(attendanceDailyApply.tenantId, tenantId))
  }

  return query.orderBy(desc(attendanceDailyApply.createdAt))
}

// ---------------------------------------------------------------------------
// APPROVE - Reporting Authority (first-level sign-off)
// ---------------------------------------------------------------------------
export const acceptedAttendanceApplyByRepAuth = async (
  id: number,
  updatedBy: number
) => {
  await db
    .update(attendanceDailyApply)
    .set({ updatedBy, approvedByRepAuth: true })
    .where(eq(attendanceDailyApply.id, id))

  const [updated] = await db
    .select()
    .from(attendanceDailyApply)
    .where(eq(attendanceDailyApply.id, id))
    .limit(1)

  return updated
}

// ---------------------------------------------------------------------------
// APPROVE - HR (final sign-off, commits the change to attendanceDaily)
// ---------------------------------------------------------------------------
export const acceptedAttendanceApplyByByHr = async (
  id: number,
  updatedBy: number
) => {
  const [apply] = await db
    .select()
    .from(attendanceDailyApply)
    .where(eq(attendanceDailyApply.id, id))
    .limit(1)

  if (!apply) {
    throw new Error('Attendance apply not found')
  }

  // approve apply
  await db
    .update(attendanceDailyApply)
    .set({
      applyStatus: 'Approved',
      updatedBy,
      approvedByHr: true,
    })
    .where(eq(attendanceDailyApply.id, id))


  // find original attendance data
  const [attendance] = await db
    .select()
    .from(attendanceDaily)
    .where(eq(attendanceDaily.id, apply.attendanceDailyId))
    .limit(1)

  if (!attendance) {
    throw new Error('Attendance daily record not found')
  }

  // insert audit before updating
  const auditPayload = {
    recordId: apply.attendanceDailyId,
    employeeId: attendance.employeeId,
    attendanceDate:
      apply.attendanceDate instanceof Date
        ? apply.attendanceDate.toISOString().slice(0, 10)
        : apply.attendanceDate,
    action: 'UPDATE',
    changedBy: updatedBy,

    oldStatus: attendance.status,
    oldWorkedMinutes: attendance.workedMinutes,
    oldLateMinutes: attendance.lateMinutes,
    oldEarlyOutMinutes: attendance.earlyOutMinutes,
    oldOvertimeMinutes: attendance.overtimeMinutes,
    oldFirstIn: attendance.firstIn,
    oldLastOut: attendance.lastOut,

    newStatus: apply.status,
    newWorkedMinutes: apply.workedMinutes ?? 0,
    newLateMinutes: apply.lateMinutes ?? 0,
    newEarlyOutMinutes: apply.earlyOutMinutes ?? 0,
    newOvertimeMinutes: apply.overtimeMinutes ?? 0,
    newFirstIn: apply.firstIn,
    newLastOut: apply.lastOut,

    remark: 'Attendance updated from HR approved apply',
    tenantId: apply.tenantId,
  }

  await db.insert(attendanceDailyAudit).values(auditPayload as any)


  // update attendance_daily with approved data
  await db
    .update(attendanceDaily)
    .set({
      firstIn: apply.firstIn,
      lastOut: apply.lastOut,
      workedMinutes: apply.workedMinutes,
      lateMinutes: apply.lateMinutes,
      earlyOutMinutes: apply.earlyOutMinutes,
      overtimeMinutes: apply.overtimeMinutes,
      status: apply.status,
      updatedBy,
    })
    .where(eq(attendanceDaily.id, apply.attendanceDailyId))


  const [updatedApply] = await db
    .select()
    .from(attendanceDailyApply)
    .where(eq(attendanceDailyApply.id, id))
    .limit(1)

  return updatedApply
}

// ---------------------------------------------------------------------------
// REJECT
// ---------------------------------------------------------------------------
export const rejectAttendanceApply = async (id: number, updatedBy: number) => {
  await db
    .update(attendanceDailyApply)
    .set({ applyStatus: 'Rejected', updatedBy })
    .where(eq(attendanceDailyApply.id, id))

  const [updated] = await db
    .select()
    .from(attendanceDailyApply)
    .where(eq(attendanceDailyApply.id, id))
    .limit(1)

  return updated
}
