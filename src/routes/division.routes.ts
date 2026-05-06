import { Router } from 'express'
import {
  createDivisionController,
  getDivisionsController,
  getDivisionByIdController,
  updateDivisionController,
  deleteDivisionController,
} from '../controllers/division.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createDivisionController)
router.get('/getAll', authenticateUser, getDivisionsController)
router.get('/get/:divisionId', authenticateUser, getDivisionByIdController)
router.patch('/edit/:divisionId', authenticateUser, updateDivisionController)
router.delete('/delete/:divisionId', authenticateUser, deleteDivisionController)

export default router