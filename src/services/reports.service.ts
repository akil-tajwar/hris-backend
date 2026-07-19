import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from 'drizzle-orm'
import { db } from '../config/database'
import {
  companyModel,
  departmentModel,
  designationModel,
  divisionModel,
  employeeAttendanceModel,
  employeeLifecycleEventsModel,
  employeeModel,
  employeeSalaryDetailsModel,
  employmentTypeModel,
  salaryComponentsModel,
  salaryModel,
  attendanceDaily,
  employeeLeaveBalanceModel,
  leaveTypeModel,
  employeeLeaveApplyModel,
  employeeLeaveAssignmentModel,
  shiftModel,
  employeeShiftAllocations,
} from '../schemas'

export const employeeActivitiesReport = async (
  employeeId: number,
  tenantId: number
) => {
  // Employee Details
  const [employeeDetails] = await db
    .select({
      employeeId: employeeModel.employeeId,
      empCode: employeeModel.empCode,
      empFullName: employeeModel.empFullName,
      empShortName: employeeModel.empShortName,

      dob: employeeModel.dob,
      doj: employeeModel.doj,
      doc: employeeModel.doc,

      gender: employeeModel.gender,
      nationalIdNo: employeeModel.nationalIdNo,
      nationality: employeeModel.nationality,

      personalPhone: employeeModel.personalPhone,
      officialPhone: employeeModel.officialPhone,
      workEmail: employeeModel.workEmail,
      privateEmail: employeeModel.privateEmail,

      presentAddress: employeeModel.presentAddress,
      permanentAddress: employeeModel.permanentAddress,

      emergencyContactName: employeeModel.emergencyContactName,
      emergencyContactPhone: employeeModel.emergencyContactPhone,
      emergencyContactRelation: employeeModel.emergencyContactRelation,

      maritalStatus: employeeModel.maritalStatus,
      religion: employeeModel.religion,
      bloodGroup: employeeModel.bloodGroup,

      qualification: employeeModel.qualification,
      instituteName: employeeModel.instituteName,
      subjectName: employeeModel.subjectName,
      result: employeeModel.result,
      certificateUrl: employeeModel.certificateUrl,

      basicSalary: employeeModel.basicSalary,
      probationMonths: employeeModel.probationMonths,
      isActive: employeeModel.isActive,

      departmentId: departmentModel.departmentId,
      departmentName: departmentModel.departmentName,

      designationId: designationModel.designationId,
      designationName: designationModel.designationName,

      employmentTypeId: employmentTypeModel.employmentTypeId,
      employmentTypeName: employmentTypeModel.employmentTypeName,

      companyId: companyModel.companyId,
      companyName: companyModel.companyName,

      divisionId: divisionModel.divisionId,
      divisionName: divisionModel.divisionName,
    })
    .from(employeeModel)
    .leftJoin(
      designationModel,
      eq(employeeModel.designationId, designationModel.designationId)
    )
    .leftJoin(
      departmentModel,
      eq(employeeModel.departmentId, departmentModel.departmentId)
    )
    .leftJoin(
      employmentTypeModel,
      eq(employeeModel.employmentTypeId, employmentTypeModel.employmentTypeId)
    )
    .leftJoin(companyModel, eq(employeeModel.companyId, companyModel.companyId))
    .leftJoin(
      divisionModel,
      eq(employeeModel.divisionId, divisionModel.divisionId)
    )
    .where(
      and(
        eq(employeeModel.employeeId, employeeId),
        eq(employeeModel.tenantId, tenantId)
      )
    )
  // Employee History with performedBy and approvedBy names
  const employeeHistory = await db
    .select({
      employeeLifeCycleId: employeeLifecycleEventsModel.employeeLifeCycleId,
      eventDate: employeeLifecycleEventsModel.eventDate,
      employeeEventType: employeeLifecycleEventsModel.employeeEventType,
      effectiveFrom: employeeLifecycleEventsModel.effectiveFrom,
      remarks: employeeLifecycleEventsModel.remarks,

      performedBy: sql<string>`(SELECT username FROM users WHERE user_id = ${employeeLifecycleEventsModel.performedBy})`,
      approvedBy: sql<string>`(SELECT emp_full_name FROM employees WHERE employee_id = ${employeeLifecycleEventsModel.approvedBy})`,

      referenceType: employeeLifecycleEventsModel.referenceType,
      referenceId: employeeLifecycleEventsModel.referenceId,
      oldValue: employeeLifecycleEventsModel.oldValue,
      newValue: employeeLifecycleEventsModel.newValue,
      createdAt: employeeLifecycleEventsModel.createdAt,
    })
    .from(employeeLifecycleEventsModel)
    .where(
      and(
        eq(employeeLifecycleEventsModel.employeeId, employeeId),
        eq(employeeLifecycleEventsModel.tenantId, tenantId)
      )
    )
    .orderBy(desc(employeeLifecycleEventsModel.eventDate))

  return {
    employeeDetails,
    employeeHistory,
  }
}

