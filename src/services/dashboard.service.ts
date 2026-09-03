import { eq, and, gte, lte, sql, or, gt, inArray } from 'drizzle-orm'
import { db } from '../config/database'
import {
  attendanceDaily,
  departmentModel,
  designationModel,
  employeeLoneInstallemntsModel,
  employeeLoneModel,
  employeeLeaveBalanceModel,
  employeeModel,
  leaveTypeModel,
  salaryModel,
} from '../schemas'

// Define types for better type safety
type EmployeeDetails = {
  employeeId: number
  empCode: string | null
  empFullName: string | null
  designationName: string | null
  departmentName: string | null
  totalLeavesTaken: number
}

type LeaveDetails = {
  leaveTypeId: number | null
  leaveTypeName: string | null
  totalLeaves: number | null
  takenLeaves: number | null
  remainingLeaves: number | null
}

type EmployeeLeaveMapValue = {
  employeeDetails: EmployeeDetails
  leaveDetails: LeaveDetails[]
}

type AttendanceDetails = {
  attendanceDate: Date
  isAbsent: number
  lateInMinutes: number | null
  earlyOutMinutes: number | null
}

type EmployeeAttendanceMapValue = {
  employeeDetails: {
    employeeId: number
    empCode: string | null
    empFullName: string | null
    designationName: string | null
    departmentName: string | null
    totalAbsent: number
    totalLateInMinutes: number
    totalEarlyOutMinutes: number
  }
  attendanceDetails: AttendanceDetails[]
}

type LateEarlyOutDetails = {
  attendanceDate: Date
  status: string
  lateInMinutes: number
  earlyOutMinutes: number
}

type EmployeeLateEarlyOutMapValue = {
  employeeDetails: {
    employeeId: number
    empCode: string | null
    empFullName: string | null
    designationName: string | null
    departmentName: string | null
    totalLateInMinutes: number
    totalEarlyOutMinutes: number
    lateInOccurrences: number
    earlyOutOccurrences: number
  }
  attendanceDetails: LateEarlyOutDetails[]
}

type EmployeeLoanMapValue = {
  employeeId: number
  empCode: string | null
  empFullName: string | null
  designationName: string | null
  departmentName: string | null
  totalLoanAmount: number
  totalPaid: number
  totalRemaining: number
  totalInstallments: number
  paidInstallments: number
  pendingInstallments: number
  skippedInstallments: number
  _processedLoans: Set<number>
}

/**
 * Get employeeId(s) from userId.
 *
 * userId === undefined
 *   -> return undefined, meaning all employees
 *
 * userId provided
 *   -> return the employeeId(s) belonging to that user
 *
 * If the user doesn't have an employee record,
 * return an empty array.
 */
const getEmployeeIdsByUserId = async (
  tenantId: number,
  userId?: number
): Promise<number[] | undefined> => {
  if (userId === undefined) {
    return undefined
  }

  const employees = await db
    .select({
      employeeId: employeeModel.employeeId,
    })
    .from(employeeModel)
    .where(
      and(
        eq(employeeModel.tenantId, tenantId),
        eq(employeeModel.userId, userId)
      )
    )

  const ids = employees
    .map((employee) => employee.employeeId)
    .filter((id): id is number => id !== null && id !== undefined)

  return ids.length > 0 ? ids : []
}

/**
 * Helper function to add company filter to conditions
 */
const addCompanyFilter = (conditions: any[], companyId?: number) => {
  if (companyId !== undefined) {
    conditions.push(eq(employeeModel.companyId, companyId))
  }
  return conditions
}

/**
 * Helper function to add department filter to conditions
 */
const addDepartmentFilter = (conditions: any[], departmentId?: number) => {
  if (departmentId !== undefined) {
    conditions.push(eq(employeeModel.departmentId, departmentId))
  }
  return conditions
}

/**
 * Helper function to add employee filter to conditions
 */
const addEmployeeFilter = (conditions: any[], employeeIds?: number[]) => {
  if (employeeIds !== undefined && employeeIds.length > 0) {
    conditions.push(inArray(employeeModel.employeeId, employeeIds))
  }
  return conditions
}

/* =========================================================
   EMPLOYEE LEAVE SUMMARY
========================================================= */

