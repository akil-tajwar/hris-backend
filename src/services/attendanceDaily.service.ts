import { and, eq } from 'drizzle-orm'
import { db } from '../config/database'
import {
  attendanceDaily,
  employeeModel,
  NewAttendanceDaily,
} from '../schemas'
import { redis } from '../middlewares/redis'
import { getCache, setCache } from '../middlewares/cache'

const DAILY_CACHE_KEY = 'attendance_daily:all'

// ── Common select shape with employee join ──────────────────────────────
const dailyWithEmployeeSelect = {
  id:              attendanceDaily.id,
  employeeId:      attendanceDaily.employeeId,
  attendanceDate:  attendanceDaily.attendanceDate,
  firstIn:         attendanceDaily.firstIn,
  lastOut:         attendanceDaily.lastOut,
  workedMinutes:   attendanceDaily.workedMinutes,
  lateMinutes:     attendanceDaily.lateMinutes,
  earlyOutMinutes: attendanceDaily.earlyOutMinutes,
  overtimeMinutes: attendanceDaily.overtimeMinutes,
  status:          attendanceDaily.status,
  createdBy:       attendanceDaily.createdBy,
  createdAt:       attendanceDaily.createdAt,
  updatedBy:       attendanceDaily.updatedBy,
  updatedAt:       attendanceDaily.updatedAt,
  employeeName:    employeeModel.empFullName,
  empCode:         employeeModel.empCode,
}

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

  const rows = await db
    .select(dailyWithEmployeeSelect)
    .from(attendanceDaily)
    .leftJoin(employeeModel, eq(attendanceDaily.employeeId, employeeModel.employeeId))
    .where(eq(attendanceDaily.id, insertId))
    .limit(1)

  return rows[0] ?? null
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

  const rows = await db
    .select(dailyWithEmployeeSelect)
    .from(attendanceDaily)
    .leftJoin(employeeModel, eq(attendanceDaily.employeeId, employeeModel.employeeId))
    .where(eq(attendanceDaily.id, id))
    .limit(1)

  return rows[0] ?? null
}

// GET ALL DAILY (with employee name + empCode)
export const getAllAttendanceDaily = async (tenantId: number) => {
  const cached = await getCache(DAILY_CACHE_KEY)
  if (cached) {
    console.log('⚡ Redis HIT')
    return cached
  }

  console.log('🐢 MySQL QUERY (CACHE MISS)')

  const records = await db
    .select(dailyWithEmployeeSelect)
    .from(attendanceDaily)
    .leftJoin(employeeModel, eq(attendanceDaily.employeeId, employeeModel.employeeId))
    .where(eq(attendanceDaily.tenantId, tenantId))

  await setCache(DAILY_CACHE_KEY, records, 300)
  return records
}

// GET DAILY BY ID (with employee name + empCode)
export const getAttendanceDailyById = async (id: number, tenantId: number) => {
  const rows = await db
    .select(dailyWithEmployeeSelect)
    .from(attendanceDaily)
    .leftJoin(employeeModel, eq(attendanceDaily.employeeId, employeeModel.employeeId))
    .where(and(eq(attendanceDaily.id, id), eq(attendanceDaily.tenantId, tenantId)))
    .limit(1)
    
    if (!rows || rows.length === 0) return null
    return rows[0]
  }
  
  // GET DAILY BY EMPLOYEE ID (with employee name + empCode)
  export const getAttendanceDailyByEmployee = async (employeeId: number, tenantId: number) => {
    const records = await db
    .select(dailyWithEmployeeSelect)
    .from(attendanceDaily)
    .leftJoin(employeeModel, eq(attendanceDaily.employeeId, employeeModel.employeeId))
    .where(and(eq(attendanceDaily.id, employeeId), eq(attendanceDaily.tenantId, tenantId)))

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