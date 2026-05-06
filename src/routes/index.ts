import { Router } from 'express'
import authRoutes from './auth.routes'
import departmentsRoutes from './departments.routes'
import designationsRoutes from './designations.routes'
import employeeTypeRoutes from './employeeTypes.routes'
import weekendRoutes from './weekends.routes'
import employeeRoutes from './employees.routes'
import officeTimingRoutes from './officeTimings.routes'
import holidayRoutes from './holidays.routes'
import leaveTypeRoutes from './leaveTypes.routes'
import employeeAttendanceRoutes from './employeeAttendances.routes'
import otherSalaryComponentsRoutes from './otherSalaryComponents.routes'
import employeeOtherSalaryComponentsRoutes from './employeeOtherSalaryComponents.routes'
import salaryRoutes from './salary.routes'
import employeeLoneRoutes from './employeeLones.routes'
import employeeLeaveroutes from './employeeLeaves.routes'
import reportRoutes from './reports.routes'
import dashboardRoutes from './dashboard.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/departments', departmentsRoutes)
router.use('/designations', designationsRoutes)
router.use('/employeeTypes', employeeTypeRoutes)
router.use('/weekends', weekendRoutes)
router.use('/employees', employeeRoutes)
router.use('/officeTimings', officeTimingRoutes)
router.use('/holidays', holidayRoutes)
router.use('/leaveTypes', leaveTypeRoutes)
router.use('/employeeAttendances', employeeAttendanceRoutes)
router.use('/otherSalaryComponents', otherSalaryComponentsRoutes)
router.use(
  '/employeeOtherSalaryComponents',
  employeeOtherSalaryComponentsRoutes
)
router.use('/salary', salaryRoutes)
router.use('/employeeLones', employeeLoneRoutes)
router.use('/employeeLeaves', employeeLeaveroutes)
router.use('/reports', reportRoutes)
router.use('/dashboard', dashboardRoutes)

export default router
