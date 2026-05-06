import { db } from '../config/database'
import {
  departmentModel,
  designationModel,
  employeeModel,
  employeeOtherSalaryComponentsModel,
  Lone,
  employeeLoneModel,
  NewLone,
  otherSalaryComponentsModel,
} from '../schemas'
import { and, eq, sql } from 'drizzle-orm'
import { BadRequestError, NotFoundError } from './utils/errors.utils'

// CREATE
export const createLone = async (data: NewLone) => {
  console.log('🚀 ~ createLone ~ data:', data)

  const [employee] = await db
    .select()
    .from(employeeModel)
    .where(eq(employeeModel.employeeId, data.employeeId))
    .limit(1)

  if (!employee) {
    throw BadRequestError('Employee not found')
  }

  if (data.amount > employee.basicSalary) {
    throw BadRequestError(
      `Lone amount (${data.amount}) cannot exceed employee's basic salary (${employee.basicSalary})`
    )
  }

  // Fetch lone salary component where isLoneFee = 1 (or true)
  const [loneSalaryComponent] = await db
    .select()
    .from(otherSalaryComponentsModel)
    .where(eq(otherSalaryComponentsModel.isLoneFee, true))
    .limit(1)

  if (!loneSalaryComponent) {
    throw BadRequestError(
      'Lone salary component not configured. Please contact administrator.'
    )
  }

  const now = new Date()

  // Insert into lones table
  const result = await db.insert(employeeLoneModel).values({
    ...data,
    createdAt: now,
    updatedAt: now,
  })

  const employeeLoneId = Number(result[0].insertId)

  // ---- INSTALLMENT LOGIC START ----
  let remainingAmount = data.amount
  const perMonth = data.perMonth

  if (!perMonth || perMonth <= 0) {
    throw BadRequestError('perMonth must be greater than 0')
  }

  const loneDate = new Date(data.loneDate)

  // Start from next month
  let currentDate = new Date(loneDate)
  currentDate.setMonth(currentDate.getMonth() + 1)

  const insertPayload: any[] = []

  while (remainingAmount > 0) {
    const deductionAmount =
      remainingAmount >= perMonth ? perMonth : remainingAmount

    const salaryMonth = currentDate.toLocaleString('default', {
      month: 'long',
    })
    const salaryYear = currentDate.getFullYear()

    insertPayload.push({
      employeeId: data.employeeId,
      otherSalaryComponentId: loneSalaryComponent.otherSalaryComponentId,
      employeeLoneId: employeeLoneId,
      salaryMonth,
      salaryYear,
      amount: deductionAmount,
      isAuthorized: 1,
      isSkipped: 0,
      createdBy: data.createdBy,
      createdAt: now,
    })

    remainingAmount -= deductionAmount

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  // Bulk insert all months
  if (insertPayload.length > 0) {
    await db.insert(employeeOtherSalaryComponentsModel).values(insertPayload)
  }

  // ---- INSTALLMENT LOGIC END ----
  const [lone] = await db
    .select()
    .from(employeeLoneModel)
    .where(eq(employeeLoneModel.employeeLoneId, employeeLoneId))

  return lone
}

// READ ALL
export const getLones = async () => {
  return await db
    .select({
      // Lone fields
      employeeLoneId: employeeLoneModel.employeeLoneId,
      employeeLoneName: employeeLoneModel.employeeLoneName,
      loneDate: employeeLoneModel.loneDate,
      employeeId: employeeLoneModel.employeeId,
      amount: employeeLoneModel.amount,
      perMonth: employeeLoneModel.perMonth,
      description: employeeLoneModel.description,
      createdBy: employeeLoneModel.createdBy,
      createdAt: employeeLoneModel.createdAt,
      updatedBy: employeeLoneModel.updatedBy,
      updatedAt: employeeLoneModel.updatedAt,
      // Employee fields (adjust based on your employeeModel schema)
      empCode: employeeModel.empCode, // example field
      employeeName: employeeModel.empFullName, // example field
      designationName: designationModel.designationName, // example field
      departmentName: departmentModel.departmentName, // example field
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
}

// UPDATE
export const updateLone = async (data: Lone) => {
  await db
    .update(employeeLoneModel)
    .set({ employeeLoneName: data.employeeLoneName, updatedBy: data.updatedBy })
    .where(eq(employeeLoneModel.employeeLoneId, data.employeeLoneId))

  const [updated] = await db
    .select()
    .from(employeeLoneModel)
    .where(eq(employeeLoneModel.employeeLoneId, data.employeeLoneId))

  return updated
}

// DELETE
export const deleteLone = async (employeeLoneId: number) => {
  await db.transaction(async (trx) => {
    // Delete related records first
    await trx
      .delete(employeeOtherSalaryComponentsModel)
      .where(
        eq(employeeOtherSalaryComponentsModel.employeeLoneId, employeeLoneId)
      )

    // Then delete the loan record
    await trx
      .delete(employeeLoneModel)
      .where(eq(employeeLoneModel.employeeLoneId, employeeLoneId))
  })
}

//skip lone
interface SkipLoneParams {
  employeeOtherSalaryComponentId: number
  updatedBy: number
}

// Helper function to convert month name to number
function getMonthNumber(monthName: string): number {
  const months = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  }
  return months[monthName as keyof typeof months]
}

// Helper: convert month + year to Date
function toDate(month: string, year: number): Date {
  return new Date(year, getMonthNumber(month), 1)
}

export const skipLoneInstallment = async (params: SkipLoneParams) => {
  const { employeeOtherSalaryComponentId, updatedBy } = params

  // Get the installment to skip
  const [installment] = await db
    .select()
    .from(employeeOtherSalaryComponentsModel)
    .where(
      eq(
        employeeOtherSalaryComponentsModel.employeeOtherSalaryComponentId,
        employeeOtherSalaryComponentId
      )
    )
    .limit(1)

  if (!installment) {
    throw NotFoundError('Lone installment not found')
  }

  // Check if already skipped
  if (installment.isSkipped === true) {
    throw BadRequestError('This installment is already skipped')
  }

  // Check if installment is authorized
  if (installment.isAuthorized !== true) {
    throw BadRequestError('Cannot skip unauthorized installment')
  }

  const employeeLoneId = installment.employeeLoneId

  if (!employeeLoneId) {
    throw BadRequestError('No lone associated with this installment')
  }

  const now = new Date()

  // Mark current installment as skipped
  await db
    .update(employeeOtherSalaryComponentsModel)
    .set({
      isSkipped: true,
      updatedBy: updatedBy,
      updatedAt: now,
    })
    .where(
      eq(
        employeeOtherSalaryComponentsModel.employeeOtherSalaryComponentId,
        employeeOtherSalaryComponentId
      )
    )

  const skippedAmount = installment.amount

  // Get all installments under this loan
  const allInstallments = await db
    .select()
    .from(employeeOtherSalaryComponentsModel)
    .where(
      eq(employeeOtherSalaryComponentsModel.employeeLoneId, employeeLoneId)
    )

  if (!allInstallments.length) {
    throw BadRequestError('No installments found for this loan')
  }

  // ✅ Find the TRUE last installment using Date comparison
  const lastInstallment = allInstallments.reduce((latest, current) => {
    const currentDate = toDate(current.salaryMonth, current.salaryYear)
    const latestDate = toDate(latest.salaryMonth, latest.salaryYear)

    return currentDate > latestDate ? current : latest
  })

  // ✅ Add 1 month to the LAST installment date
  const nextDate = new Date(
    lastInstallment.salaryYear,
    getMonthNumber(lastInstallment.salaryMonth),
    1
  )

  nextDate.setMonth(nextDate.getMonth() + 1)

  const newSalaryMonth = nextDate.toLocaleString('default', { month: 'long' })
  const newSalaryYear = nextDate.getFullYear()

  // Insert new installment
  await db.insert(employeeOtherSalaryComponentsModel).values({
    employeeId: installment.employeeId,
    otherSalaryComponentId: installment.otherSalaryComponentId,
    employeeLoneId: employeeLoneId,
    salaryMonth: newSalaryMonth as
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
      | 'December',
    salaryYear: newSalaryYear,
    amount: skippedAmount,
    isAuthorized: true,
    isSkipped: false,
    createdBy: updatedBy,
    createdAt: now,
  })

  // Get updated installments (ordered properly using JS sort)
  const updatedInstallments = (
    await db
      .select()
      .from(employeeOtherSalaryComponentsModel)
      .where(
        eq(employeeOtherSalaryComponentsModel.employeeLoneId, employeeLoneId)
      )
  ).sort((a, b) => {
    const dateA = toDate(a.salaryMonth, a.salaryYear).getTime()
    const dateB = toDate(b.salaryMonth, b.salaryYear).getTime()
    return dateA - dateB
  })

  return {
    message: 'Lone installment skipped successfully',
    employeeLoneId,
    skippedAmount,
    skippedInstallment: {
      month: installment.salaryMonth,
      year: installment.salaryYear,
      amount: installment.amount,
    },
    newInstallment: {
      month: newSalaryMonth,
      year: newSalaryYear,
      amount: skippedAmount,
    },
    remainingInstallments: updatedInstallments.filter(
      (inst) => inst.isSkipped === false && inst.isAuthorized === true
    ).length,
    installments: updatedInstallments,
  }
}
