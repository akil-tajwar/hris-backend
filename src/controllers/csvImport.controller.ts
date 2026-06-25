import { Request, Response } from 'express'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  importAttendancePunchesFromCsv,
  listCsvFiles,
  getCsvFilePath,
} from '../services/csvImport.service'

// IMPORT
export const importCsvController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'create_attendance_punch')

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No CSV file uploaded' })
      return
    }

    const createdBy = (req as any).user?.userId
    if (!createdBy) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }

    const result = await importAttendancePunchesFromCsv(req.file, createdBy, tenantId)

    res.status(200).json({
      success: true,
      message: `Import complete. ${result.inserted} inserted, ${result.failed} failed.`,
      data: result,
    })
  } catch (error: any) {
    console.error('❌ CSV Import error:', error)
    res.status(400).json({ success: false, message: error.message || 'Import failed' })
  }
}

// LIST all uploaded CSV files
export const listCsvFilesController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'view_attendance_punch')
    const files = listCsvFiles()
    res.json({ success: true, data: files })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' })
  }
}

// DOWNLOAD by filename
export const downloadCsvController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'view_attendance_punch')
    const { filename } = req.params

    const filePath = getCsvFilePath(filename)
    res.download(filePath)
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message || 'File not found' })
  }
}