export const employeeAttendanceReport = async (
  fromDate: string,
  toDate: string,
  tenantId: number
) => {
  return await db
    .select({
      employeeAttendanceId: employeeAttendanceModel.employeeAttendanceId,
      employeeId: employeeAttendanceModel.employeeId,
      empCode: employeeModel.empCode,
      employeeName: employeeModel.empFullName,
      designationId: employeeModel.designationId,
      designationName: designationModel.designationName,
      departmentId: employeeModel.departmentId,
      departmentName: departmentModel.departmentName,
      attendanceDate: employeeAttendanceModel.attendanceDate,
      inTime: employeeAttendanceModel.inTime,
      outTime: employeeAttendanceModel.outTime,
      lateInMinutes: employeeAttendanceModel.lateInMinutes,
      earlyOutMinutes: employeeAttendanceModel.earlyOutMinutes,
      isAbsent: employeeAttendanceModel.isAbsent,
      createdAt: employeeAttendanceModel.createdAt,
    })
    .from(employeeAttendanceModel)
    .leftJoin(
      employeeModel,
      eq(employeeAttendanceModel.employeeId, employeeModel.employeeId)
    )
    .leftJoin(
      designationModel,
      eq(employeeModel.designationId, designationModel.designationId)
    )
    .leftJoin(
      departmentModel,
      eq(employeeModel.departmentId, departmentModel.departmentId)
    )
    .where(
      and(
        eq(employeeAttendanceModel.tenantId, tenantId),
        gte(employeeAttendanceModel.attendanceDate, new Date(fromDate)),
        lte(employeeAttendanceModel.attendanceDate, new Date(toDate))
      )
    )
    .orderBy(
      employeeAttendanceModel.attendanceDate,
      employeeAttendanceModel.employeeId
    )
}

// Define the month type based on your enum
type SalaryMonth =
  | 'January'
  | 'February'
  | 'March'
  | 'April'
  | 'May'
  | 'June'
  | 'July'
  | 'August'
  | 'September'
  | 'October'
  | 'November'
  | 'December'

