import { eq, and, gte, lte, sql } from 'drizzle-orm'
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

/**
 * Get employeeId(s) from userId.
 *
 * userId === undefined
 *   -> return undefined, meaning all employees
 *
 * userId provided
 *   -> return the employeeId belonging to that user
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

  return employees
    .map((employee) => employee.employeeId)
    .filter((id): id is number => id !== null)
}

/* =========================================================
   EMPLOYEE LEAVE SUMMARY
========================================================= */

export const getEmployeeLeaveSummary = async (
  tenantId: number,
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

  if (employeeIds !== undefined) {
    conditions.push(eq(employeeLeaveBalanceModel.employeeId, employeeIds[0]))
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

  const employeeMap = new Map<
    number,
    {
      employeeDetails: {
        employeeId: number
        empCode: string | null
        empFullName: string | null
        designationName: string | null
        departmentName: string | null
        totalLeavesTaken: number
      }
      leaveDetails: {
        leaveTypeId: number | null
        leaveTypeName: string | null
        totalLeaves: number | null
        takenLeaves: number | null
        remainingLeaves: number | null
      }[]
    }
  >()

  for (const leave of leaveBalances) {
    const employeeId = leave.employeeId

    if (employeeId === null) {
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

  if (employeeIds !== undefined) {
    conditions.push(eq(attendanceDaily.employeeId, employeeIds[0]))
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

  const employeeMap = new Map<
    number,
    {
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
      attendanceDetails: {
        attendanceDate: Date
        isAbsent: number
        lateInMinutes: number | null
        earlyOutMinutes: number | null
      }[]
    }
  >()

  for (const att of attendances) {
    const employeeId = att.employeeId

    if (employeeId === null) {
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

export const getSalaryStatus = async (tenantId: number, userId?: number) => {
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

  if (employeeIds !== undefined) {
    conditions.push(eq(salaryModel.employeeId, employeeIds[0]))
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
    .where(and(...conditions))
    .groupBy(salaryModel.salaryMonth, salaryModel.salaryYear)
    .orderBy(monthOrder)

  const monthDataMap = new Map()

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
  userId?: number
) => {
  const currentYear = new Date().getFullYear()

  const employeeIds = await getEmployeeIdsByUserId(tenantId, userId)

  if (userId !== undefined && employeeIds?.length === 0) {
    return []
  }

  const loanConditions = [eq(employeeLoneModel.tenantId, tenantId)]

  if (employeeIds !== undefined) {
    loanConditions.push(eq(employeeLoneModel.employeeId, employeeIds[0]))
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

  const employeeMap = new Map<
    number,
    {
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
  >()

  for (const loan of loans) {
    const employeeId = loan.employeeId

    if (employeeId === null) {
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

    if (!employeeData._processedLoans.has(loan.employeeLoneId)) {
      employeeData._processedLoans.add(loan.employeeLoneId)

      employeeData.totalLoanAmount += Number(loan.totalLoanAmount)
    }

    if (loan.installmentId) {
      employeeData.totalInstallments += 1

      if (loan.isSkipped) {
        employeeData.skippedInstallments += 1
      } else if (loan.isPaid) {
        employeeData.totalPaid += Number(loan.installmentAmount)

        employeeData.paidInstallments += 1
      } else {
        employeeData.pendingInstallments += 1
      }
    }
  }

  const result = Array.from(employeeMap.values()).map((employee) => {
    employee.totalRemaining = employee.totalLoanAmount - employee.totalPaid

    delete (employee as any)._processedLoans

    return employee
  })

  return result
}

/* =========================================================
   LATE & EARLY OUT SUMMARY
========================================================= */

export const getEmployeeLateAndEarlyOutSummary = async (
  tenantId: number,
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

  if (employeeIds !== undefined) {
    conditions.push(eq(attendanceDaily.employeeId, employeeIds[0]))
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

  const employeeMap = new Map<
    number,
    {
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
      attendanceDetails: {
        attendanceDate: Date
        status: string
        lateInMinutes: number
        earlyOutMinutes: number
      }[]
    }
  >()

  for (const att of attendances) {
    const employeeId = att.employeeId

    if (employeeId === null) {
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

  if (employeeIds !== undefined) {
    conditions.push(eq(employeeModel.employeeId, employeeIds[0]))
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
