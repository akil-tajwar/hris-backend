import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { authenticateUser } from '../middlewares/auth.middleware'
import {
  importCsvController,
  listCsvFilesController,
  downloadCsvController,
} from '../controllers/csvImport.controller'

const router = express.Router()

// ensure uploads/attendance/ exists
const uploadDir = path.join('uploads', 'attendance')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `punch-${unique}${path.extname(file.originalname)}`)
  },
})

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Only CSV files are allowed'))
    }
  },
})

// POST /api/csv/import
router.post('/import', authenticateUser, upload.single('file'), importCsvController)

// GET /api/csv/list
router.get('/list', authenticateUser, listCsvFilesController)

// GET /api/csv/download/:filename
router.get('/download/:filename', authenticateUser, downloadCsvController)

export default router