export const salaryReport = async (
  salaryMonth: SalaryMonth,
  salaryYear: number,
  tenantId: number
) => {
  // Get main salary data with employee, department, and designation details
  const salaryData = await db
    .select({
      salaryId: salaryModel.salaryId,
      salaryMonth: salaryModel.salaryMonth,
      salaryYear: salaryModel.salaryYear,
      basicSalary: salaryModel.basicSalary,
      grossSalary: salaryModel.grossSalary,
      netSalary: salaryModel.netSalary,
      doj: salaryModel.doj,
      employeeId: salaryModel.employeeId,
      empCode: employeeModel.empCode,
      employeeName: employeeModel.empFullName,
      departmentId: salaryModel.departmentId,
      departmentName: departmentModel.departmentName,
      designationId: salaryModel.designationId,
      designationName: designationModel.designationName,
      createdBy: salaryModel.createdBy,
      createdAt: salaryModel.createdAt,
      updatedBy: salaryModel.updatedBy,
      updatedAt: salaryModel.updatedAt,
    })
    .from(salaryModel)
    .innerJoin(
      employeeModel,
      eq(salaryModel.employeeId, employeeModel.employeeId)
    )
    .innerJoin(
      departmentModel,
      eq(salaryModel.departmentId, departmentModel.departmentId)
    )
    .innerJoin(
      designationModel,
      eq(salaryModel.designationId, designationModel.designationId)
    )
    .where(
      and(
        eq(salaryModel.tenantId, tenantId),
        eq(salaryModel.salaryMonth, salaryMonth),
        eq(salaryModel.salaryYear, salaryYear)
      )
    )
    .orderBy(salaryModel.employeeId)

  if (salaryData.length === 0) {
    return null
  }

  // Get all other salary components for the employees in this salary period
  const employeeIds = salaryData.map((s) => s.employeeId)

  const salaryComponents = await db
    .select({
      employeeSalaryDetailsId:
        employeeSalaryDetailsModel.employeeSalaryDetailsId,
      employeeId: employeeSalaryDetailsModel.employeeId,
      empCode: employeeModel.empCode,
      employeeName: employeeModel.empFullName,
      salaryStructureDetailId: employeeSalaryDetailsModel.salaryStructureDetailId,
      componentName: salaryComponentsModel.componentName,
      componentType: salaryComponentsModel.componentType,
      amount: employeeSalaryDetailsModel.amount,
      salaryMonth: employeeSalaryDetailsModel.salaryMonth,
      salaryYear: employeeSalaryDetailsModel.salaryYear,
      createdBy: employeeSalaryDetailsModel.createdBy,
      createdAt: employeeSalaryDetailsModel.createdAt,
      updatedBy: employeeSalaryDetailsModel.updatedBy,
      updatedAt: employeeSalaryDetailsModel.updatedAt,
    })
    .from(employeeSalaryDetailsModel)
    .innerJoin(
      salaryComponentsModel,
      eq(
        employeeSalaryDetailsModel.salaryStructureDetailId,
        salaryComponentsModel.salaryComponentId
      )
    )
    .innerJoin(
      employeeModel,
      eq(employeeSalaryDetailsModel.employeeId, employeeModel.employeeId)
    )
    .where(
      and(
        inArray(employeeSalaryDetailsModel.employeeId, employeeIds),
        eq(employeeSalaryDetailsModel.salaryMonth, salaryMonth),
        eq(employeeSalaryDetailsModel.salaryYear, salaryYear)
      )
    )
    .orderBy(
      employeeSalaryDetailsModel.employeeId,
      salaryComponentsModel.componentType,
      salaryComponentsModel.componentName
    )

  // Transform salary data to match the schema
  const transformedSalary = salaryData.map((salary) => ({
    salaryMonth: salary.salaryMonth,
    salaryYear: salary.salaryYear,
    employeeId: salary.employeeId,
    empCode: salary.empCode,
    employeeName: salary.employeeName,
    departmentId: salary.departmentId,
    departmentName: salary.departmentName,
    designationId: salary.designationId,
    designationName: salary.designationName,
    basicSalary: salary.basicSalary,
    grossSalary: salary.grossSalary,
    netSalary: salary.netSalary,
    doj: salary.doj,
    createdBy: salary.createdBy,
    createdAt: salary.createdAt,
    updatedBy: salary.updatedBy,
    updatedAt: salary.updatedAt,
  }))

  // Transform other salary components
  const transformedOtherSalary = salaryComponents.map((component) => ({
    employeeId: component.employeeId,
    empCode: component.empCode,
    employeeName: component.employeeName,
    salaryStructureDetailId: component.salaryStructureDetailId,
    componentName: component.componentName,
    componentType: component.componentType as 'Allowance' | 'Deduction',
    salaryMonth: component.salaryMonth,
    salaryYear: component.salaryYear,
    amount: component.amount,
    createdBy: component.createdBy,
    createdAt: component.createdAt,
    updatedBy: component.updatedBy,
    updatedAt: component.updatedAt,
  }))

  // Return in the format expected by the schema
  return {
    salary:
      transformedSalary.length === 1 ? transformedSalary[0] : transformedSalary,
    otherSalary: transformedOtherSalary,
  }
}