export const getEmployeeLeaveSummary = async (
  tenantId: number,
  companyId?: number,
  departmentId?: number,
  userId?: number
) => {
  const currentYear = new Date().getFullYear()

  const employeeIds = await getEmployeeIdsByUserId(tenantId, userId)

  // If a specific user was requested but no employee exists
  if (userId !== undefined && employeeIds?.length === 0) {
    return []
  }

  const conditions = [
    eq(employeeLeaveBalanceModel.tenantId, tenantId),
    eq(employeeLeaveBalanceModel.year, currentYear),
  ]

  // Apply all filters
  addCompanyFilter(conditions, companyId)
  addDepartmentFilter(conditions, departmentId)

  // Apply employee filter - use inArray on employeeLeaveBalanceModel
  if (employeeIds !== undefined && employeeIds.length > 0) {
    conditions.push(inArray(employeeLeaveBalanceModel.employeeId, employeeIds))
  }

  const leaveBalances = await db
    .select({
      employeeId: employeeModel.employeeId,
      empCode: employeeModel.empCode,
      empFullName: employeeModel.empFullName,
      designationName: designationModel.designationName,
      departmentName: departmentModel.departmentName,

      leaveTypeId: leaveTypeModel.leaveTypeId,
      leaveTypeName: leaveTypeModel.name,
      earnedDays: employeeLeaveBalanceModel.earnedDays,
      usedDays: employeeLeaveBalanceModel.usedDays,
      remainingDays: employeeLeaveBalanceModel.remainingDays,
    })
    .from(employeeLeaveBalanceModel)
    .leftJoin(
      employeeModel,
      eq(employeeLeaveBalanceModel.employeeId, employeeModel.employeeId)
    )
    .leftJoin(
      designationModel,
      eq(employeeModel.designationId, designationModel.designationId)
    )
    .leftJoin(
      departmentModel,
      eq(employeeModel.departmentId, departmentModel.departmentId)
    )
    .leftJoin(
      leaveTypeModel,
      eq(employeeLeaveBalanceModel.leaveTypeId, leaveTypeModel.leaveTypeId)
    )
    .where(and(...conditions))

  const employeeMap = new Map<number, EmployeeLeaveMapValue>()

  for (const leave of leaveBalances) {
    const employeeId = leave.employeeId

    if (employeeId === null || employeeId === undefined) {
      continue
    }

    if (!employeeMap.has(employeeId)) {
      employeeMap.set(employeeId, {
        employeeDetails: {
          employeeId,
          empCode: leave.empCode,
          empFullName: leave.empFullName,
          designationName: leave.designationName,
          departmentName: leave.departmentName,
          totalLeavesTaken: 0,
        },
        leaveDetails: [],
      })
    }

    const employeeData = employeeMap.get(employeeId)!

    employeeData.leaveDetails.push({
      leaveTypeId: leave.leaveTypeId,
      leaveTypeName: leave.leaveTypeName,
      totalLeaves: leave.earnedDays,
      takenLeaves: leave.usedDays,
      remainingLeaves: leave.remainingDays,
    })

    employeeData.employeeDetails.totalLeavesTaken += leave.usedDays ?? 0
  }

  return Array.from(employeeMap.values())
}

/* =========================================================
   EMPLOYEE ATTENDANCE SUMMARY
========================================================= */

