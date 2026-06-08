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