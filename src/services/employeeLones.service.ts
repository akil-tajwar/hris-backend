import { db } from '../config/database'
import {
  departmentModel,
  designationModel,
  employeeModel,
  employeeLoneModel,
  NewEmployeeLone,
  salaryComponentsModel,
  EmployeeLone,
  employeeLoneInstallemntsModel,
} from '../schemas'
import { and, eq, ilike, inArray, like, sql } from 'drizzle-orm'
import { BadRequestError, NotFoundError } from './utils/errors.utils'

const MONTHS = {
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
} as const

// Helper function to convert month number (0-11) to name
function getMonthName(monthNumber: number): string {
  const entries = Object.entries(MONTHS)
  const found = entries.find(([_, value]) => value === monthNumber)
  return found ? found[0] : ''
}

// CREATE
export const createLone = async (data: NewEmployeeLone) => {
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

  const [loneSalaryComponent] = await db
    .select()
    .from(salaryComponentsModel)
    .where(like(salaryComponentsModel.componentName, '%lone%'))
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
  let currentMonth = loneDate.getMonth() + 1 // getMonth() returns 0-11, add 1 to get next month
  let currentYear = loneDate.getFullYear()

  // If currentMonth is 12 (December + 1 = 12), set to 0 (January) and increment year
  if (currentMonth === 12) {
    currentMonth = 0
    currentYear += 1
  }

  const installmentPayload: any[] = []

  while (remainingAmount > 0) {
    const deductionAmount =
      remainingAmount >= perMonth ? perMonth : remainingAmount

    const monthName = getMonthName(currentMonth)

    installmentPayload.push({
      employeeLoneId: employeeLoneId,
      employeeId: data.employeeId,
      amount: deductionAmount,
      loneInstallmentMonth: monthName,
      loneInstallmentYear: currentYear,
      isSkipped: false,
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
    })

    remainingAmount -= deductionAmount

    // Move to next month (0-11)
    if (currentMonth === 11) {
      currentMonth = 0
      currentYear += 1
    } else {
      currentMonth += 1
    }
  }

  // Bulk insert all installments
  if (installmentPayload.length > 0) {
    await db.insert(employeeLoneInstallemntsModel).values(installmentPayload)
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
  // First, get all lones with employee details
  const lones = await db
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
      // Employee fields
      empCode: employeeModel.empCode,
      empFullName: employeeModel.empFullName,
      designationName: designationModel.designationName,
      departmentName: departmentModel.departmentName,
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

  if (lones.length === 0) {
    return []
  }

  // Get all installment data for these lones
  const loneIds = lones.map((lone) => lone.employeeLoneId)

  const installments = await db
    .select({
      employeeLoneInstallmentId:
        employeeLoneInstallemntsModel.employeeLoneInstallmentId,
      employeeLoneId: employeeLoneInstallemntsModel.employeeLoneId,
      employeeId: employeeLoneInstallemntsModel.employeeId,
      amount: employeeLoneInstallemntsModel.amount,
      loneInstallmentMonth: employeeLoneInstallemntsModel.loneInstallmentMonth,
      loneInstallmentYear: employeeLoneInstallemntsModel.loneInstallmentYear,
      isSkipped: employeeLoneInstallemntsModel.isSkipped,
      isPaid: employeeLoneInstallemntsModel.isPaid, // Add this field
      createdBy: employeeLoneInstallemntsModel.createdBy,
      createdAt: employeeLoneInstallemntsModel.createdAt,
      updatedBy: employeeLoneInstallemntsModel.updatedBy,
      updatedAt: employeeLoneInstallemntsModel.updatedAt,
    })
    .from(employeeLoneInstallemntsModel)
    .where(inArray(employeeLoneInstallemntsModel.employeeLoneId, loneIds))
    .orderBy(
      employeeLoneInstallemntsModel.loneInstallmentYear,
      employeeLoneInstallemntsModel.loneInstallmentMonth
    )

  // Group installments by employeeLoneId
  const installmentsByLoneId = installments.reduce(
    (acc, installment) => {
      const key = installment.employeeLoneId
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(installment)
      return acc
    },
    {} as Record<number, typeof installments>
  )

  // Combine lones with their installments
  const result = lones.map((lone) => {
    const loneInstallments = installmentsByLoneId[lone.employeeLoneId] || []

    const totalPaid = loneInstallments
      .filter((inst) => inst.isSkipped === false && inst.isPaid === true)
      .reduce((sum, inst) => sum + Number(inst.amount), 0)

    const totalRemaining = loneInstallments
      .filter((inst) => inst.isSkipped === false && inst.isPaid === false)
      .reduce((sum, inst) => sum + Number(inst.amount), 0)

    return {
      ...lone,
      installments: loneInstallments,
      totalPaid: totalPaid,
      remainingBalance: totalRemaining,
      totalInstallments: loneInstallments.length,
    }
  })

  return result
}

// UPDATE
export const updateLone = async (data: EmployeeLone) => {
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
    // // Delete related records first
    // await trx
    //   .delete(employeesalaryComponentsModel)
    //   .where(
    //     eq(employeesalaryComponentsModel.employeeLoneId, employeeLoneId)
    //   )

    // Then delete the loan record
    await trx
      .delete(employeeLoneModel)
      .where(eq(employeeLoneModel.employeeLoneId, employeeLoneId))
  })
}

