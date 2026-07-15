import { db } from '../config/database'
import { eq, and, desc } from 'drizzle-orm'
import {
  attendanceDaily,
  attendanceDailyApply,
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
  data: Partial<{
    employeeId: number // if present, this is still a userId — resolve it
    attendanceDailyId: number
    attendanceDate: string
    firstIn: Date | null
    lastOut: Date | null
    workedMinutes: number
    lateMinutes: number
    earlyOutMinutes: number
    overtimeMinutes: number
    status:
      | 'PRESENT'
      | 'ABSENT'
      | 'LATE'
      | 'HALF_DAY'
      | 'HOLIDAY'
      | 'WEEKEND'
      | 'ON_LEAVE'
    updatedBy: number
  }>
) => {
  const updatePayload: Record<string, unknown> = { ...data }

  if (data.employeeId !== undefined) {
    updatePayload.employeeId = await resolveEmployeeIdFromUserId(
      data.employeeId
    )
  }

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

// ---------------------------------------------------------------------------
// Internal helper: once an apply record is fully approved, push the change
// into the real attendanceDaily table (CREATE -> insert, UPDATE -> update).
// ---------------------------------------------------------------------------
const applyChangeToAttendanceDaily = async (
  applyRecord: typeof attendanceDailyApply.$inferSelect
) => {
  if (applyRecord.applyType === 'CREATE') {
    await db.insert(attendanceDaily).values({
      employeeId: applyRecord.employeeId,
      tenantId: applyRecord.tenantId,
      attendanceDate: applyRecord.attendanceDate,
      firstIn: applyRecord.firstIn,
      lastOut: applyRecord.lastOut,
      workedMinutes: applyRecord.workedMinutes,
      lateMinutes: applyRecord.lateMinutes,
      earlyOutMinutes: applyRecord.earlyOutMinutes,
      overtimeMinutes: applyRecord.overtimeMinutes,
      status: applyRecord.status,
    })
  } else {
    await db
      .update(attendanceDaily)
      .set({
        firstIn: applyRecord.firstIn,
        lastOut: applyRecord.lastOut,
        workedMinutes: applyRecord.workedMinutes,
        lateMinutes: applyRecord.lateMinutes,
        earlyOutMinutes: applyRecord.earlyOutMinutes,
        overtimeMinutes: applyRecord.overtimeMinutes,
        status: applyRecord.status,
      })
      .where(eq(attendanceDaily.id, applyRecord.attendanceDailyId))
  }
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
    .set({ applyStatus: 'Approved', updatedBy })
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
  await db
    .update(attendanceDailyApply)
    .set({ applyStatus: 'Approved', updatedBy })
    .where(eq(attendanceDailyApply.id, id))

  const [updated] = await db
    .select()
    .from(attendanceDailyApply)
    .where(eq(attendanceDailyApply.id, id))
    .limit(1)

  if (updated) {
    await applyChangeToAttendanceDaily(updated)
  }

  return updated
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
