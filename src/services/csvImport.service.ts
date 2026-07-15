import { db } from '../config/database'
import { attendancePunches } from '../schemas'
import { redis } from '../middlewares/redis'
import * as fs from 'fs'
import * as path from 'path'
import * as csv from 'csv-parse/sync'

const PUNCH_CACHE_KEY = (tenantId: number) =>
  `attendance_punches:${tenantId}:all`

// ===============================
// DATETIME HELPER
// Converts any incoming datetime
// into MySQL DATETIME format
// YYYY-MM-DD HH:mm:ss
// ===============================

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

export type CsvPunchRow = {
  device_id: string
  employee_id: string
  punch_time: string
  verify_mode: string
}

// ===============================
// IMPORT CSV
// ===============================

export const importAttendancePunchesFromCsv = async (
  file: Express.Multer.File,
  createdBy: number,
  tenantId: number
) => {
  const fileContent = fs.readFileSync(file.path, 'utf-8')

  const rows: CsvPunchRow[] = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  if (!rows || rows.length === 0) {
    throw new Error('CSV file is empty or invalid')
  }

  const errors: {
    row: number
    reason: string
  }[] = []

  const toInsert: (typeof attendancePunches.$inferInsert)[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    const rowNum = i + 2

    const employeeId = parseInt(row.employee_id)

    if (isNaN(employeeId)) {
      errors.push({
        row: rowNum,
        reason: `Invalid employee_id: ${row.employee_id}`,
      })

      continue
    }

    let formattedPunchTime: string

    try {
      formattedPunchTime = toMySQLDateTime(row.punch_time)
    } catch (error: any) {
      errors.push({
        row: rowNum,
        reason: error.message,
      })

      continue
    }

    toInsert.push({
      employeeId,

      tenantId,

      punchTime: formattedPunchTime,

      deviceId: row.device_id || null,

      source: row.verify_mode || null,

      punchType: null,

      createdBy,
    })
  }

  if (toInsert.length > 0) {
    await db.insert(attendancePunches).values(toInsert)

    await redis.del(PUNCH_CACHE_KEY(tenantId))
  }

  return {
    savedFile: file.filename,

    total: rows.length,

    inserted: toInsert.length,

    failed: errors.length,

    errors,
  }
}

// ===============================
// LIST CSV FILES
// ===============================

export const listCsvFiles = () => {
  const dir = path.join('uploads', 'attendance')

  if (!fs.existsSync(dir)) return []

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.csv'))

  return files.map((filename) => {
    const filePath = path.join(dir, filename)

    const stats = fs.statSync(filePath)

    return {
      filename,

      size: stats.size,

      uploadedAt: stats.birthtime,
    }
  })
}

// ===============================
// DOWNLOAD CSV
// ===============================

export const getCsvFilePath = (filename: string) => {
  const filePath = path.join('uploads', 'attendance', filename)

  if (!fs.existsSync(filePath)) {
    throw new Error('File not found')
  }

  return filePath
}
