import { Router } from 'express'

import {
  getAuditLogs,
  getAuditByRecord,

} from '../controllers/attendanceAudit.controller'
import { authenticateUser } from '../middlewares/auth.middleware'
import { processDateController, processRangeController } from '../controllers/attendanceProcessing.controller'

const router = Router()

// ─── Process ──────────────────────────────────────────────────────
router.post('/process/date',          authenticateUser, processDateController)
router.post('/process/range',         authenticateUser, processRangeController)

// ─── Audit ────────────────────────────────────────────────────────
router.get('/audit',                  authenticateUser, getAuditLogs)
router.get('/audit/record/:recordId', authenticateUser, getAuditByRecord)

export default router



// import { Router } from 'express'
// import {
//   processDateController,
//   processRangeController,
// } from '../controllers/attendanceProcessing.controller'
// import { authenticateUser } from '../middlewares/auth.middleware'


// const router = Router()

// router.post('/process/range', authenticateUser, processRangeController)
// router.get('/process/:date',authenticateUser, processDateController)


// export default router