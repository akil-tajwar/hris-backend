import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { db } from '../config/database'
import {
  attendanceDaily,
  departmentModel,
  designationModel,
  employeeAttendanceModel,
  employeeLeaveBalanceModel,
  employeeLoneInstallemntsModel,
  employeeLoneModel,
  employeeModel,
  leavePolicyDetailsModel,
  leaveTypeModel,
  salaryModel,
} from '../schemas'

export const getEmployeeLeaveSummary = async (tenantId?: number) => {
  const currentYear = new Date().getFullYear()

  // Build where conditions
  const conditions = [eq(employeeLeaveBalanceModel.year, currentYear)]

  if (tenantId) {
    conditions.push(eq(employeeLeaveBalanceModel.tenantId, tenantId))
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

  // Group by employee
  const employeeMap = new Map()

  for (const leave of leaveBalances) {
    const employeeId = leave.employeeId

    if (employeeId !== null && !employeeMap.has(employeeId)) {
      employeeMap.set(employeeId, {
        employeeDetails: {
          employeeId: leave.employeeId,
          empCode: leave.empCode,
          empFullName: leave.empFullName,
          designationName: leave.designationName,
          departmentName: leave.departmentName,
          totalLeavesTaken: 0,
        },
        leaveDetails: [],
      })
    }

    const employeeData = employeeMap.get(employeeId)

    // Add leave type details
    employeeData.leaveDetails.push({
      leaveTypeId: leave.leaveTypeId,
      leaveTypeName: leave.leaveTypeName,
      totalLeaves: leave.earnedDays,
      takenLeaves: leave.usedDays,
      remainingLeaves: leave.remainingDays,
    })

    // Accumulate total leaves taken across all leave types
    employeeData.employeeDetails.totalLeavesTaken += leave.usedDays ?? 0
  }

  return Array.from(employeeMap.values())
}

export const getEmployeeAttendanceSummary = async (tenantId?: number) => {
  const currentYear = new Date().getFullYear()

  // Calculate date range
  const yearStart = new Date(`${currentYear}-01-01`)
  const yearEnd = new Date(`${currentYear}-12-31`)

  // Build where conditions
  const conditions = [
    gte(attendanceDaily.attendanceDate, yearStart),
    lte(attendanceDaily.attendanceDate, yearEnd),
  ]

  if (tenantId) {
    conditions.push(eq(attendanceDaily.tenantId, tenantId))
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

  // Group by employee
  const employeeMap = new Map()

  for (const att of attendances) {
    const employeeId = att.employeeId

    if (employeeId !== null && !employeeMap.has(employeeId)) {
      employeeMap.set(employeeId, {
        employeeDetails: {
          employeeId: att.employeeId,
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

    const employeeData = employeeMap.get(employeeId)

    // Count ABSENT status
    if (att.status === 'ABSENT') {
      employeeData.employeeDetails.totalAbsent += 1
    }

    // Accumulate minutes
    employeeData.employeeDetails.totalLateInMinutes += att.lateMinutes ?? 0
    employeeData.employeeDetails.totalEarlyOutMinutes +=
      att.earlyOutMinutes ?? 0

    // Push daily record
    employeeData.attendanceDetails.push({
      attendanceDate: att.attendanceDate,
      isAbsent: att.status === 'ABSENT' ? 1 : 0,
      lateInMinutes: att.lateMinutes,
      earlyOutMinutes: att.earlyOutMinutes,
    })
  }

  return Array.from(employeeMap.values())
}

export const getSalaryStatus = async (tenantId: number) => {
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

  // Create a CASE expression for ordering
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

  const results = await db
    .select({
      salaryMonth: salaryModel.salaryMonth,
      salaryYear: salaryModel.salaryYear,
      grossPayroll: sql<number>`COALESCE(SUM(${salaryModel.grossSalary}), 0)`,
      netPayroll: sql<number>`COALESCE(SUM(${salaryModel.netSalary}), 0)`,
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
    .where(
      and(
        eq(salaryModel.tenantId, tenantId),
        eq(salaryModel.salaryYear, currentYear)
      )
    )
    .groupBy(salaryModel.salaryMonth, salaryModel.salaryYear)
    .orderBy(monthOrder)

  // Create a map of existing months with data
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

  // Create array with all months of the year
  const allMonthsData = monthNames.map((month, index) => {
    const existingData = monthDataMap.get(month)
    
    return {
      id: index + 1,
      month: month,
      year: currentYear,
      totalPaidAmount: existingData?.totalPaidAmount ?? 0,
      totalUnpaidAmount: existingData?.totalUnpaidAmount ?? 0,
      grossPayroll: existingData?.grossPayroll ?? 0,
      netPayroll: existingData?.netPayroll ?? 0,
      isDataAvailable: !!existingData,
    }
  })

  return allMonthsData
}

export const getEmployeeLoneSummary = async (tenantId?: number) => {
  const currentYear = new Date().getFullYear()

  const loanConditions = []

  if (tenantId) {
    loanConditions.push(eq(employeeLoneModel.tenantId, tenantId))
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
    .where(loanConditions.length ? and(...loanConditions) : undefined)

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

    // Skip if employeeId is null
    if (employeeId === null) {
      continue
    }

    // Loan belongs to the year it was created
    const loanYear = new Date(loan.loneDate).getFullYear()

    if (loanYear !== currentYear) {
      continue
    }

    if (!employeeMap.has(employeeId)) {
      employeeMap.set(employeeId, {
        employeeId: loan.employeeId!,
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

    // Count loan amount once per loan
    if (!employeeData._processedLoans.has(loan.employeeLoneId)) {
      employeeData._processedLoans.add(loan.employeeLoneId)
      employeeData.totalLoanAmount += Number(loan.totalLoanAmount)
    }

    // Count every installment of that loan, regardless of installment year
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
