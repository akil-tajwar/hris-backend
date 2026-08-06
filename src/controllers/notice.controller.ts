import { Request, Response, NextFunction } from 'express'
import {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
} from '../services/notice.service'
import { requirePermission } from '../services/utils/jwt.utils'

/* ================================
   CREATE NOTICE
================================ */
export const createNoticeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('FILES 👉', req.files)
    console.log('BODY 👉', req.body)

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[]
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`

    const noticeDetails = req.body

    // 📸 PDF URL
    if (files?.pdfUrl?.[0]) {
      noticeDetails.pdfUrl = `${baseUrl}${files.pdfUrl[0].filename}`
    }

    // ✅ Convert noticeDate
    if (noticeDetails.noticeDate) {
      noticeDetails.noticeDate = new Date(noticeDetails.noticeDate)
    }

    const tenantId = req.user?.tenantId
    const createdBy = req.user?.userId

    const data = {
      ...noticeDetails,
      tenantId,
      createdBy,
    }

    const notice = await createNotice(data)

    res.status(201).json({
      success: true,
      data: notice,
    })
  } catch (err) {
    console.error('❌ Notice creation error:', err)
    next(err)
  }
}

/* ================================
   UPDATE NOTICE
================================ */
export const updateNoticeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const noticeId = Number(req.params.noticeId)

    if (!noticeId) {
      res.status(400).json({
        success: false,
        message: 'Invalid notice ID',
      })
      return
    }

    console.log('FILES 👉', req.files)
    console.log('BODY 👉', req.body)

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[]
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`

    // ✅ Use req.body directly
    const noticeDetails = req.body

    // 📸 PDF
    if (files?.pdfUrl?.[0]) {
      noticeDetails.pdfUrl = `${baseUrl}${files.pdfUrl[0].filename}`
    }

    // ✅ Convert noticeDate
    if (noticeDetails.noticeDate) {
      noticeDetails.noticeDate = new Date(noticeDetails.noticeDate)
    }

    // ✅ Set updatedBy
    noticeDetails.updatedBy = req.user?.userId

    const updatedNotice = await updateNotice(noticeId, noticeDetails)

    res.json({
      success: true,
      data: updatedNotice,
    })
  } catch (err) {
    console.error('❌ Notice update error:', err)
    next(err)
  }
}

/* ================================
   GET ALL NOTICES
================================ */
export const getNoticesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_notice')
    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }
    const notices = await getNotices(tenantId)
    res.json(notices)
  } catch (err) {
    next(err)
  }
}

/* ================================
   GET NOTICE BY ID
================================ */
export const getNoticeByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_notice')
    const { noticeId } = req.params
    const notice = await getNoticeById(Number(noticeId))
    res.json({ status: 'success', data: notice })
  } catch (err) {
    next(err)
  }
}

/* ================================
   DELETE NOTICE
================================ */
export const deleteNoticeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_notice')
    const { noticeId } = req.params
    await deleteNotice(Number(noticeId))
    res.json({ status: 'success', message: 'Notice deleted' })
  } catch (err) {
    next(err)
  }
}
