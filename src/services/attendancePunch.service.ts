import { eq } from 'drizzle-orm'
import { db } from '../config/database'
import {
  attendancePunches,
  attendanceDaily,
  NewAttendancePunch,
  NewAttendanceDaily,
} from '../schemas'
import { redis } from '../middlewares/redis'
import { getCache, setCache } from '../middlewares/cache'

const PUNCH_CACHE_KEY = 'attendance_punches:all'
const DAILY_CACHE_KEY = 'attendance_daily:all'

// ========================
// ATTENDANCE PUNCHES
// ========================

// CREATE PUNCH
export const createAttendancePunch = async (data: NewAttendancePunch) => {
  const punchTime = new Date(data.punchTime)

  if (isNaN(punchTime.getTime())) {
    throw new Error('Invalid punchTime format. Use: 2026-06-08T09:00:00.000Z')
  }

  const result = await db.insert(attendancePunches).values({
    employeeId: data.employeeId,
    punchTime: punchTime,
    punchType: data.punchType ?? null,
    deviceId: data.deviceId ?? null,
    source: data.source ?? null,
    createdBy: data.createdBy,
  })

  const insertId = Number(result[0].insertId)
  await redis.del(PUNCH_CACHE_KEY)

  const punch = await db.query.attendancePunches.findFirst({
    where: eq(attendancePunches.id, insertId),
  })

  return punch
}

// UPDATE PUNCH
export const updateAttendancePunch = async (
  id: number,
  data: Partial<NewAttendancePunch>
) => {
  const existing = await db.query.attendancePunches.findFirst({
    where: eq(attendancePunches.id, id),
  })

  if (!existing) throw new Error('Attendance punch not found')

  await db
    .update(attendancePunches)
    .set({
      ...data,
      punchTime: data.punchTime ? new Date(data.punchTime) : undefined,
    })
    .where(eq(attendancePunches.id, id))

  await redis.del(PUNCH_CACHE_KEY)

  return await db.query.attendancePunches.findFirst({
    where: eq(attendancePunches.id, id),
  })
}

// GET ALL PUNCHES
export const getAllAttendancePunches = async () => {
  const cached = await getCache(PUNCH_CACHE_KEY)
  if (cached) {
    console.log('⚡ Redis HIT')
    return cached
  }

  console.log('🐢 MySQL QUERY (CACHE MISS)')

  const punches = await db.select().from(attendancePunches)

  await setCache(PUNCH_CACHE_KEY, punches, 300)
  return punches
}

// GET PUNCH BY ID
export const getAttendancePunchById = async (id: number) => {
  const punch = await db
    .select()
    .from(attendancePunches)
    .where(eq(attendancePunches.id, id))
    .limit(1)

  if (!punch || punch.length === 0) return null
  return punch[0]
}

// GET PUNCHES BY EMPLOYEE ID
export const getAttendancePunchesByEmployee = async (employeeId: number) => {
  const punches = await db
    .select()
    .from(attendancePunches)
    .where(eq(attendancePunches.employeeId, employeeId))

  return punches
}

// DELETE PUNCH
export const deleteAttendancePunch = async (id: number) => {
  const existing = await db.query.attendancePunches.findFirst({
    where: eq(attendancePunches.id, id),
  })

  if (!existing) throw new Error('Attendance punch not found')

  await db.delete(attendancePunches).where(eq(attendancePunches.id, id))

  await redis.del(PUNCH_CACHE_KEY)

  return {
    message: 'Attendance punch deleted successfully',
    deletedPunch: existing,
  }
}

// ========================
// ATTENDANCE DAILY
// ========================

// CREATE DAILY
export const createAttendanceDaily = async (data: NewAttendanceDaily) => {
  const result = await db.insert(attendanceDaily).values({
    employeeId: data.employeeId,
    attendanceDate: data.attendanceDate,
    firstIn: data.firstIn ? new Date(data.firstIn) : null,
    lastOut: data.lastOut ? new Date(data.lastOut) : null,
    workedMinutes: data.workedMinutes ?? null,
    lateMinutes: data.lateMinutes ?? null,
    earlyOutMinutes: data.earlyOutMinutes ?? null,
    overtimeMinutes: data.overtimeMinutes ?? null,
    status: data.status,
    createdBy: data.createdBy,
  })

  const insertId = Number(result[0].insertId)
  await redis.del(DAILY_CACHE_KEY)

  const daily = await db.query.attendanceDaily.findFirst({
    where: eq(attendanceDaily.id, insertId),
  })

  return daily
}

// UPDATE DAILY
export const updateAttendanceDaily = async (
  id: number,
  data: Partial<NewAttendanceDaily>
) => {
  const existing = await db.query.attendanceDaily.findFirst({
    where: eq(attendanceDaily.id, id),
  })

  if (!existing) throw new Error('Attendance daily record not found')

  await db
    .update(attendanceDaily)
    .set({
      ...data,
      firstIn: data.firstIn ? new Date(data.firstIn) : undefined,
      lastOut: data.lastOut ? new Date(data.lastOut) : undefined,
    })
    .where(eq(attendanceDaily.id, id))

  await redis.del(DAILY_CACHE_KEY)

  return await db.query.attendanceDaily.findFirst({
    where: eq(attendanceDaily.id, id),
  })
}

// GET ALL DAILY
export const getAllAttendanceDaily = async () => {
  const cached = await getCache(DAILY_CACHE_KEY)
  if (cached) {
    console.log('⚡ Redis HIT')
    return cached
  }

  console.log('🐢 MySQL QUERY (CACHE MISS)')

  const records = await db.select().from(attendanceDaily)

  await setCache(DAILY_CACHE_KEY, records, 300)
  return records
}

// GET DAILY BY ID
export const getAttendanceDailyById = async (id: number) => {
  const record = await db
    .select()
    .from(attendanceDaily)
    .where(eq(attendanceDaily.id, id))
    .limit(1)

  if (!record || record.length === 0) return null
  return record[0]
}

// GET DAILY BY EMPLOYEE ID
export const getAttendanceDailyByEmployee = async (employeeId: number) => {
  const records = await db
    .select()
    .from(attendanceDaily)
    .where(eq(attendanceDaily.employeeId, employeeId))

  return records
}

// DELETE DAILY
export const deleteAttendanceDaily = async (id: number) => {
  const existing = await db.query.attendanceDaily.findFirst({
    where: eq(attendanceDaily.id, id),
  })

  if (!existing) throw new Error('Attendance daily record not found')

  await db.delete(attendanceDaily).where(eq(attendanceDaily.id, id))

  await redis.del(DAILY_CACHE_KEY)

  return {
    message: 'Attendance daily record deleted successfully',
    deletedRecord: existing,
  }
}