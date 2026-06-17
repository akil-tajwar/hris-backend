import { Request, Response } from 'express'
import {
  processAttendanceForDate,
  processAttendanceForRange,
} from '../services/attendanceProcessing.service'

export const processDateController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.body
    const changedBy = (req as any).user?.userId ?? 1

    if (!date) {
      res.status(400).json({ message: 'date required (YYYY-MM-DD)' })
      return
    }

    const result = await processAttendanceForDate(date, changedBy)
    res.status(200).json(result)
  } catch (error: any) {
    console.error('❌ Process attendance error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const processRangeController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fromDate, toDate } = req.body
    const changedBy = (req as any).user?.userId ?? 1

    if (!fromDate || !toDate) {
      res.status(400).json({ message: 'fromDate and toDate required' })
      return
    }

    const result = await processAttendanceForRange(fromDate, toDate, changedBy)
    res.status(200).json(result)
  } catch (error: any) {
    console.error('❌ Process range error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}


// import { Request, Response } from 'express'
// import {
//   processAttendanceForDate,
//   processAttendanceForRange,
// } from '../services/attendanceProcessing.service'

// export const processDateController = async (req: Request, res: Response) => {
//   try {
//     const { date } = req.params
//     if (!date) {
//       res.status(400).json({ message: 'date required (YYYY-MM-DD)' })
//       return
//     }
//     const result = await processAttendanceForDate(date)
//     res.json(result)
//   } catch (error: any) {
//     console.error('❌ Process attendance error:', error)
//     res.status(500).json({ success: false, message: error.message })
//   }
// }

// export const processRangeController = async (req: Request, res: Response) => {
//   try {
//     const { fromDate, toDate } = req.body
//     if (!fromDate || !toDate) {
//       res.status(400).json({ message: 'fromDate and toDate required' })
//       return
//     }
//     const result = await processAttendanceForRange(fromDate, toDate)
//     res.json(result)
//   } catch (error: any) {
//     console.error('❌ Process range error:', error)
//     res.status(500).json({ success: false, message: error.message })
//   }
// }