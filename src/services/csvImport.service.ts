import { db } from '../config/database'
import { attendancePunches } from '../schemas'
import { redis } from '../middlewares/redis'
import * as fs from 'fs'
import * as path from 'path'
import * as csv from 'csv-parse/sync'

const PUNCH_CACHE_KEY = 'attendance_punches:all'

export type CsvPunchRow = {
  device_id: string
  employee_id: string
  punch_time: string
  verify_mode: string
}

// IMPORT — save file + insert punches
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

  const errors: { row: number; reason: string }[] = []
  const toInsert: typeof attendancePunches.$inferInsert[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    const employeeId = parseInt(row.employee_id)
    if (isNaN(employeeId)) {
      errors.push({ row: rowNum, reason: `Invalid employee_id: "${row.employee_id}"` })
      continue
    }

    const punchTime = new Date(row.punch_time)
    if (isNaN(punchTime.getTime())) {
      errors.push({ row: rowNum, reason: `Invalid punch_time: "${row.punch_time}"` })
      continue
    }

    toInsert.push({
      employeeId,
      punchTime: punchTime.toISOString(),
      deviceId: row.device_id || null,
      source: row.verify_mode || null,
      punchType: null,
      tenantId,
      createdBy,
    })
  }

  if (toInsert.length > 0) {
    await db.insert(attendancePunches).values(toInsert)
    await redis.del(PUNCH_CACHE_KEY)
  }

  return {
    savedFile: file.filename,
    total: rows.length,
    inserted: toInsert.length,
    failed: errors.length,
    errors,
  }
}

// LIST — all CSV files in uploads/attendance/
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

// ACCESS — return file path for download
export const getCsvFilePath = (filename: string) => {
  const filePath = path.join('uploads', 'attendance', filename)

  if (!fs.existsSync(filePath)) {
    throw new Error('File not found')
  }

  return filePath
}