export const getEmployeeAttendanceSummary = async (
  tenantId: number,
  companyId?: number,
  departmentId?: number,
  userId?: number
) => {
  const currentYear = new Date().getFullYear()

  const employeeIds = await getEmployeeIdsByUserId(tenantId, userId)

  if (userId !== undefined && employeeIds?.length === 0) {
    return []
  }

  const yearStart = new Date(`${currentYear}-01-01`)
  const yearEnd = new Date(`${currentYear}-12-31`)

  const conditions = [
    eq(attendanceDaily.tenantId, tenantId),
    gte(attendanceDaily.attendanceDate, yearStart),
    lte(attendanceDaily.attendanceDate, yearEnd),
  ]

  // Apply all filters
  addCompanyFilter(conditions, companyId)
  addDepartmentFilter(conditions, departmentId)

  // Apply employee filter - use inArray on attendanceDaily
  if (employeeIds !== undefined && employeeIds.length > 0) {
    conditions.push(inArray(attendanceDaily.employeeId, employeeIds))
  }

  const attendances = await db
    .select({
      employeeId: employeeModel.employeeId,
      empCode: employeeModel.empCode,
      empFullName: employeeModel.empFullName,
      designationName: designationModel.designationName,
      departmentName: departmentModel.departmentName,

      attendanceDate: attendanceDaily.attendanceDate,
      status: attendanceDaily.status,
      lateMinutes: attendanceDaily.lateMinutes,
      earlyOutMinutes: attendanceDaily.earlyOutMinutes,
    })
    .from(attendanceDaily)
    .leftJoin(
      employeeModel,
      eq(attendanceDaily.employeeId, employeeModel.employeeId)
    )
    .leftJoin(
      designationModel,
      eq(employeeModel.designationId, designationModel.designationId)
    )
    .leftJoin(
      departmentModel,
      eq(employeeModel.departmentId, departmentModel.departmentId)
    )
    .where(and(...conditions))

  const employeeMap = new Map<number, EmployeeAttendanceMapValue>()

  for (const att of attendances) {
    const employeeId = att.employeeId

    if (employeeId === null || employeeId === undefined) {
      continue
    }

    if (!employeeMap.has(employeeId)) {
      employeeMap.set(employeeId, {
        employeeDetails: {
          employeeId,
          empCode: att.empCode,
          empFullName: att.empFullName,
          designationName: att.designationName,
          departmentName: att.departmentName,
          totalAbsent: 0,
          totalLateInMinutes: 0,
          totalEarlyOutMinutes: 0,
        },
        attendanceDetails: [],
      })
    }

    const employeeData = employeeMap.get(employeeId)!

    if (att.status === 'ABSENT') {
      employeeData.employeeDetails.totalAbsent += 1
    }

    employeeData.employeeDetails.totalLateInMinutes += att.lateMinutes ?? 0

    employeeData.employeeDetails.totalEarlyOutMinutes +=
      att.earlyOutMinutes ?? 0

    employeeData.attendanceDetails.push({
      attendanceDate: att.attendanceDate,
      isAbsent: att.status === 'ABSENT' ? 1 : 0,
      lateInMinutes: att.lateMinutes,
      earlyOutMinutes: att.earlyOutMinutes,
    })
  }

  return Array.from(employeeMap.values())
}

/* =========================================================
   SALARY STATUS
========================================================= */

export const getSalaryStatus = async (
  tenantId: number,
  companyId?: number,
  departmentId?: number,
  userId?: number
) => {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ] as const

  const currentYear = new Date().getFullYear()

  const employeeIds = await getEmployeeIdsByUserId(tenantId, userId)

  if (userId !== undefined && employeeIds?.length === 0) {
    return monthNames.map((month, index) => ({
      id: index + 1,
      month,
      year: currentYear,
      totalPaidAmount: 0,
      totalUnpaidAmount: 0,
      grossPayroll: 0,
      netPayroll: 0,
      isDataAvailable: false,
    }))
  }

  const monthOrder = sql`
    CASE ${salaryModel.salaryMonth}
      WHEN 'January' THEN 1
      WHEN 'February' THEN 2
      WHEN 'March' THEN 3
      WHEN 'April' THEN 4
      WHEN 'May' THEN 5
      WHEN 'June' THEN 6
      WHEN 'July' THEN 7
      WHEN 'August' THEN 8
      WHEN 'September' THEN 9
      WHEN 'October' THEN 10
      WHEN 'November' THEN 11
      WHEN 'December' THEN 12
    END
  `

  const conditions = [
    eq(salaryModel.tenantId, tenantId),
    eq(salaryModel.salaryYear, currentYear),
  ]

  // Apply all filters
  addCompanyFilter(conditions, companyId)
  addDepartmentFilter(conditions, departmentId)

  // Apply employee filter - use inArray on salaryModel
  if (employeeIds !== undefined && employeeIds.length > 0) {
    conditions.push(inArray(salaryModel.employeeId, employeeIds))
  }

  const results = await db
    .select({
      salaryMonth: salaryModel.salaryMonth,
      salaryYear: salaryModel.salaryYear,

      grossPayroll: sql<number>`
        COALESCE(SUM(${salaryModel.grossSalary}), 0)
      `,

      netPayroll: sql<number>`
        COALESCE(SUM(${salaryModel.netSalary}), 0)
      `,

      totalPaidAmount: sql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${salaryModel.isSalaryGiven} = true
              THEN ${salaryModel.netSalary}
              ELSE 0
            END
          ),
          0
        )
      `,

      totalUnpaidAmount: sql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${salaryModel.isSalaryGiven} = false
              THEN ${salaryModel.netSalary}
              ELSE 0
            END
          ),
          0
        )
      `,
    })
    .from(salaryModel)
    .leftJoin(
      employeeModel,
      eq(salaryModel.employeeId, employeeModel.employeeId)
    )
    .where(and(...conditions))
    .groupBy(salaryModel.salaryMonth, salaryModel.salaryYear)
    .orderBy(monthOrder)

  const monthDataMap = new Map<
    string,
    {
      month: string
      year: number | null
      totalPaidAmount: number
      totalUnpaidAmount: number
      grossPayroll: number
      netPayroll: number
    }
  >()

  results.forEach((result) => {
    monthDataMap.set(result.salaryMonth, {
      month: result.salaryMonth,
      year: result.salaryYear,
      totalPaidAmount: Number(result.totalPaidAmount),
      totalUnpaidAmount: Number(result.totalUnpaidAmount),
      grossPayroll: Number(result.grossPayroll),
      netPayroll: Number(result.netPayroll),
    })
  })

  return monthNames.map((month, index) => {
    const existingData = monthDataMap.get(month)

    return {
      id: index + 1,
      month,
      year: currentYear,
      totalPaidAmount: existingData?.totalPaidAmount ?? 0,
      totalUnpaidAmount: existingData?.totalUnpaidAmount ?? 0,
      grossPayroll: existingData?.grossPayroll ?? 0,
      netPayroll: existingData?.netPayroll ?? 0,
      isDataAvailable: !!existingData,
    }
  })
}