// ─── Report 1: Daily Attendance ───────────────────────────────
export const dailyAttendanceReport = async (date: string, tenantId: number) => {
  return await db
    .select({
      employeeId: employeeModel.employeeId,
      empCode: employeeModel.empCode,
      employeeName: employeeModel.empFullName,
      departmentName: departmentModel.departmentName,
      designationName: designationModel.designationName,
      attendanceDate: attendanceDaily.attendanceDate,
      firstIn: attendanceDaily.firstIn,
      lastOut: attendanceDaily.lastOut,
      workedMinutes: attendanceDaily.workedMinutes,
      lateMinutes: attendanceDaily.lateMinutes,
      earlyOutMinutes: attendanceDaily.earlyOutMinutes,
      overtimeMinutes: attendanceDaily.overtimeMinutes,
      status: attendanceDaily.status, // PRESENT / ABSENT / LATE / HALF_DAY
    })
    .from(attendanceDaily)
    .leftJoin(
      employeeModel,
      eq(attendanceDaily.employeeId, employeeModel.employeeId)
    )
    .leftJoin(
      departmentModel,
      eq(employeeModel.departmentId, departmentModel.departmentId)
    )
    .leftJoin(
      designationModel,
      eq(employeeModel.designationId, designationModel.designationId)
    )
    .where(
      and(
        sql`DATE(${attendanceDaily.attendanceDate}) = ${date}`,
        eq(attendanceDaily.tenantId, tenantId)
      )
    )
    .orderBy(employeeModel.empCode)
}

// ─── Report 2: Attendance Summary (Date Range) ────────────────
export const attendanceSummaryReport = async (
  fromDate: string,
  toDate: string,
  tenantId: number
) => {
  const rows = await db
    .select({
      attendanceDate: attendanceDaily.attendanceDate,
      status: attendanceDaily.status,
    })
    .from(attendanceDaily)
    .where(
      and(
        sql`DATE(${attendanceDaily.attendanceDate}) BETWEEN ${fromDate} AND ${toDate}`,
        eq(attendanceDaily.tenantId, tenantId)
      )
    )

  // Date অনুযায়ী group করো
  const summaryMap = new Map<
    string,
    { present: number; absent: number; late: number; halfDay: number }
  >()

  for (const row of rows) {
    const dateKey = (row.attendanceDate as Date).toISOString().split('T')[0]
    if (!summaryMap.has(dateKey)) {
      summaryMap.set(dateKey, { present: 0, absent: 0, late: 0, halfDay: 0 })
    }
    const entry = summaryMap.get(dateKey)!
    const s = row.status?.toUpperCase()
    if (s === 'PRESENT') entry.present++
    else if (s === 'ABSENT') entry.absent++
    else if (s === 'LATE') entry.late++
    else if (s === 'HALF_DAY') entry.halfDay++
  }

  return Array.from(summaryMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date,
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
      halfDay: counts.halfDay,
      total: counts.present + counts.absent + counts.late + counts.halfDay,
    }))
}

