import {
  and,
  desc,
  eq,
  gte,
  like,
  lt,
  lte,
  notInArray,
  or,
  sql,
} from 'drizzle-orm'
import { db } from '../config/database'
import {
  assetsModel,
  assetTransactionsModel,
  attendanceDaily,
  companyModel,
  departmentModel,
  designationModel,
  employeeLeaveApplyModel,
  employeeLeaveBalanceModel,
  employeeLoneModel,
  employeeModel,
  holidaysModel,
  leaveTypeModel,
  noticeModel,
  salaryModel,
} from '../schemas'

export const getTodayAttendanceSummary = async (tenantId: number) => {
  const now = new Date()

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  )

  const result = await db
    .select({
      employeeId: employeeModel.employeeId,
      employeeName: employeeModel.empFullName,
      status: attendanceDaily.status,
      firstIn: attendanceDaily.firstIn,
      lastOut: attendanceDaily.lastOut,
      lateMinutes: attendanceDaily.lateMinutes,
    })
    .from(attendanceDaily)
    .innerJoin(
      employeeModel,
      eq(attendanceDaily.employeeId, employeeModel.employeeId)
    )
    .where(
      and(
        eq(attendanceDaily.tenantId, tenantId),
        gte(attendanceDaily.attendanceDate, startOfDay),
        lt(attendanceDaily.attendanceDate, startOfTomorrow)
      )
    )

  const present = result.filter(
    (employee) => employee.status === 'PRESENT'
  ).length

  const late = result.filter((employee) => employee.status === 'LATE').length

  const absent = result.filter(
    (employee) => employee.status === 'ABSENT'
  ).length

  return {
    date: startOfDay.toISOString().split('T')[0],
    totalRecords: result.length,
    present,
    late,
    absent,
  }
}

export const searchEmployees = async (tenantId: number, name: string) => {
  const result = await db
    .select({
      employeeId: employeeModel.employeeId,
      employeeCode: employeeModel.empCode,
      employeeName: employeeModel.empFullName,
    })
    .from(employeeModel)
    .where(
      and(
        eq(employeeModel.tenantId, tenantId),
        or(
          like(employeeModel.empFullName, `%${name}%`),
          like(employeeModel.empCode, `%${name}%`)
        )
      )
    )

  return result
}

export const getEmployeeAttendance = async (
  tenantId: number,
  employeeId: number,
  date: string
) => {
  const result = await db
    .select({
      employeeId: employeeModel.employeeId,
      employeeName: employeeModel.empFullName,
      status: attendanceDaily.status,
      firstIn: attendanceDaily.firstIn,
      lastOut: attendanceDaily.lastOut,
      workedMinutes: attendanceDaily.workedMinutes,
      lateMinutes: attendanceDaily.lateMinutes,
    })
    .from(attendanceDaily)
    .innerJoin(
      employeeModel,
      eq(attendanceDaily.employeeId, employeeModel.employeeId)
    )
    .where(
      and(
        eq(attendanceDaily.tenantId, tenantId),
        eq(attendanceDaily.employeeId, employeeId),
        eq(attendanceDaily.attendanceDate, new Date(date))
      )
    )
    .limit(1)

  return result[0] ?? null
}

export const getAbsentEmployees = async (tenantId: number, date: string) => {
  return db
    .select({
      employeeId: employeeModel.employeeId,
      employeeCode: employeeModel.empCode,
      employeeName: employeeModel.empFullName,
    })
    .from(attendanceDaily)
    .innerJoin(
      employeeModel,
      eq(attendanceDaily.employeeId, employeeModel.employeeId)
    )
    .where(
      and(
        eq(attendanceDaily.tenantId, tenantId),
        eq(attendanceDaily.attendanceDate, new Date(date)), // plain 'YYYY-MM-DD' string, matches column type
        eq(attendanceDaily.status, 'ABSENT')
      )
    )
}

