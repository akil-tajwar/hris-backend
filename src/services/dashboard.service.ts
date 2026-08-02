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

  const now = new Date()

  const currentMonth = monthNames[now.getMonth()]
  const currentYear = now.getFullYear()

  const result = await db
    .select({
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
        eq(salaryModel.salaryMonth, currentMonth),
        eq(salaryModel.salaryYear, currentYear)
      )
    )

  return [
    {
      id: 1,
      currentMonth,
      currentYear,
      totalPaidAmount: Number(result[0].totalPaidAmount),
      totalUnpaidAmount: Number(result[0].totalUnpaidAmount),
      grossPayroll: Number(result[0].grossPayroll),
      netPayroll: Number(result[0].netPayroll),
    },
  ]
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

    if (!employeeMap.has(employeeId ?? 0)) {
      employeeMap.set(employeeId, {
        employeeId: loan.employeeId,
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

    // Loan belongs to the year it was created
    const loanYear = new Date(loan.loneDate).getFullYear()

    if (loanYear !== currentYear) {
      continue
    }

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