// leave balance summary report
export const getLeaveBalanceSummaryReport = async (tenantId: number) => {
  try {
    const result = await db
      .select({
        employeeLeaveBalanceId:
          employeeLeaveBalanceModel.employeeLeaveBalanceId,

        employeeId: employeeModel.employeeId,
        empFullName: employeeModel.empFullName,
        empCode: employeeModel.empCode,

        designationName: designationModel.designationName,

        departmentName: departmentModel.departmentName,

        leaveTypeName: leaveTypeModel.name,

        usedDays: employeeLeaveBalanceModel.usedDays,

        remainingDays: employeeLeaveBalanceModel.remainingDays,
      })
      .from(employeeLeaveBalanceModel)
      .where(eq(employeeLeaveBalanceModel.tenantId, tenantId))
      .leftJoin(
        employeeModel,
        eq(employeeLeaveBalanceModel.employeeId, employeeModel.employeeId)
      )
      .leftJoin(
        leaveTypeModel,
        eq(employeeLeaveBalanceModel.leaveTypeId, leaveTypeModel.leaveTypeId)
      )
      .leftJoin(
        designationModel,
        eq(employeeModel.designationId, designationModel.designationId)
      )
      .leftJoin(
        departmentModel,
        eq(employeeModel.departmentId, departmentModel.departmentId)
      )

    // =========================
    // Group by employee
    // =========================
    const grouped = result.reduce((acc: any, row) => {
      if (!row.employeeId) {
        console.log('Skipping row with null employeeId:', row)
        return acc
      }

      const key = row.employeeId // now safe (number only)

      if (!acc[key]) {
        acc[key] = {
          employeeId: row.employeeId,
          empCode: row.empCode,
          empFullName: row.empFullName,
          empDesignation: row.designationName,
          empDepartment: row.departmentName,
          leaves: [],
        }
      }

      acc[key].leaves.push({
        leaveTypeName: row.leaveTypeName,
        usedDays: row.usedDays,
        remainingDays: row.remainingDays,
      })

      return acc
    }, {})

    return Object.values(grouped)
  } catch (error) {
    console.error('Error in Leave Balance Summary Report:', error)
    throw error
  }
}