export const getLateEmployees = async (tenantId: number, date: string) => {
  return db
    .select({
      employeeId: employeeModel.employeeId,
      employeeName: employeeModel.empFullName,
      firstIn: attendanceDaily.firstIn,
      lateMinutes: attendanceDaily.lateMinutes,
    })
    .from(attendanceDaily)
    .innerJoin(
      employeeModel,
      eq(attendanceDaily.employeeId, employeeModel.employeeId)
    )
    .where(
      and(
        eq(attendanceDaily.tenantId, tenantId),
        eq(attendanceDaily.attendanceDate, new Date(date)),
        eq(attendanceDaily.status, 'LATE')
      )
    )
}

export const getPresentEmployees = async (tenantId: number, date: string) => {
  return db
    .select({
      employeeId: employeeModel.employeeId,
      employeeName: employeeModel.empFullName,
      firstIn: attendanceDaily.firstIn,
    })
    .from(attendanceDaily)
    .innerJoin(
      employeeModel,
      eq(attendanceDaily.employeeId, employeeModel.employeeId)
    )
    .where(
      and(
        eq(attendanceDaily.tenantId, tenantId),
        eq(attendanceDaily.attendanceDate, new Date(date)),
        eq(attendanceDaily.status, 'PRESENT')
      )
    )
}

export const getAttendanceSummaryByDate = async (
  tenantId: number,
  date: string
) => {
  const rows = await db
    .select({ status: attendanceDaily.status })
    .from(attendanceDaily)
    .where(
      and(
        eq(attendanceDaily.tenantId, tenantId),
        eq(attendanceDaily.attendanceDate, new Date(date))
      )
    )

  const summary: Record<string, number> = {}
  for (const r of rows) summary[r.status] = (summary[r.status] ?? 0) + 1

  return { date, totalRecords: rows.length, ...summary }
}

export const getEmployeesOnLeave = async (tenantId: number, date: string) => {
  return db
    .select({
      employeeId: employeeModel.employeeId,
      employeeName: employeeModel.empFullName,
    })
    .from(attendanceDaily)
    .innerJoin(
      employeeModel,
      eq(attendanceDaily.employeeId, employeeModel.employeeId)
    )
    .where(
      and(
        eq(attendanceDaily.tenantId, tenantId),
        eq(attendanceDaily.attendanceDate, new Date(date)),
        eq(attendanceDaily.status, 'ON_LEAVE')
      )
    )
}

// ===== EMPLOYEE =====

export const getEmployeeDetails = async (
  tenantId: number,
  employeeId: number
) => {
  const result = await db
    .select({
      employeeId: employeeModel.employeeId,
      empCode: employeeModel.empCode,
      name: employeeModel.empFullName,
      gender: employeeModel.gender,
      doj: employeeModel.doj,
      workEmail: employeeModel.workEmail,
      officialPhone: employeeModel.officialPhone,
      departmentId: employeeModel.departmentId,
      designationId: employeeModel.designationId,
      companyId: employeeModel.companyId,
      isActive: employeeModel.isActive,
    })
    .from(employeeModel)
    .where(
      and(
        eq(employeeModel.tenantId, tenantId),
        eq(employeeModel.employeeId, employeeId)
      )
    )
    .limit(1)

  return result[0] ?? null
}

export const getEmployeesByDepartment = async (
  tenantId: number,
  departmentName: string
) => {
  return db
    .select({
      employeeId: employeeModel.employeeId,
      employeeName: employeeModel.empFullName,
      empCode: employeeModel.empCode,
    })
    .from(employeeModel)
    .innerJoin(
      departmentModel,
      eq(employeeModel.departmentId, departmentModel.departmentId)
    )
    .where(
      and(
        eq(employeeModel.tenantId, tenantId),
        like(departmentModel.departmentName, `%${departmentName}%`)
      )
    )
}

export const getEmployeesByDesignation = async (
  tenantId: number,
  designationName: string
) => {
  return db
    .select({
      employeeId: employeeModel.employeeId,
      employeeName: employeeModel.empFullName,
      empCode: employeeModel.empCode,
    })
    .from(employeeModel)
    .innerJoin(
      designationModel,
      eq(employeeModel.designationId, designationModel.designationId)
    )
    .where(
      and(
        eq(employeeModel.tenantId, tenantId),
        like(designationModel.designationName, `%${designationName}%`)
      )
    )
}

