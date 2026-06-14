import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { db } from '../config/database'
import {
  companyModel,
  costCenterModel,
  departmentModel,
  designationModel,
  divisionModel,
  employeeAttendanceModel,
  employeeLifecycleEventsModel,
  employeeLoneModel,
  employeeModel,
  employeeSalaryComponentsModel,
  employmentTypeModel,
  salaryComponentsModel,
  salaryModel,
  workStationModel,
  attendanceDaily
} from '../schemas'

export const employeeActivitiesReport = async (employeeId: number) => {
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

      workStationId: workStationModel.workStationId,
      workStationName: workStationModel.workStationName,

      divisionId: divisionModel.divisionId,
      divisionName: divisionModel.divisionName,

      costCenterId: costCenterModel.costCenterId,
      costCenterName: costCenterModel.costCenterName,
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
      workStationModel,
      eq(employeeModel.workStationId, workStationModel.workStationId)
    )
    .leftJoin(
      divisionModel,
      eq(employeeModel.divisionId, divisionModel.divisionId)
    )
    .leftJoin(
      costCenterModel,
      eq(employeeModel.costCenterId, costCenterModel.costCenterId)
    )
    .where(eq(employeeModel.employeeId, employeeId))
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
    .where(eq(employeeLifecycleEventsModel.employeeId, employeeId))
    .orderBy(desc(employeeLifecycleEventsModel.eventDate))

  return {
    employeeDetails,
    employeeHistory,
  }
}