export const leaveLedgerReport = async (tenantId: number) => {
  try {
    // =====================================================
    // 1. FETCH LEAVE BALANCES (BASE: ALL ASSIGNED EMPLOYEES)
    // =====================================================

    const balances = await db
      .select({
        employeeId: employeeModel.employeeId,
        empCode: employeeModel.empCode,
        empFullName: employeeModel.empFullName,

        leaveTypeId: leaveTypeModel.leaveTypeId,
        leaveTypeName: leaveTypeModel.name,

        earnedDays: employeeLeaveBalanceModel.earnedDays,
        usedDays: employeeLeaveBalanceModel.usedDays,
        remainingDays: employeeLeaveBalanceModel.remainingDays,

        year: employeeLeaveBalanceModel.year,

        assignmentEffectiveFrom: employeeLeaveAssignmentModel.effectiveFrom,
      })
      .from(employeeLeaveBalanceModel)
      .where(eq(employeeLeaveBalanceModel.tenantId, tenantId))
      .leftJoin(
        employeeModel,
        eq(employeeLeaveBalanceModel.employeeId, employeeModel.employeeId)
      )
      .leftJoin(
        leaveTypeModel,
        eq(employeeLeaveBalanceModel.leaveTypeId, leaveTypeModel.leaveTypeId)
      )
      .leftJoin(
        employeeLeaveAssignmentModel,
        eq(
          employeeLeaveBalanceModel.employeeLeaveAssignmentId,
          employeeLeaveAssignmentModel.employeeLeaveAssignmentId
        )
      )

    // =====================================================
    // 2. FETCH LEAVE APPLICATIONS (ALL EMPLOYEES)
    // =====================================================

    const leaveApplications = await db
      .select({
        leaveApplyId: employeeLeaveApplyModel.employeeLeaveApplyId,
        employeeId: employeeLeaveApplyModel.employeeId,
        leaveTypeId: employeeLeaveApplyModel.leaveTypeId,

        effectiveFrom: employeeLeaveApplyModel.effectiveFrom,
        effectiveTo: employeeLeaveApplyModel.effectiveTo,

        noOfDays: employeeLeaveApplyModel.noOfDays,
        status: employeeLeaveApplyModel.status,
      })
      .from(employeeLeaveApplyModel)
      .where(eq(employeeLeaveApplyModel.tenantId, tenantId))
      .orderBy(asc(employeeLeaveApplyModel.effectiveFrom))

    // =====================================================
    // 3. BUILD BASE LEDGER FROM ASSIGNMENTS
    // =====================================================

    const ledgerMap = new Map<string, any>()

    for (const b of balances) {
      const key = `${b.employeeId}-${b.leaveTypeId}`

      ledgerMap.set(key, {
        employeeId: b.employeeId,
        empCode: b.empCode,
        empFullName: b.empFullName,

        leaveTypeId: b.leaveTypeId,
        leaveTypeName: b.leaveTypeName,

        summary: {
          allocated: Number(b.earnedDays ?? 0),
          used: Number(b.usedDays ?? 0),
          available: Number(b.remainingDays ?? 0),
        },

        runningBalance: Number(b.earnedDays ?? 0),

        history: [],
      })
    }

    // =====================================================
    // 4. ADD ALLOCATION ENTRY
    // =====================================================

    for (const b of balances) {
      const key = `${b.employeeId}-${b.leaveTypeId}`

      const record = ledgerMap.get(key)
      if (!record) continue

      record.history.push({
        date: b.assignmentEffectiveFrom,
        event: 'Policy Assigned',
        days: Number(b.earnedDays ?? 0),
        balanceAfter: record.runningBalance,
      })
    }

    // =====================================================
    // 5. APPLY LEAVE TRANSACTIONS
    // =====================================================

    for (const leave of leaveApplications) {
      const key = `${leave.employeeId}-${leave.leaveTypeId}`

      const record = ledgerMap.get(key)

      // 🔥 IMPORTANT FIX:
      // if employee has balance but no leave applied yet -> skip safely
      if (!record) continue

      if (leave.status === 'Approved') {
        record.runningBalance -= Number(leave.noOfDays ?? 0)
      }

      record.history.push({
        leaveApplyId: leave.leaveApplyId,
        date: leave.effectiveFrom,

        event: 'Leave Application',

        status: leave.status,
        fromDate: leave.effectiveFrom,
        toDate: leave.effectiveTo,

        days: Number(leave.noOfDays ?? 0),

        balanceAfter: record.runningBalance,
      })
    }

    // =====================================================
    // 6. GROUP BY EMPLOYEE (IMPORTANT FIX INCLUDED)
    // =====================================================

    const employeeMap = new Map<number, any>()

    for (const record of ledgerMap.values()) {
      if (!employeeMap.has(record.employeeId)) {
        employeeMap.set(record.employeeId, {
          employeeId: record.employeeId,
          empCode: record.empCode,
          empFullName: record.empFullName,
          leaveLedgers: [],
        })
      }

      const emp = employeeMap.get(record.employeeId)

      emp.leaveLedgers.push({
        leaveTypeId: record.leaveTypeId,
        leaveTypeName: record.leaveTypeName,

        allocatedDays: record.summary.allocated,
        usedDays: record.summary.used,
        availableDays: record.summary.available,

        // FINAL BALANCE
        currentBalance: record.runningBalance,

        // 🔥 IMPORTANT: ALWAYS RETURN HISTORY (EMPTY IF NO LEAVE)
        history: record.history,
      })
    }

    // =====================================================
    // 7. RETURN RESULT
    // =====================================================

    return Array.from(employeeMap.values())
  } catch (error) {
    console.error('LEAVE LEDGER REPORT ERROR:', error)
    throw error
  }
}

