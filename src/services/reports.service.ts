import { and, eq, gte, inArray, lte } from 'drizzle-orm'
import { db } from '../config/database'
import {
  departmentModel,
  designationModel,
  employeeAttendanceModel,
  employeeLoneModel,
  employeeModel,
  employeeOtherSalaryComponentsModel,
  otherSalaryComponentsModel,
  salaryModel,
} from '../schemas'

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

  const otherSalaryComponents = await db
    .select({
      employeeOtherSalaryComponentId:
        employeeOtherSalaryComponentsModel.employeeOtherSalaryComponentId,
      employeeId: employeeOtherSalaryComponentsModel.employeeId,
      empCode: employeeModel.empCode,
      employeeName: employeeModel.empFullName,
      otherSalaryComponentId:
        employeeOtherSalaryComponentsModel.otherSalaryComponentId,
      componentName: otherSalaryComponentsModel.componentName,
      componentType: otherSalaryComponentsModel.componentType,
      amount: employeeOtherSalaryComponentsModel.amount,
      salaryMonth: employeeOtherSalaryComponentsModel.salaryMonth,
      salaryYear: employeeOtherSalaryComponentsModel.salaryYear,
      createdBy: employeeOtherSalaryComponentsModel.createdBy,
      createdAt: employeeOtherSalaryComponentsModel.createdAt,
      updatedBy: employeeOtherSalaryComponentsModel.updatedBy,
      updatedAt: employeeOtherSalaryComponentsModel.updatedAt,
    })
    .from(employeeOtherSalaryComponentsModel)
    .innerJoin(
      otherSalaryComponentsModel,
      eq(
        employeeOtherSalaryComponentsModel.otherSalaryComponentId,
        otherSalaryComponentsModel.otherSalaryComponentId
      )
    )
    .innerJoin(
      employeeModel,
      eq(
        employeeOtherSalaryComponentsModel.employeeId,
        employeeModel.employeeId
      )
    )
    .where(
      and(
        inArray(employeeOtherSalaryComponentsModel.employeeId, employeeIds),
        eq(employeeOtherSalaryComponentsModel.salaryMonth, salaryMonth),
        eq(employeeOtherSalaryComponentsModel.salaryYear, salaryYear)
      )
    )
    .orderBy(
      employeeOtherSalaryComponentsModel.employeeId,
      otherSalaryComponentsModel.componentType,
      otherSalaryComponentsModel.componentName
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
  const transformedOtherSalary = otherSalaryComponents.map((component) => ({
    employeeId: component.employeeId,
    empCode: component.empCode,
    employeeName: component.employeeName,
    otherSalaryComponentId: component.otherSalaryComponentId,
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
      employeeOtherSalaryComponentId:
        employeeOtherSalaryComponentsModel.employeeOtherSalaryComponentId,
      otherSalaryComponentId:
        employeeOtherSalaryComponentsModel.otherSalaryComponentId,
      salaryMonth: employeeOtherSalaryComponentsModel.salaryMonth,
      salaryYear: employeeOtherSalaryComponentsModel.salaryYear,
      installmentAmount: employeeOtherSalaryComponentsModel.amount,
      isAuthorized: employeeOtherSalaryComponentsModel.isAuthorized,
      isSkipped: employeeOtherSalaryComponentsModel.isSkipped,
      isSalaryGiven: employeeOtherSalaryComponentsModel.isSalaryGiven,
      installmentCreatedAt: employeeOtherSalaryComponentsModel.createdAt,
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
      employeeOtherSalaryComponentsModel,
      eq(
        employeeLoneModel.employeeLoneId,
        employeeOtherSalaryComponentsModel.employeeLoneId
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
      employeeOtherSalaryComponentsModel.salaryYear,
      employeeOtherSalaryComponentsModel.salaryMonth
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

    if (row.employeeOtherSalaryComponentId) {
      groupedMap.get(loneId).installments.push({
        employeeOtherSalaryComponentId: row.employeeOtherSalaryComponentId,
        otherSalaryComponentId: row.otherSalaryComponentId,
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