/* =========================================================
   EMPLOYEE LOAN SUMMARY
========================================================= */

export const getEmployeeLoneSummary = async (
  tenantId: number,
  companyId?: number,
  departmentId?: number,
  userId?: number
) => {
  const currentYear = new Date().getFullYear()

  const employeeIds = await getEmployeeIdsByUserId(tenantId, userId)

  if (userId !== undefined && employeeIds?.length === 0) {
    return []
  }

  const loanConditions = [eq(employeeLoneModel.tenantId, tenantId)]

  // Apply all filters
  addCompanyFilter(loanConditions, companyId)
  addDepartmentFilter(loanConditions, departmentId)

  // Apply employee filter - use inArray on employeeLoneModel
  if (employeeIds !== undefined && employeeIds.length > 0) {
    loanConditions.push(inArray(employeeLoneModel.employeeId, employeeIds))
  }

  const loans = await db
    .select({
      employeeId: employeeModel.employeeId,
      empCode: employeeModel.empCode,
      empFullName: employeeModel.empFullName,
      designationName: designationModel.designationName,
      departmentName: departmentModel.departmentName,

      employeeLoneId: employeeLoneModel.employeeLoneId,
      totalLoanAmount: employeeLoneModel.amount,
      loneDate: employeeLoneModel.loneDate,

      installmentId: employeeLoneInstallemntsModel.employeeLoneInstallmentId,
      installmentAmount: employeeLoneInstallemntsModel.amount,
      installmentYear: employeeLoneInstallemntsModel.loneInstallmentYear,
      isSkipped: employeeLoneInstallemntsModel.isSkipped,
      isPaid: employeeLoneInstallemntsModel.isPaid,
    })
    .from(employeeLoneModel)
    .leftJoin(
      employeeLoneInstallemntsModel,
      eq(
        employeeLoneModel.employeeLoneId,
        employeeLoneInstallemntsModel.employeeLoneId
      )
    )
    .leftJoin(
      employeeModel,
      eq(employeeLoneModel.employeeId, employeeModel.employeeId)
    )
    .leftJoin(
      designationModel,
      eq(employeeModel.designationId, designationModel.designationId)
    )
    .leftJoin(
      departmentModel,
      eq(employeeModel.departmentId, departmentModel.departmentId)
    )
    .where(and(...loanConditions))

  const employeeMap = new Map<number, EmployeeLoanMapValue>()

  for (const loan of loans) {
    const employeeId = loan.employeeId

    if (employeeId === null || employeeId === undefined) {
      continue
    }

    // Check if loan date exists before creating Date object
    if (!loan.loneDate) {
      continue
    }

    const loanYear = new Date(loan.loneDate).getFullYear()

    if (loanYear !== currentYear) {
      continue
    }

    if (!employeeMap.has(employeeId)) {
      employeeMap.set(employeeId, {
        employeeId,
        empCode: loan.empCode,
        empFullName: loan.empFullName,
        designationName: loan.designationName,
        departmentName: loan.departmentName,
        totalLoanAmount: 0,
        totalPaid: 0,
        totalRemaining: 0,
        totalInstallments: 0,
        paidInstallments: 0,
        pendingInstallments: 0,
        skippedInstallments: 0,
        _processedLoans: new Set<number>(),
      })
    }

    const employeeData = employeeMap.get(employeeId)!

    // Check if employeeLoneId exists before using it
    if (loan.employeeLoneId !== null && loan.employeeLoneId !== undefined) {
      if (!employeeData._processedLoans.has(loan.employeeLoneId)) {
        employeeData._processedLoans.add(loan.employeeLoneId)

        employeeData.totalLoanAmount += Number(loan.totalLoanAmount) || 0
      }
    }

    if (loan.installmentId !== null && loan.installmentId !== undefined) {
      employeeData.totalInstallments += 1

      if (loan.isSkipped) {
        employeeData.skippedInstallments += 1
      } else if (loan.isPaid) {
        employeeData.totalPaid += Number(loan.installmentAmount) || 0

        employeeData.paidInstallments += 1
      } else {
        employeeData.pendingInstallments += 1
      }
    }
  }

  const result = Array.from(employeeMap.values()).map((employee) => {
    employee.totalRemaining = employee.totalLoanAmount - employee.totalPaid

    // Remove the internal processing set
    const { _processedLoans, ...cleanEmployee } = employee

    return cleanEmployee
  })

  return result
}

