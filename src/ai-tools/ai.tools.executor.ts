import {
  getTodayAttendanceSummary,
  searchEmployees,
  getEmployeeAttendance,
  getAbsentEmployees,
  getLateEmployees,
  getPresentEmployees,
  getAttendanceSummaryByDate,
  getEmployeesOnLeave,
  getEmployeeDetails,
  getEmployeesByDepartment,
  getEmployeesByDesignation,
  getTotalEmployeeCount,
  getNewJoiners,
  getEmployeeLeaveBalance,
  getPendingLeaveRequests,
  getLeaveTypes,
  getEmployeeSalary,
  getMonthlyPayrollSummary,
  getDepartments,
  getDesignations,
  getCompanies,
  getEmployeeAssets,
  getAvailableAssets,
  getUpcomingHolidays,
  getNotices,
  getEmployeeLoans,
} from './ai.tools'

export const executeAITool = async ({
  name,
  arguments: args,
  tenantId,
}: {
  name: string
  arguments: Record<string, any>
  tenantId: number
}) => {
  const result = await (async () => {
    switch (name) {
      case 'get_today_attendance_summary':
        return getTodayAttendanceSummary(tenantId)
      case 'search_employees':
        return searchEmployees(tenantId, args.name)
      case 'get_employee_attendance':
        return getEmployeeAttendance(tenantId, args.employeeId, args.date)
      case 'get_absent_employees':
        return getAbsentEmployees(tenantId, args.date)
      case 'get_late_employees':
        return getLateEmployees(tenantId, args.date)

      case 'get_present_employees':
        return getPresentEmployees(tenantId, args.date)
      case 'get_attendance_summary_by_date':
        return getAttendanceSummaryByDate(tenantId, args.date)
      case 'get_employees_on_leave':
        return getEmployeesOnLeave(tenantId, args.date)

      case 'get_employee_details':
        return getEmployeeDetails(tenantId, args.employeeId)
      case 'get_employees_by_department':
        return getEmployeesByDepartment(tenantId, args.departmentName)
      case 'get_employees_by_designation':
        return getEmployeesByDesignation(tenantId, args.designationName)
      case 'get_total_employee_count':
        return getTotalEmployeeCount(tenantId)
      case 'get_new_joiners':
        return getNewJoiners(tenantId, args.startDate, args.endDate)

      case 'get_employee_leave_balance':
        return getEmployeeLeaveBalance(tenantId, args.employeeId)
      case 'get_pending_leave_requests':
        return getPendingLeaveRequests(tenantId)
      case 'get_leave_types':
        return getLeaveTypes(tenantId)

      case 'get_employee_salary':
        return getEmployeeSalary(
          tenantId,
          args.employeeId,
          args.month,
          args.year
        )
      case 'get_monthly_payroll_summary':
        return getMonthlyPayrollSummary(tenantId, args.month, args.year)

      case 'get_departments':
        return getDepartments(tenantId)
      case 'get_designations':
        return getDesignations(tenantId)
      case 'get_companies':
        return getCompanies(tenantId)

      case 'get_employee_assets':
        return getEmployeeAssets(tenantId, args.employeeId)
      case 'get_available_assets':
        return getAvailableAssets(tenantId)

      case 'get_upcoming_holidays':
        return getUpcomingHolidays(tenantId, args.fromDate)
      case 'get_notices':
        return getNotices(tenantId)

      case 'get_employee_loans':
        return getEmployeeLoans(tenantId, args.employeeId)

      default:
        throw new Error(`Unknown AI tool: ${name}`)
    }
  })()

  return Array.isArray(result)
    ? { records: result, count: result.length }
    : (result ?? {})
}
