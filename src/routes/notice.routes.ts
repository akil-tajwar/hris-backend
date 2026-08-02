import { Router } from 'express'
import {
  createNoticeController,
  getNoticesController,
  getNoticeByIdController,
  updateNoticeController,
  deleteNoticeController,
} from '../controllers/notice.controller'
import { upload } from '../middlewares/upload'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post(
  '/create',
  upload.fields([{ name: 'pdfUrl', maxCount: 1 }]),
  authenticateUser,
  createNoticeController
)
router.patch(
  '/edit/:noticeId',
  upload.fields([{ name: 'pdfUrl', maxCount: 1 }]),
  authenticateUser,
  updateNoticeController
)
router.get('/getAll', authenticateUser, getNoticesController)
router.get('/get/:noticeId', authenticateUser, getNoticeByIdController)
router.delete('/delete/:noticeId', authenticateUser, deleteNoticeController)

export default router