export const shiftReport = async (reportDate: string, tenantId: number) => {
  const data = await db
    .select({
      employeeId: employeeModel.employeeId,
      empCode: employeeModel.empCode,
      employeeName: employeeModel.empFullName,

      shiftId: shiftModel.shiftId,
      shiftName: shiftModel.shiftName,
      shiftCode: shiftModel.shiftCode,
      shiftType: shiftModel.shiftType,

      startTime: shiftModel.startTime,
      endTime: shiftModel.endTime,
      breakMinutes: shiftModel.breakMinutes,
      expectedWorkHours: shiftModel.expectedWorkHours,
      minimumHoursForPresent: shiftModel.minimumHoursForPresent,

      crossDay: shiftModel.crossDay,
      isFlexible: shiftModel.isFlexible,
      flexibleInFrom: shiftModel.flexibleInFrom,
      flexibleInTo: shiftModel.flexibleInTo,

      effectiveFrom: employeeShiftAllocations.effectiveFrom,
      effectiveTo: employeeShiftAllocations.effectiveTo,
      remarks: employeeShiftAllocations.remarks,
      recurrenceType: employeeShiftAllocations.recurrenceType,
      recurrenceActive: employeeShiftAllocations.recurrenceActive,
    })
    .from(employeeShiftAllocations)
    .innerJoin(
      employeeModel,
      eq(employeeShiftAllocations.employeeId, employeeModel.employeeId)
    )
    .innerJoin(
      shiftModel,
      eq(employeeShiftAllocations.shiftId, shiftModel.shiftId)
    )
    .where(
      and(
        eq(employeeShiftAllocations.tenantId, tenantId),

        lte(employeeShiftAllocations.effectiveFrom, reportDate),

        or(
          isNull(employeeShiftAllocations.effectiveTo),
          gte(employeeShiftAllocations.effectiveTo, reportDate)
        )
      )
    )
    .orderBy(employeeModel.empCode)

  return data
}

export const getIndividualAttendanceSummary = async (
  tenantId: number,
  fromDate: string,
  toDate: string
) => {
  const from = new Date(String(fromDate))
  const to = new Date(String(toDate))
  return db
    .select({
      employeeId: attendanceDaily.employeeId,
      empCode: employeeModel.empCode,
      empFullName: employeeModel.empFullName,

      present: sql<number>`
        SUM(CASE WHEN ${attendanceDaily.status} = 'PRESENT' THEN 1 ELSE 0 END)
      `,

      late: sql<number>`
        SUM(CASE WHEN ${attendanceDaily.status} = 'LATE' THEN 1 ELSE 0 END)
      `,

      absent: sql<number>`
        SUM(CASE WHEN ${attendanceDaily.status} = 'ABSENT' THEN 1 ELSE 0 END)
      `,

      halfDay: sql<number>`
        SUM(CASE WHEN ${attendanceDaily.status} = 'HALF_DAY' THEN 1 ELSE 0 END)
      `,

      weekend: sql<number>`
        SUM(CASE WHEN ${attendanceDaily.status} = 'WEEKEND' THEN 1 ELSE 0 END)
      `,

      holiday: sql<number>`
        SUM(CASE WHEN ${attendanceDaily.status} = 'HOLIDAY' THEN 1 ELSE 0 END)
      `,

      onLeave: sql<number>`
        SUM(CASE WHEN ${attendanceDaily.status} = 'ON_LEAVE' THEN 1 ELSE 0 END)
      `,
    })
    .from(attendanceDaily)
    .leftJoin(
      employeeModel,
      eq(attendanceDaily.employeeId, employeeModel.employeeId)
    )
    .where(
      and(
        eq(attendanceDaily.tenantId, tenantId),
        gte(attendanceDaily.attendanceDate, from),
        lte(attendanceDaily.attendanceDate, to)
      )
    )
    .groupBy(
      attendanceDaily.employeeId,
      employeeModel.empCode,
      employeeModel.empFullName
    )
    .orderBy(employeeModel.empCode)
}