//skip lone
interface SkipLoneParams {
  employeeLoneInstallmentId: number // Changed from employeeOtherSalaryComponentId
  updatedBy: number
}

// Helper function to convert month name to number (same as before)
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
  const { employeeLoneInstallmentId, updatedBy } = params

  // Get the installment to skip from the installments table
  const [installment] = await db
    .select()
    .from(employeeLoneInstallemntsModel)
    .where(
      eq(
        employeeLoneInstallemntsModel.employeeLoneInstallmentId,
        employeeLoneInstallmentId
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

  const employeeLoneId = installment.employeeLoneId

  if (!employeeLoneId) {
    throw BadRequestError('No lone associated with this installment')
  }

  const now = new Date()

  // Mark current installment as skipped
  await db
    .update(employeeLoneInstallemntsModel)
    .set({
      isSkipped: true,
      updatedBy: updatedBy,
      updatedAt: now,
    })
    .where(
      eq(
        employeeLoneInstallemntsModel.employeeLoneInstallmentId,
        employeeLoneInstallmentId
      )
    )

  const skippedAmount = installment.amount

  // Get all installments under this loan
  const allInstallments = await db
    .select()
    .from(employeeLoneInstallemntsModel)
    .where(eq(employeeLoneInstallemntsModel.employeeLoneId, employeeLoneId))

  if (!allInstallments.length) {
    throw BadRequestError('No installments found for this loan')
  }

  // Find the TRUE last installment using Date comparison
  const lastInstallment = allInstallments.reduce((latest, current) => {
    const currentDate = toDate(
      current.loneInstallmentMonth,
      current.loneInstallmentYear
    )
    const latestDate = toDate(
      latest.loneInstallmentMonth,
      latest.loneInstallmentYear
    )

    return currentDate > latestDate ? current : latest
  })

  // Add 1 month to the LAST installment date
  const nextDate = new Date(
    lastInstallment.loneInstallmentYear,
    getMonthNumber(lastInstallment.loneInstallmentMonth),
    1
  )

  nextDate.setMonth(nextDate.getMonth() + 1)

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
  ]
  const newSalaryMonth = monthNames[nextDate.getMonth()]
  const newSalaryYear = nextDate.getFullYear()

  // Insert new installment
  await db.insert(employeeLoneInstallemntsModel).values({
    employeeLoneId: employeeLoneId,
    employeeId: installment.employeeId,
    amount: Number(skippedAmount), // Ensure it's a number
    loneInstallmentMonth: newSalaryMonth as
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
    loneInstallmentYear: newSalaryYear,
    isSkipped: false,
    createdBy: updatedBy,
    createdAt: now,
    updatedAt: now,
  })

  // Get updated installments (ordered properly using JS sort)
  const updatedInstallments = (
    await db
      .select()
      .from(employeeLoneInstallemntsModel)
      .where(eq(employeeLoneInstallemntsModel.employeeLoneId, employeeLoneId))
  ).sort((a, b) => {
    const dateA = toDate(
      a.loneInstallmentMonth,
      a.loneInstallmentYear
    ).getTime()
    const dateB = toDate(
      b.loneInstallmentMonth,
      b.loneInstallmentYear
    ).getTime()
    return dateA - dateB
  })

  // Calculate total remaining amount
  const totalRemaining = updatedInstallments
    .filter((inst) => inst.isSkipped === false)
    .reduce((sum, inst) => sum + Number(inst.amount), 0)

  return {
    message: 'Lone installment skipped successfully',
    employeeLoneId,
    skippedAmount: Number(skippedAmount),
    skippedInstallment: {
      month: installment.loneInstallmentMonth,
      year: installment.loneInstallmentYear,
      amount: Number(installment.amount),
    },
    newInstallment: {
      month: newSalaryMonth,
      year: newSalaryYear,
      amount: Number(skippedAmount),
    },
    remainingInstallments: updatedInstallments.filter(
      (inst) => inst.isSkipped === false
    ).length,
    totalRemainingAmount: totalRemaining,
    installments: updatedInstallments.map((inst) => ({
      ...inst,
      amount: Number(inst.amount), // Convert Decimal to number for JSON
    })),
  }
}

export const makeEmployeeLoneFullPaid = async (
  employeeLoneId: number,
  updatedBy: number
) => {
  return await db.transaction(async (tx) => {
    // Check loan exists
    const [loan] = await tx
      .select()
      .from(employeeLoneModel)
      .where(eq(employeeLoneModel.employeeLoneId, employeeLoneId))

    if (!loan) {
      throw new Error('Loan not found')
    }

    // Mark loan as fully paid
    await tx
      .update(employeeLoneModel)
      .set({
        isFullPaid: true,
        updatedBy,
      })
      .where(eq(employeeLoneModel.employeeLoneId, employeeLoneId))

    // Mark all installments as paid
    await tx
      .update(employeeLoneInstallemntsModel)
      .set({
        isPaid: true,
        updatedBy,
      })
      .where(eq(employeeLoneInstallemntsModel.employeeLoneId, employeeLoneId))

    return {
      message: 'Loan marked as fully paid successfully.',
    }
  })
}
