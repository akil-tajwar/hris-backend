import { Router } from 'express'
import {
  createWorkStationController,
  getWorkStationsController,
  getWorkStationByIdController,
  updateWorkStationController,
  deleteWorkStationController,
} from '../controllers/workStation.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createWorkStationController)
router.get('/getAll', authenticateUser, getWorkStationsController)
router.get('/get/:workStationId', authenticateUser, getWorkStationByIdController)
router.patch('/edit/:workStationId', authenticateUser, updateWorkStationController)
router.delete('/delete/:workStationId', authenticateUser, deleteWorkStationController)

export default router