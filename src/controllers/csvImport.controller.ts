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

    const result = await importAttendancePunchesFromCsv(
      req.file,
      createdBy,
      tenantId
    )

    res.status(200).json(result)
  } catch (error: any) {
    console.error('❌ CSV Import error:', error)
    res
      .status(400)
      .json({ success: false, message: error.message || 'Import failed' })
  }
}

// LIST all uploaded CSV files
export const listCsvFilesController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'view_attendance_punch')
    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }
    const files = listCsvFiles(tenantId)
    res.json(files)
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, message: error.message || 'Server error' })
  }
}

// DOWNLOAD by filename
export const downloadCsvController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'view_attendance_punch')
    const { filename } = req.params
    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }
    const filePath = getCsvFilePath(filename, tenantId)
    res.download(filePath)
  } catch (error: any) {
    res
      .status(404)
      .json({ success: false, message: error.message || 'File not found' })
  }
}
