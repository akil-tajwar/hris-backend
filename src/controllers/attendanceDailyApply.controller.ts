import { Request, Response, NextFunction } from 'express'
import {
  createAttendanceDailyApply,
  editAttendanceDailyApply,
  getAttendanceApplyByUserId,
  acceptedAttendanceApplyByRepAuth,
  acceptedAttendanceApplyByByHr,
  rejectAttendanceApply,
  getAllAttendanceApply,
} from '../services/attendanceDailyApply.service'
import { requirePermission } from '../services/utils/jwt.utils'

// CREATE
export const createAttendanceDailyApplyController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // requirePermission(req, 'create_attendance_daily_apply')

    const tenantId = req.user?.tenantId
    const data = {
      ...req.body,
      tenantId,
    }
    const attendanceDailyId = req.params.attendanceDailyId
    console.log(
      '🚀 ~ createAttendanceDailyApplyController ~ attendanceDailyId:',
      attendanceDailyId
    )

    const applyRecord = await createAttendanceDailyApply(
      data,
      Number(attendanceDailyId)
    )

    res.status(201).json({
      status: 'success',
      data: applyRecord,
    })
  } catch (err) {
    next(err)
  }
}

// EDIT
export const editAttendanceDailyApplyController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // requirePermission(req, 'edit_attendance_daily_apply')

    const { attendanceDailyApplyId } = req.params
    const updatedBy = req.user?.userId

    const applyRecord = await editAttendanceDailyApply(
      Number(attendanceDailyApplyId),
      { ...req.body, updatedBy }
    )

    res.json({
      status: 'success',
      data: applyRecord,
    })
  } catch (err) {
    next(err)
  }
}

// GET BY USER ID
export const getAttendanceApplyByUserIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // requirePermission(req, 'view_attendance_daily_apply')

    const { userId } = req.params
    const tenantId = req.user?.tenantId

    const applyRecords = await getAttendanceApplyByUserId(
      Number(userId),
      tenantId
    )

    res.json(applyRecords)
  } catch (err) {
    next(err)
  }
}

export const getAllAttendanceApplyController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // requirePermission(req, 'view_attendance_daily_apply')

    const { userId } = req.params
    const tenantId = req.user?.tenantId

    const applyRecords = await getAllAttendanceApply(tenantId)

    res.json(applyRecords)
  } catch (err) {
    next(err)
  }
}

// APPROVE - Reporting Authority
export const acceptedAttendanceApplyByRepAuthController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // requirePermission(req, 'approve_attendance_daily_apply_rep_auth')

    const { attendanceDailyApplyId } = req.params
    const updatedBy = req.user?.userId as number

    const result = await acceptedAttendanceApplyByRepAuth(
      Number(attendanceDailyApplyId),
      updatedBy
    )

    res.json({
      status: 'success',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

// APPROVE - HR
export const acceptedAttendanceApplyByByHrController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // requirePermission(req, 'approve_attendance_daily_apply_hr')

    const { attendanceDailyApplyId } = req.params
    const updatedBy = req.user?.userId as number

    const result = await acceptedAttendanceApplyByByHr(
      Number(attendanceDailyApplyId),
      updatedBy
    )

    res.json({
      status: 'success',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

// REJECT
export const rejectAttendanceApplyController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // requirePermission(req, 'edit_attendance_daily_apply')

    const { attendanceDailyApplyId } = req.params
    const updatedBy = req.user?.userId as number

    const result = await rejectAttendanceApply(
      Number(attendanceDailyApplyId),
      updatedBy
    )

    res.json({
      status: 'success',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}