export const employeeAttendanceReport = async (
  fromDate: string,
  toDate: string
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
  salaryYear: number
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
      employeeSalaryComponentId:
        employeeSalaryComponentsModel.employeeSalaryComponentId,
      employeeId: employeeSalaryComponentsModel.employeeId,
      empCode: employeeModel.empCode,
      employeeName: employeeModel.empFullName,
      salaryComponentId: employeeSalaryComponentsModel.salaryComponentId,
      componentName: salaryComponentsModel.componentName,
      componentType: salaryComponentsModel.componentType,
      amount: employeeSalaryComponentsModel.amount,
      salaryMonth: employeeSalaryComponentsModel.salaryMonth,
      salaryYear: employeeSalaryComponentsModel.salaryYear,
      createdBy: employeeSalaryComponentsModel.createdBy,
      createdAt: employeeSalaryComponentsModel.createdAt,
      updatedBy: employeeSalaryComponentsModel.updatedBy,
      updatedAt: employeeSalaryComponentsModel.updatedAt,
    })
    .from(employeeSalaryComponentsModel)
    .innerJoin(
      salaryComponentsModel,
      eq(
        employeeSalaryComponentsModel.salaryComponentId,
        salaryComponentsModel.salaryComponentId
      )
    )
    .innerJoin(
      employeeModel,
      eq(employeeSalaryComponentsModel.employeeId, employeeModel.employeeId)
    )
    .where(
      and(
        inArray(employeeSalaryComponentsModel.employeeId, employeeIds),
        eq(employeeSalaryComponentsModel.salaryMonth, salaryMonth),
        eq(employeeSalaryComponentsModel.salaryYear, salaryYear)
      )
    )
    .orderBy(
      employeeSalaryComponentsModel.employeeId,
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
    salaryComponentId: component.salaryComponentId,
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

export const loneReport = async (fromDate: string, toDate: string) => {
  const rows = await db
    .select({
      // lone data
      employeeLoneId: employeeLoneModel.employeeLoneId,
      employeeLoneName: employeeLoneModel.employeeLoneName,
      loneAmount: employeeLoneModel.amount,
      perMonth: employeeLoneModel.perMonth,
      loneDate: employeeLoneModel.loneDate,
      loneDescription: employeeLoneModel.description,

      // employee data
      employeeId: employeeModel.employeeId,
      employeeName: employeeModel.empFullName,
      empCode: employeeModel.empCode,

      // department
      departmentId: departmentModel.departmentId,
      departmentName: departmentModel.departmentName,

      // designation
      designationId: designationModel.designationId,
      designationName: designationModel.designationName,

      // installment data
      employeeSalaryComponentId:
        employeeSalaryComponentsModel.employeeSalaryComponentId,
      salaryComponentId: employeeSalaryComponentsModel.salaryComponentId,
      salaryMonth: employeeSalaryComponentsModel.salaryMonth,
      salaryYear: employeeSalaryComponentsModel.salaryYear,
      installmentAmount: employeeSalaryComponentsModel.amount,
      isAuthorized: employeeSalaryComponentsModel.isAuthorized,
      isSkipped: employeeSalaryComponentsModel.isSkipped,
      isSalaryGiven: employeeSalaryComponentsModel.isSalaryGiven,
      installmentCreatedAt: employeeSalaryComponentsModel.createdAt,
    })
    .from(employeeLoneModel)
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
    .leftJoin(
      employeeSalaryComponentsModel,
      eq(
        employeeLoneModel.employeeLoneId,
        employeeSalaryComponentsModel.employeeLoneId
      )
    )
    .where(
      and(
        gte(employeeLoneModel.loneDate, new Date(fromDate)),
        lte(employeeLoneModel.loneDate, new Date(toDate))
      )
    )
    .orderBy(
      employeeLoneModel.employeeLoneId,
      employeeSalaryComponentsModel.salaryYear,
      employeeSalaryComponentsModel.salaryMonth
    )

  const groupedMap = new Map()

  for (const row of rows) {
    const loneId = row.employeeLoneId

    if (!groupedMap.has(loneId)) {
      groupedMap.set(loneId, {
        lone: {
          employeeLoneId: row.employeeLoneId,
          employeeLoneName: row.employeeLoneName,
          amount: row.loneAmount,
          perMonth: row.perMonth,
          loneDate: row.loneDate,
          description: row.loneDescription,

          employeeId: row.employeeId,
          employeeName: row.employeeName,
          empCode: row.empCode,

          departmentId: row.departmentId,
          departmentName: row.departmentName,

          designationId: row.designationId,
          designationName: row.designationName,
        },

        installments: [],
      })
    }

    if (row.employeeSalaryComponentId) {
      groupedMap.get(loneId).installments.push({
        employeeSalaryComponentId: row.employeeSalaryComponentId,
        salaryComponentId: row.salaryComponentId,
        salaryMonth: row.salaryMonth,
        salaryYear: row.salaryYear,
        amount: row.installmentAmount,
        isAuthorized: row.isAuthorized,
        isSkipped: row.isSkipped,
        isSalaryGiven: row.isSalaryGiven,
        createdAt: row.installmentCreatedAt,
      })
    }
  }

  return Array.from(groupedMap.values())
}



// ─── Report 1: Daily Attendance ───────────────────────────────
export const dailyAttendanceReport = async (date: string) => {
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
    .leftJoin(employeeModel, eq(attendanceDaily.employeeId, employeeModel.employeeId))
    .leftJoin(departmentModel, eq(employeeModel.departmentId, departmentModel.departmentId))
    .leftJoin(designationModel, eq(employeeModel.designationId, designationModel.designationId))
   .where(sql`DATE(${attendanceDaily.attendanceDate}) = ${date}`)  // ← এটাই fix
    .orderBy(employeeModel.empCode)
}

// ─── Report 2: Attendance Summary (Date Range) ────────────────
export const attendanceSummaryReport = async (fromDate: string, toDate: string) => {
  const rows = await db
    .select({
      attendanceDate: attendanceDaily.attendanceDate,
      status: attendanceDaily.status,
    })
    .from(attendanceDaily)
   .where(
  sql`DATE(${attendanceDaily.attendanceDate}) BETWEEN ${fromDate} AND ${toDate}`
)

  // Date অনুযায়ী group করো
  const summaryMap = new Map<string, { present: number; absent: number; late: number; halfDay: number }>()

  for (const row of rows) {
    const dateKey = (row.attendanceDate as Date).toISOString().split('T')[0]
    if (!summaryMap.has(dateKey)) {
      summaryMap.set(dateKey, { present: 0, absent: 0, late: 0, halfDay: 0 })
    }
    const entry = summaryMap.get(dateKey)!
    const s = row.status?.toUpperCase()
    if (s === 'PRESENT')   entry.present++
    else if (s === 'ABSENT')    entry.absent++
    else if (s === 'LATE')      entry.late++
    else if (s === 'HALF_DAY')  entry.halfDay++
  }

  return Array.from(summaryMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date,
      present:  counts.present,
      absent:   counts.absent,
      late:     counts.late,
      halfDay:  counts.halfDay,
      total:    counts.present + counts.absent + counts.late + counts.halfDay,
    }))
}