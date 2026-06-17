import { Request, Response } from 'express'
import { getAttendanceAuditLogs, getAuditByRecordId } from '../services/attendanceAudit.service'

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, fromDate, toDate, action, page, limit } = req.query

    const result = await getAttendanceAuditLogs({
      employeeId: employeeId ? Number(employeeId) : undefined,
      fromDate:   fromDate as string | undefined,
      toDate:     toDate   as string | undefined,
      action:     action   as 'INSERT' | 'UPDATE' | undefined,
      page:       page     ? Number(page)  : 1,
      limit:      limit    ? Number(limit) : 20,
    })

    res.status(200).json(result)
  } catch (error: any) {
    console.error('getAuditLogs error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export const getAuditByRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recordId } = req.params
    const result = await getAuditByRecordId(Number(recordId))
    res.status(200).json({ data: result })
  } catch (error: any) {
    console.error('getAuditByRecord error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}