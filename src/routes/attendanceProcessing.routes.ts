import { Router } from 'express'

import {
  getAuditLogs,
  getAuditByRecord,
} from '../controllers/attendanceAudit.controller'
import { authenticateUser } from '../middlewares/auth.middleware'
import {
  processDateController,
  processRangeController,
} from '../controllers/attendanceProcessing.controller'

const router = Router()

// ─── Process ──────────────────────────────────────────────────────
router.post('/process/date', authenticateUser, processDateController)
router.post('/process/range', authenticateUser, processRangeController)

// ─── Audit ────────────────────────────────────────────────────────
router.get('/audit', authenticateUser, getAuditLogs)
router.get('/audit/record/:recordId', authenticateUser, getAuditByRecord)

export default router
