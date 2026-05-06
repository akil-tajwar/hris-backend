import { NextFunction, Request, Response } from 'express'
import {
  createOfficeTiming,
  getAllOfficeTimings,
  getOfficeTimingById,
  updateOfficeTiming,
  deleteOfficeTiming,
} from '../services/officeTimings.service'
import { requirePermission } from '../services/utils/jwt.utils'

/* CREATE */
export const createOfficeTimingController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'create_office_timing')
    const result = await createOfficeTiming(req.body)
    res.status(201).json({
      message: 'Office timing created successfully',
      data: result,
    })
  } catch (error) {
    res.status(500).json({ message: 'Creation failed', error })
  }
}

// export const createOfficeTimingController = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     requirePermission(req, 'create_office_timing')

//     const leaveTypes = await createOfficeTiming(req.body)

//     res.status(201).json({
//       status: 'success',
//       data: leaveTypes,
//     })
//   } catch (err) {
//     next(err)
//   }
// }

/* UPDATE */
export const updateOfficeTimingController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'edit_office_timing')
    const id = Number(req.params.officeTimingId)
    if (!id) {
      res.status(400).json({ message: 'Invalid ID' })
    }

    await updateOfficeTiming(id, req.body)

    res.json({ message: 'Office timing updated successfully' })
  } catch (error: any) {
    console.error('UpdateOfficeTiming error:', error) // <-- log full error
    res.status(500).json({
      message: 'Update failed',
      error: error.message || error,
    })
  }
}

/* GET ALL */
export const getOfficeTimingsController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_office_timing')
    const data = await getAllOfficeTimings()
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: 'Fetch failed', error })
  }
}

/* GET BY ID */
export const getOfficeTimingByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_office_timing')
    const id = Number(req.params.id)
    const data = await getOfficeTimingById(id)

    if (!data) {
      return res.status(404).json({ message: 'Office timing not found' })
    }

    res.json(data)
  } catch (error) {
    res.status(500).json({ message: 'Fetch failed', error })
  }
}

/* DELETE */
export const deleteOfficeTimingController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'delete_office_timing')
    const officeTimingId = Number(req.params.officeTimingId)
    deleteOfficeTiming(officeTimingId)
    res.json({ message: 'Office timing deleted successfully' })
  } catch (error: any) {
    console.error(error)
    res.status(400).json({ message: error.message })
  }
}