export const getTotalEmployeeCount = async (tenantId: number) => {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(employeeModel)
    .where(
      and(
        eq(employeeModel.tenantId, tenantId),
        eq(employeeModel.isActive, true)
      )
    )

  return { totalActiveEmployees: result[0]?.count ?? 0 }
}

export const getNewJoiners = async (
  tenantId: number,
  startDate: string,
  endDate: string
) => {
  return db
    .select({
      employeeId: employeeModel.employeeId,
      employeeName: employeeModel.empFullName,
      doj: employeeModel.doj,
    })
    .from(employeeModel)
    .where(
      and(
        eq(employeeModel.tenantId, tenantId),
        gte(employeeModel.doj, new Date(startDate)),
        lte(employeeModel.doj, new Date(endDate))
      )
    )
}

// ===== LEAVE =====

export const getEmployeeLeaveBalance = async (
  tenantId: number,
  employeeId: number
) => {
  return db
    .select({
      leaveType: leaveTypeModel.name,
      earnedDays: employeeLeaveBalanceModel.earnedDays,
      usedDays: employeeLeaveBalanceModel.usedDays,
      remainingDays: employeeLeaveBalanceModel.remainingDays,
      year: employeeLeaveBalanceModel.year,
    })
    .from(employeeLeaveBalanceModel)
    .innerJoin(
      leaveTypeModel,
      eq(employeeLeaveBalanceModel.leaveTypeId, leaveTypeModel.leaveTypeId)
    )
    .where(
      and(
        eq(employeeLeaveBalanceModel.tenantId, tenantId),
        eq(employeeLeaveBalanceModel.employeeId, employeeId)
      )
    )
}

export const getPendingLeaveRequests = async (tenantId: number) => {
  return db
    .select({
      employeeId: employeeModel.employeeId,
      employeeName: employeeModel.empFullName,
      effectiveFrom: employeeLeaveApplyModel.effectiveFrom,
      effectiveTo: employeeLeaveApplyModel.effectiveTo,
      noOfDays: employeeLeaveApplyModel.noOfDays,
    })
    .from(employeeLeaveApplyModel)
    .innerJoin(
      employeeModel,
      eq(employeeLeaveApplyModel.employeeId, employeeModel.employeeId)
    )
    .where(
      and(
        eq(employeeLeaveApplyModel.tenantId, tenantId),
        eq(employeeLeaveApplyModel.status, 'Pending')
      )
    )
}

export const getLeaveTypes = async (tenantId: number) => {
  return db
    .select({
      name: leaveTypeModel.name,
      category: leaveTypeModel.category,
      maxDaysPerYear: leaveTypeModel.maxDaysPerYear,
    })
    .from(leaveTypeModel)
    .where(
      and(
        eq(leaveTypeModel.tenantId, tenantId),
        eq(leaveTypeModel.active, true)
      )
    )
}

// ===== SALARY =====

export const getEmployeeSalary = async (
  tenantId: number,
  employeeId: number,
  month: string,
  year: number
) => {
  const result = await db
    .select({
      basicSalary: salaryModel.basicSalary,
      grossSalary: salaryModel.grossSalary,
      netSalary: salaryModel.netSalary,
      isSalaryGiven: salaryModel.isSalaryGiven,
    })
    .from(salaryModel)
    .where(
      and(
        eq(salaryModel.tenantId, tenantId),
        eq(salaryModel.employeeId, employeeId),
        eq(salaryModel.salaryMonth, month as any),
        eq(salaryModel.salaryYear, year)
      )
    )
    .limit(1)

  return result[0] ?? null
}

