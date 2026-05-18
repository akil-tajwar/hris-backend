import { Router } from 'express'

import {
    createSalaryStructureController,
    deleteSalaryStructureController,
    getAllSalaryStructuresController,
    updateSalaryStructureController,
} from '../controllers/salaryStructure.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createSalaryStructureController)
router.get('/getAll', authenticateUser, getAllSalaryStructuresController)
router.patch('/edit/:id', authenticateUser, updateSalaryStructureController)
router.delete('/delete/:id', authenticateUser, deleteSalaryStructureController)

export default router
