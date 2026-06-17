import { Router } from 'express'
import authRoutes from './auth.routes'
import roleRoutes from './role.routes'
import tenantRoutes from './tenant.routes'
import customerRoutes from './customer.routes'
import departmentsRoutes from './departments.routes'
import designationsRoutes from './designations.routes'
import companyRoutes from './company.routes'
import businessUnitsRoutes from './businessUnits.routes'
import divisionRoutes from './division.routes'
import workStationRoutes from './workStation.routes'
import costCenterRoutes from './costCenter.routes'
import employmentTypeRoutes from './employmentTypes.routes'
import weekDayRoutes from './weekdays.routes'
import employeePreboardingRoutes from './employeePreboarding.routes'
import checklistRoutes from './checklist.routes'
import employeeRoutes from './employees.routes'
import notificationRoutes from './notification.routes'
import shiftRoutes from './shifts.routes'
import holidayRoutes from './holidays.routes'
import leaveTypeRoutes from './leaveTypes.routes'
import leavePolicyRoutes from './leavePolicy.routes'
import employeeLeaveAssignmentRoutes from './employeeLeaveAssignment.routes'
import employeeLeaveApplyRoutes from './employeeLeaveApply.routes'
import employeeAttendanceRoutes from './employeeAttendances.routes'
import salaryComponentsRoutes from './salaryComponents.routes'
import salaryStructureRoutes from './salaryStructure.routes'
import salaryRoutes from './salary.routes'
import employeeLoneRoutes from './employeeLones.routes'
import reportRoutes from './reports.routes'
import dashboardRoutes from './dashboard.routes'
import assetCategoryRoutes from './assetCategory.routes'
import assetsRoutes from './assets.routes'
import attendancePolicyRoutes from './attendancePolicy.routes'
import attendancePunchRoutes from './attendancePunch.routes'
import attendanceDailyRoutes from './attendanceDaily.routes'
import csvImportRoutes from './csvImport.routes'
import shiftAllocationRoutes from './shiftAllocation.routes'
import attendanceProcessingRoutes from './attendanceProcessing.routes'
import holidayCalendarRoutes from './holidayCalendar.routes'
import holidaysRoutes from './holidays.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/roles', roleRoutes)
router.use('/tenants', tenantRoutes)
router.use('/customers', customerRoutes)
router.use('/departments', departmentsRoutes)
router.use('/designations', designationsRoutes)
router.use('/company', companyRoutes)
router.use('/business-units', businessUnitsRoutes)
router.use('/divisions', divisionRoutes)
router.use('/workStations', workStationRoutes)
router.use('/costCenters', costCenterRoutes)
router.use('/employmentTypes', employmentTypeRoutes)
router.use('/weekDays', weekDayRoutes)
router.use('/employeePreboarding', employeePreboardingRoutes)
router.use('/checklists', checklistRoutes)
router.use('/employees', employeeRoutes)
router.use('/notifications', notificationRoutes)
router.use('/shift', shiftRoutes)
router.use('/holidays', holidayRoutes)
router.use('/holidayCalendar', holidayCalendarRoutes)
router.use ('/holidays', holidaysRoutes) 
router.use('/leaveTypes', leaveTypeRoutes)
router.use('/leavePolicy', leavePolicyRoutes)
router.use('/employeeLeaveAssignments', employeeLeaveAssignmentRoutes)
router.use('/employeeLeaveApply', employeeLeaveApplyRoutes)
router.use('/employeeAttendances', employeeAttendanceRoutes)
router.use('/salaryComponents', salaryComponentsRoutes)
router.use('/salaryStructures', salaryStructureRoutes)
router.use('/salary', salaryRoutes)
router.use('/employeeLones', employeeLoneRoutes)
router.use('/reports', reportRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/assetCategory', assetCategoryRoutes)
router.use('/assets', assetsRoutes)
router.use('/attendancePolicies', attendancePolicyRoutes)
router.use('/attendancePunches', attendancePunchRoutes)
router.use('/attendanceDaily', attendanceDailyRoutes)
router.use('/csv', csvImportRoutes)
router.use('/shiftAllocation', shiftAllocationRoutes)
router.use('/attendanceProcessing', attendanceProcessingRoutes)

export default router
