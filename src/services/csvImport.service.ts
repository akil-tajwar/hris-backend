import { db } from '../config/database'
import { attendancePunches } from '../schemas'
import { redis } from '../middlewares/redis'
import * as fs from 'fs'
import * as path from 'path'
import * as csv from 'csv-parse/sync'
import { BadRequestError, ForbiddenError } from './utils/errors.utils'

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
  // Validate file
  if (!file || !file.filename) {
    throw BadRequestError('No file provided')
  }

  // Ensure file is CSV
  if (!file.filename.endsWith('.csv')) {
    throw BadRequestError('Only CSV files are allowed')
  }

  // Store in tenant-specific directory
  const tenantDir = path.join('uploads', 'attendance', `tenant_${tenantId}`)

  // Create directory if it doesn't exist
  if (!fs.existsSync(tenantDir)) {
    fs.mkdirSync(tenantDir, { recursive: true })
  }

  // Move file to tenant directory
  const oldPath = file.path
  const newPath = path.join(tenantDir, file.filename)

  // Ensure the destination is within tenant directory
  const resolvedDest = path.resolve(newPath)
  const resolvedBase = path.resolve(tenantDir)
  if (!resolvedDest.startsWith(resolvedBase)) {
    throw ForbiddenError('Invalid file path')
  }

  // Move file
  fs.renameSync(oldPath, newPath)
  file.path = newPath

  // Read file
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

export const listCsvFiles = (tenantId: number) => {
  // Create tenant-specific directory
  const baseDir = path.join('uploads', 'attendance', `tenant_${tenantId}`)

  if (!fs.existsSync(baseDir)) return []

  const files = fs.readdirSync(baseDir).filter((f) => f.endsWith('.csv'))

  return files.map((filename) => {
    const filePath = path.join(baseDir, filename)
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

export const getCsvFilePath = (filename: string, tenantId: number) => {
  // 1. Validate filename
  if (!filename || typeof filename !== 'string') {
    throw BadRequestError('Invalid filename')
  }

  // 2. Sanitize - allow only safe characters
  const sanitized = filename
    .replace(/[^a-zA-Z0-9_.-]/g, '') // Remove dangerous characters
    .replace(/\.\./g, '') // Remove directory traversal
    .trim()

  if (!sanitized) {
    throw BadRequestError('Invalid filename format')
  }

  // 3. Ensure it's a CSV file
  if (!sanitized.endsWith('.csv')) {
    throw BadRequestError('Only CSV files are allowed')
  }

  // 4. Build path with tenant isolation
  const baseDir = path.join('uploads', 'attendance', `tenant_${tenantId}`)
  const filePath = path.join(baseDir, sanitized)

  // 5. Resolve to absolute path and verify it's within the base directory
  const absoluteBase = path.resolve(baseDir)
  const absoluteFile = path.resolve(filePath)

  // 6. Ensure the resolved path is within the base directory
  if (!absoluteFile.startsWith(absoluteBase)) {
    throw ForbiddenError('Access denied')
  }

  // 7. Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found')
  }

  // 8. Additional security: ensure it's not a symlink
  const stats = fs.lstatSync(filePath)
  if (stats.isSymbolicLink()) {
    throw ForbiddenError('Symbolic links are not allowed')
  }

  return filePath
}