export const getMonthlyPayrollSummary = async (
  tenantId: number,
  month: string,
  year: number
) => {
  const result = await db
    .select({
      totalEmployees: sql<number>`count(*)`,
      totalGross: sql<number>`sum(${salaryModel.grossSalary})`,
      totalNet: sql<number>`sum(${salaryModel.netSalary})`,
    })
    .from(salaryModel)
    .where(
      and(
        eq(salaryModel.tenantId, tenantId),
        eq(salaryModel.salaryMonth, month as any),
        eq(salaryModel.salaryYear, year)
      )
    )

  return result[0] ?? { totalEmployees: 0, totalGross: 0, totalNet: 0 }
}

// ===== COMPANY STRUCTURE =====

export const getDepartments = async (tenantId: number) => {
  return db
    .select({
      departmentName: departmentModel.departmentName,
      code: departmentModel.departmentCode,
    })
    .from(departmentModel)
    .where(
      and(
        eq(departmentModel.tenantId, tenantId),
        eq(departmentModel.status, true)
      )
    )
}

export const getDesignations = async (tenantId: number) => {
  return db
    .select({
      designationName: designationModel.designationName,
      jobLevel: designationModel.jobLevel,
    })
    .from(designationModel)
    .where(
      and(
        eq(designationModel.tenantId, tenantId),
        eq(designationModel.status, true)
      )
    )
}

export const getCompanies = async (tenantId: number) => {
  return db
    .select({
      companyName: companyModel.companyName,
      shortName: companyModel.shortName,
    })
    .from(companyModel)
    .where(
      and(eq(companyModel.tenantId, tenantId), eq(companyModel.status, true))
    )
}

// ===== ASSETS =====

export const getEmployeeAssets = async (
  tenantId: number,
  employeeId: number
) => {
  return db
    .select({
      assetName: assetsModel.assetName,
      assetCode: assetsModel.assetCode,
      status: assetsModel.currentStatus,
    })
    .from(assetTransactionsModel)
    .innerJoin(
      assetsModel,
      eq(assetTransactionsModel.assetId, assetsModel.assetId)
    )
    .where(
      and(
        eq(assetTransactionsModel.tenantId, tenantId),
        eq(assetTransactionsModel.employeeId, employeeId),
        eq(assetTransactionsModel.transactionType, 'ISSUE'),
        eq(assetsModel.currentStatus, 'ASSIGNED')
      )
    )
}

export const getAvailableAssets = async (tenantId: number) => {
  return db
    .select({
      assetName: assetsModel.assetName,
      assetCode: assetsModel.assetCode,
    })
    .from(assetsModel)
    .where(
      and(
        eq(assetsModel.tenantId, tenantId),
        eq(assetsModel.currentStatus, 'AVAILABLE')
      )
    )
}

// ===== HOLIDAYS & NOTICES =====

export const getUpcomingHolidays = async (
  tenantId: number,
  fromDate: string
) => {
  return db
    .select({
      title: holidaysModel.title,
      date: holidaysModel.date,
      type: holidaysModel.type,
    })
    .from(holidaysModel)
    .where(
      and(
        eq(holidaysModel.tenantId, tenantId),
        gte(holidaysModel.date, fromDate)
      )
    )
    .orderBy(holidaysModel.date)
    .limit(10)
}

export const getNotices = async (tenantId: number) => {
  return db
    .select({ title: noticeModel.title, noticeDate: noticeModel.noticeDate })
    .from(noticeModel)
    .where(eq(noticeModel.tenantId, tenantId))
    .orderBy(desc(noticeModel.noticeDate))
    .limit(5)
}

// ===== LOANS =====

export const getEmployeeLoans = async (
  tenantId: number,
  employeeId: number
) => {
  return db
    .select({
      loanName: employeeLoneModel.employeeLoneName,
      amount: employeeLoneModel.amount,
      perMonth: employeeLoneModel.perMonth,
      isFullPaid: employeeLoneModel.isFullPaid,
    })
    .from(employeeLoneModel)
    .where(
      and(
        eq(employeeLoneModel.tenantId, tenantId),
        eq(employeeLoneModel.employeeId, employeeId)
      )
    )
}
// 2. ai-tools/ai.tools.definitions.ts — extend the functionDeclarations array

// Add these entries alongside your existing 5:

// typescript
export const geminiTools = [
  {
    functionDeclarations: [
      // ... your existing 5 (get_today_attendance_summary, search_employees,
      // get_employee_attendance, get_absent_employees, get_late_employees) ...

      {
        name: 'get_present_employees',
        description: 'Get employees who were present on a specific date.',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date in YYYY-MM-DD format.' },
          },
          required: ['date'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_attendance_summary_by_date',
        description:
          'Get a full attendance breakdown (present, absent, late, leave, holiday counts) for any specific date, not just today.',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date in YYYY-MM-DD format.' },
          },
          required: ['date'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_employees_on_leave',
        description:
          'Get employees who were on approved leave on a specific date.',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date in YYYY-MM-DD format.' },
          },
          required: ['date'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_employee_details',
        description:
          "Get an employee's full profile details by their employee ID.",
        parameters: {
          type: 'object',
          properties: {
            employeeId: { type: 'integer', description: 'Employee ID.' },
          },
          required: ['employeeId'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_employees_by_department',
        description: 'List all employees in a given department.',
        parameters: {
          type: 'object',
          properties: {
            departmentName: {
              type: 'string',
              description: 'Department name to search for.',
            },
          },
          required: ['departmentName'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_employees_by_designation',
        description: 'List all employees with a given designation/job title.',
        parameters: {
          type: 'object',
          properties: {
            designationName: {
              type: 'string',
              description: 'Designation name to search for.',
            },
          },
          required: ['designationName'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_total_employee_count',
        description: 'Get the total number of active employees for the tenant.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_new_joiners',
        description: 'Get employees who joined within a specific date range.',
        parameters: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              description: 'Start date in YYYY-MM-DD format.',
            },
            endDate: {
              type: 'string',
              description: 'End date in YYYY-MM-DD format.',
            },
          },
          required: ['startDate', 'endDate'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_employee_leave_balance',
        description:
          "Get an employee's remaining leave balance broken down by leave type.",
        parameters: {
          type: 'object',
          properties: {
            employeeId: { type: 'integer', description: 'Employee ID.' },
          },
          required: ['employeeId'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_pending_leave_requests',
        description: 'Get all leave requests currently pending approval.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_leave_types',
        description:
          'Get the list of available leave types and their yearly allocation.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_employee_salary',
        description:
          "Get an employee's salary details for a specific month and year.",
        parameters: {
          type: 'object',
          properties: {
            employeeId: { type: 'integer', description: 'Employee ID.' },
            month: { type: 'string', description: 'Month name, e.g. "July".' },
            year: { type: 'integer', description: 'Year, e.g. 2026.' },
          },
          required: ['employeeId', 'month', 'year'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_monthly_payroll_summary',
        description:
          'Get total payroll summary (headcount, gross, net) for a given month and year.',
        parameters: {
          type: 'object',
          properties: {
            month: { type: 'string', description: 'Month name, e.g. "July".' },
            year: { type: 'integer', description: 'Year, e.g. 2026.' },
          },
          required: ['month', 'year'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_departments',
        description: 'List all active departments for the tenant.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_designations',
        description: 'List all active designations/job titles for the tenant.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_companies',
        description: 'List all active companies under the tenant.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_employee_assets',
        description: 'Get assets currently assigned to a specific employee.',
        parameters: {
          type: 'object',
          properties: {
            employeeId: { type: 'integer', description: 'Employee ID.' },
          },
          required: ['employeeId'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_available_assets',
        description:
          'Get assets currently available (not assigned) for the tenant.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_upcoming_holidays',
        description: 'Get upcoming holidays from a given date onward.',
        parameters: {
          type: 'object',
          properties: {
            fromDate: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format to search from.',
            },
          },
          required: ['fromDate'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_notices',
        description: 'Get the most recent company notices/announcements.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_employee_loans',
        description: "Get an employee's loan records and repayment status.",
        parameters: {
          type: 'object',
          properties: {
            employeeId: { type: 'integer', description: 'Employee ID.' },
          },
          required: ['employeeId'],
          additionalProperties: false,
        },
      },
    ],
  },
]