/* =========================================================
   LATE & EARLY OUT SUMMARY
========================================================= */

export const getEmployeeLateAndEarlyOutSummary = async (
  tenantId: number,
  companyId?: number,
  departmentId?: number,
  userId?: number
) => {
  const currentYear = new Date().getFullYear()

  const employeeIds = await getEmployeeIdsByUserId(tenantId, userId)

  if (userId !== undefined && employeeIds?.length === 0) {
    return []
  }

  const yearStart = new Date(`${currentYear}-01-01`)
  const yearEnd = new Date(`${currentYear}-12-31`)

  const conditions = [
    eq(attendanceDaily.tenantId, tenantId),
    gte(attendanceDaily.attendanceDate, yearStart),
    lte(attendanceDaily.attendanceDate, yearEnd),

    // Only get records where late OR early-out exists
    or(
      gt(attendanceDaily.lateMinutes, 0),
      gt(attendanceDaily.earlyOutMinutes, 0)
    ),
  ]

  // Apply all filters
  addCompanyFilter(conditions, companyId)
  addDepartmentFilter(conditions, departmentId)

  // Apply employee filter - use inArray on attendanceDaily
  if (employeeIds !== undefined && employeeIds.length > 0) {
    conditions.push(inArray(attendanceDaily.employeeId, employeeIds))
  }

  const attendances = await db
    .select({
      employeeId: employeeModel.employeeId,
      empCode: employeeModel.empCode,
      empFullName: employeeModel.empFullName,
      designationName: designationModel.designationName,
      departmentName: departmentModel.departmentName,

      attendanceDate: attendanceDaily.attendanceDate,
      status: attendanceDaily.status,
      lateMinutes: attendanceDaily.lateMinutes,
      earlyOutMinutes: attendanceDaily.earlyOutMinutes,
    })
    .from(attendanceDaily)
    .leftJoin(
      employeeModel,
      eq(attendanceDaily.employeeId, employeeModel.employeeId)
    )
    .leftJoin(
      designationModel,
      eq(employeeModel.designationId, designationModel.designationId)
    )
    .leftJoin(
      departmentModel,
      eq(employeeModel.departmentId, departmentModel.departmentId)
    )
    .where(and(...conditions))

  const employeeMap = new Map<number, EmployeeLateEarlyOutMapValue>()

  for (const att of attendances) {
    const employeeId = att.employeeId

    if (employeeId === null || employeeId === undefined) {
      continue
    }

    if (!employeeMap.has(employeeId)) {
      employeeMap.set(employeeId, {
        employeeDetails: {
          employeeId,
          empCode: att.empCode,
          empFullName: att.empFullName,
          designationName: att.designationName,
          departmentName: att.departmentName,
          totalLateInMinutes: 0,
          totalEarlyOutMinutes: 0,
          lateInOccurrences: 0,
          earlyOutOccurrences: 0,
        },
        attendanceDetails: [],
      })
    }

    const employeeData = employeeMap.get(employeeId)!

    const lateMinutes = att.lateMinutes ?? 0
    const earlyOutMinutes = att.earlyOutMinutes ?? 0

    employeeData.employeeDetails.totalLateInMinutes += lateMinutes

    employeeData.employeeDetails.totalEarlyOutMinutes += earlyOutMinutes

    if (lateMinutes > 0) {
      employeeData.employeeDetails.lateInOccurrences += 1
    }

    if (earlyOutMinutes > 0) {
      employeeData.employeeDetails.earlyOutOccurrences += 1
    }

    employeeData.attendanceDetails.push({
      attendanceDate: att.attendanceDate,
      status: att.status,
      lateInMinutes: lateMinutes,
      earlyOutMinutes: earlyOutMinutes,
    })
  }

  return Array.from(employeeMap.values())
}

