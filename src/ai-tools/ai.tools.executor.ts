import {
  getTodayAttendanceSummary,
  searchEmployees,
  getEmployeeAttendance,
  getAbsentEmployees,
  getLateEmployees,
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
  switch (name) {
    case 'get_today_attendance':
      return getTodayAttendanceSummary(tenantId)

    case 'search_employees':
      return searchEmployees(tenantId, args.name)

    case 'get_employee_attendance':
      return getEmployeeAttendance(tenantId, args.employeeId, args.date)

    case 'get_absent_employees':
      return getAbsentEmployees(tenantId, args.date)

    case 'get_late_employees':
      return getLateEmployees(tenantId, args.date)

    default:
      throw new Error(`Unknown AI tool: ${name}`)
  }
}
