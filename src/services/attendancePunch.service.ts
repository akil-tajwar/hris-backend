import { and, eq, gte, isNull, lte, or, sql } from 'drizzle-orm'
import { db } from '../config/database'
import {
  attendancePunches,
  NewAttendancePunch,
  employeeModel,
  employeeOfficeLocationModel,
  officeLocationsModel,
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
    punchTime: punchTime.toISOString(),
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
      punchTime: data.punchTime
        ? new Date(data.punchTime).toISOString()
        : undefined,
    })
    .where(eq(attendancePunches.id, id))

  await redis.del(PUNCH_CACHE_KEY)

  return await db.query.attendancePunches.findFirst({
    where: eq(attendancePunches.id, id),
  })
}

// GET ALL PUNCHES
export const getAllAttendancePunches = async (tenantId: number) => {
  const cached = await getCache(PUNCH_CACHE_KEY)
  if (cached) {
    console.log('⚡ Redis HIT')
    return cached
  }

  console.log('🐢 MySQL QUERY (CACHE MISS)')

  const punches = await db
    .select()
    .from(attendancePunches)
    .where(eq(attendancePunches.tenantId, tenantId))

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

function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

const pad = (n: number | string) => String(n).padStart(2, '0')

const toMySQLDateTime = (input: Date | string): string => {
  const formatLocal = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

  if (input instanceof Date) {
    if (isNaN(input.getTime())) {
      throw new Error('Invalid datetime')
    }

    return formatLocal(input)
  }

  const str = String(input).trim()

  if (!str) {
    throw new Error('Empty datetime')
  }

  // 2026-07-11T20:02:40.000Z

  const isoZ = str.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?Z$/
  )

  if (isoZ) {
    const [, y, mo, d, h, mi, s] = isoZ

    return `${y}-${mo}-${d} ${h}:${mi}:${s ?? '00'}`
  }

  // 2026-07-11T20:02:40

  const isoPlain = str.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?/
  )

  if (isoPlain) {
    const [, y, mo, d, h, mi, s] = isoPlain

    return `${y}-${mo}-${d} ${pad(h)}:${mi}:${s ?? '00'}`
  }

  // 2026-07-11

  const dateOnly = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (dateOnly) {
    const [, y, mo, d] = dateOnly

    return `${y}-${mo}-${d} 00:00:00`
  }

  const fallback = new Date(str)

  if (isNaN(fallback.getTime())) {
    throw new Error(`Invalid datetime: ${input}`)
  }

  return formatLocal(fallback)
}

export class GeofencePunchNotFoundError extends Error {}

export async function processGeofencePunch(params: {
  phoneNumber: string
  latitude: number
  longitude: number
}) {
  const { phoneNumber, latitude, longitude } = params

  // 1. Find employee by phone number
  const [employee] = await db
    .select()
    .from(employeeModel)
    .where(eq(employeeModel.officialPhone, phoneNumber))

  if (!employee) {
    throw new GeofencePunchNotFoundError('Employee not found')
  }

  // 2. Find employee's currently active office assignment
  const today = new Date()

  const [assignment] = await db
    .select()
    .from(employeeOfficeLocationModel)
    .where(
      and(
        eq(employeeOfficeLocationModel.employeeId, employee.employeeId),
        lte(employeeOfficeLocationModel.fromDate, today),
        or(
          isNull(employeeOfficeLocationModel.toDate),
          gte(employeeOfficeLocationModel.toDate, today)
        )
      )
    )

  if (!assignment) {
    throw new GeofencePunchNotFoundError(
      'No active office assignment for this employee'
    )
  }

  // 3. Get that office's location
  const [office] = await db
    .select()
    .from(officeLocationsModel)
    .where(
      eq(officeLocationsModel.officeLocationId, assignment.officeLocationId)
    )

  if (!office) {
    throw new GeofencePunchNotFoundError('Office location not found')
  }

  // 4. Check if employee is currently inside the geofence
  const distance = getDistanceMeters(
    latitude,
    longitude,
    office.latitude,
    office.longitude
  )
  const isInside = distance <= office.radiusMeters

  // 5. Determine current alternating state from today's punch count
  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)

  const formattedStart = toMySQLDateTime(startOfDay)
  const formattedEnd = toMySQLDateTime(endOfDay)

  const [{ punchCount }] = await db
    .select({ punchCount: sql<number>`COUNT(*)` })
    .from(attendancePunches)
    .where(
      and(
        eq(attendancePunches.employeeId, employee.employeeId),
        gte(attendancePunches.punchTime, formattedStart),
        lte(attendancePunches.punchTime, formattedEnd)
      )
    )

  const currentlyMarkedIn = punchCount % 2 === 1

  // 6. Only punch on a transition
  const shouldPunch =
    (isInside && !currentlyMarkedIn) || (!isInside && currentlyMarkedIn)

  if (!shouldPunch) {
    return { punched: false, isInside }
  }

  await db.insert(attendancePunches).values({
    employeeId: employee.employeeId,
    tenantId: employee.tenantId,
    punchTime: toMySQLDateTime(new Date()),
    punchType: isInside ? 'in' : 'out',
    deviceId: null,
    source: 'Geofencing',
    createdBy: employee.employeeId,
  })

  return { punched: true, isInside }
}