/* =========================================================
   EMPLOYEE HEAD COUNT SUMMARY
========================================================= */

export const getEmployeeHeadCountSummary = async (
  tenantId: number,
  companyId?: number,
  departmentId?: number,
  userId?: number
) => {
  const currentYear = new Date().getFullYear()

  const employeeIds = await getEmployeeIdsByUserId(tenantId, userId)

  /*
   * If userId is provided but no employee is linked
   * to that user, every month's employeeCount is 0.
   */
  if (userId !== undefined && employeeIds?.length === 0) {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ] as const

    return monthNames.map((month) => ({
      month,
      year: currentYear,
      employeeCount: 0,
      percentageChange: null,
      changeType: 'INITIAL' as const,
    }))
  }

  const yearEnd = new Date(`${currentYear}-12-31`)

  const conditions = [
    eq(employeeModel.tenantId, tenantId),
    lte(employeeModel.doj, yearEnd),
  ]

  // Apply all filters
  addCompanyFilter(conditions, companyId)
  addDepartmentFilter(conditions, departmentId)

  // Apply employee filter - use inArray on employeeModel
  if (employeeIds !== undefined && employeeIds.length > 0) {
    conditions.push(inArray(employeeModel.employeeId, employeeIds))
  }

  const employees = await db
    .select({
      employeeId: employeeModel.employeeId,
      doj: employeeModel.doj,
    })
    .from(employeeModel)
    .where(and(...conditions))

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ] as const

  const monthlyData = monthNames.map((month, index) => {
    // Last day of this month
    const monthEnd = new Date(currentYear, index + 1, 0)

    const employeeCount = employees.filter((employee) => {
      if (!employee.doj) {
        return false
      }

      const doj = new Date(employee.doj)

      return doj <= monthEnd
    }).length

    return {
      month,
      year: currentYear,
      employeeCount,
    }
  })

  const result = monthlyData.map((current, index) => {
    // January has no previous month to compare against
    if (index === 0) {
      return {
        ...current,
        percentageChange: null,
        changeType: 'INITIAL' as const,
      }
    }

    const previous = monthlyData[index - 1]

    let percentageChange = 0

    if (previous.employeeCount === 0) {
      percentageChange = current.employeeCount > 0 ? 100 : 0
    } else {
      percentageChange =
        ((current.employeeCount - previous.employeeCount) /
          previous.employeeCount) *
        100
    }

    percentageChange = Number(percentageChange.toFixed(2))

    let changeType: 'INCREASE' | 'DECREASE' | 'NO_CHANGE'

    if (percentageChange > 0) {
      changeType = 'INCREASE'
    } else if (percentageChange < 0) {
      changeType = 'DECREASE'
    } else {
      changeType = 'NO_CHANGE'
    }

    return {
      ...current,
      percentageChange,
      changeType,
    }
  })

  return result
}

export const getEmployeeDepartmentHeadStatus = async (
  tenantId: number,
  userId: number
) => {
  // Find the employee belonging to this user
  const employee = await db
    .select({
      employeeId: employeeModel.employeeId,
    })
    .from(employeeModel)
    .where(
      and(
        eq(employeeModel.userId, userId),
        eq(employeeModel.tenantId, tenantId)
      )
    )
    .limit(1)

  // User does not have an employee record
  if (employee.length === 0) {
    return {
      deptHead: false,
      departmentId: null,
    }
  }

  const employeeId = employee[0].employeeId

  // Check whether this employee is the head of any department
  const department = await db
    .select({
      departmentId: departmentModel.departmentId,
    })
    .from(departmentModel)
    .where(
      and(
        eq(departmentModel.headEmployeeId, employeeId),
        eq(departmentModel.tenantId, tenantId)
      )
    )
    .limit(1)

  // Employee is not a department head
  if (department.length === 0) {
    return {
      deptHead: false,
      departmentId: null,
    }
  }

  // Employee is a department head
  return {
    deptHead: true,
    departmentId: department[0].departmentId,
  }
}
