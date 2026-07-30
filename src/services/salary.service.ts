import { db } from '../config/database'
import {
  salaryModel,
  NewSalary,
  employeeModel,
  departmentModel,
  designationModel,
  employeeSalaryDetailsModel,
  NewEmployeeSalaryComponent,
  salaryComponentsModel,
  salaryStructureDetailsModel,
  employeeLoneInstallemntsModel,
  employeeLoneModel,
} from '../schemas'
import { and, eq, like } from 'drizzle-orm'

//generate salary
export const generateSalaryPreview = async (
  salaryMonth: string,
  salaryYear: number,
  tenantId: number
) => {
  // Check existing salary
  const existingSalary = await db
    .select({
      salaryId: salaryModel.salaryId,
    })
    .from(salaryModel)
    .where(
      and(
        eq(salaryModel.salaryMonth, salaryMonth as any),
        eq(salaryModel.salaryYear, salaryYear),
        eq(salaryModel.tenantId, tenantId)
      )
    )

  if (existingSalary.length > 0) {
    throw new Error(`Salary already generated for ${salaryMonth} ${salaryYear}`)
  }

  // Get active employees
  const employees = await db
    .select()
    .from(employeeModel)
    .where(
      and(
        eq(employeeModel.isActive, true),
        eq(employeeModel.tenantId, tenantId)
      )
    )

  // Find loan salary component
  const loanComponentResult = await db
    .select({
      salaryComponentId: salaryComponentsModel.salaryComponentId,
      componentName: salaryComponentsModel.componentName,
    })
    .from(salaryComponentsModel)
    .where(
      and(
        like(salaryComponentsModel.componentName, '%lone%'),
        eq(salaryComponentsModel.tenantId, tenantId)
      )
    )
    .limit(1)

  const loanComponent = loanComponentResult[0]

  const result = []

  for (const employee of employees) {
    if (!employee.salaryStructureMasterId) {
      continue
    }

    // Salary structure details
    const structureDetails = await db
      .select({
        salaryStructureDetailId:
          salaryStructureDetailsModel.salaryStructureDetailId,
        salaryComponentId: salaryComponentsModel.salaryComponentId,
        componentName: salaryComponentsModel.componentName,
        componentType: salaryComponentsModel.componentType,
        calculationType: salaryComponentsModel.calculationType,
        amount: salaryStructureDetailsModel.amount,
        percentage: salaryStructureDetailsModel.percentage,
      })
      .from(salaryStructureDetailsModel)
      .innerJoin(
        salaryComponentsModel,
        eq(
          salaryComponentsModel.salaryComponentId,
          salaryStructureDetailsModel.salaryComponentId
        )
      )
      .where(
        eq(
          salaryStructureDetailsModel.salaryStructureMasterId,
          employee.salaryStructureMasterId
        )
      )

    let grossSalary = employee.basicSalary
    let totalDeduction = 0

    // Remove loan component from salary structure
    const components = structureDetails
      .filter((item) => !item.componentName.toLowerCase().includes('lone'))
      .map((item) => {
        let amount = Number(item.amount)

        if (item.calculationType === 'Percentage') {
          amount = (employee.basicSalary * Number(item.percentage)) / 100
        }

        if (item.componentType === 'Allowance') {
          grossSalary += amount
        }

        if (item.componentType === 'Deduction') {
          totalDeduction += amount
        }

        return {
          salaryStructureDetailId: item.salaryStructureDetailId,
          salaryComponentId: item.salaryComponentId,
          componentName: item.componentName,
          componentType: item.componentType,
          calculationType: item.calculationType,
          amount,
        }
      })

    // Find employee loan installments for this salary month
    // Only include loans that are not fully paid
    const loanInstallments = await db
      .select({
        amount: employeeLoneInstallemntsModel.amount,
      })
      .from(employeeLoneInstallemntsModel)
      .innerJoin(
        employeeLoneModel,
        eq(
          employeeLoneModel.employeeLoneId,
          employeeLoneInstallemntsModel.employeeLoneId
        )
      )
      .where(
        and(
          eq(employeeLoneInstallemntsModel.employeeId, employee.employeeId),
          eq(
            employeeLoneInstallemntsModel.loneInstallmentMonth,
            salaryMonth as any
          ),
          eq(employeeLoneInstallemntsModel.loneInstallmentYear, salaryYear),
          eq(employeeLoneInstallemntsModel.isSkipped, false),
          eq(employeeLoneModel.isFullPaid, false)
        )
      )

    const loanAmount = loanInstallments.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    )

    // Add loan deduction from installment table
    if (loanAmount > 0 && loanComponent) {
      // Find loan component's structure detail from the already-fetched
      // structureDetails — guaranteed to belong to employee.salaryStructureMasterId
      const loanStructureDetail = structureDetails.find(
        (item) => item.salaryComponentId === loanComponent.salaryComponentId
      )

      if (!loanStructureDetail) {
        throw new Error(
          `Loan salary component is not assigned in salary structure for ${employee.empFullName}`
        )
      }

      totalDeduction += loanAmount

      components.push({
        salaryStructureDetailId: loanStructureDetail.salaryStructureDetailId,
        salaryComponentId: loanComponent.salaryComponentId,
        componentName: loanComponent.componentName,
        componentType: 'Deduction',
        calculationType: 'Fixed',
        amount: loanAmount,
      })
    }

    result.push({
      employeeId: employee.employeeId,
      empCode: employee.empCode,
      employeeName: employee.empFullName,
      salaryMonth,
      salaryYear,
      basicSalary: employee.basicSalary,
      grossSalary,
      netSalary: grossSalary - totalDeduction,
      components,
    })
  }

  return result
}

// CREATE
export const createSalaries = async (
  salariesData: Array<any>,
  tenantId: number
) => {
  try {
    const createdSalaries = []

    for (const salary of salariesData) {
      const employee = await db.query.employeeModel.findFirst({
        where: and(
          eq(employeeModel.employeeId, salary.employeeId),
          eq(employeeModel.tenantId, tenantId)
        ),
      })

      if (!employee) {
        throw new Error(`Employee ${salary.employeeId} not found`)
      }

      const existingSalary = await db.query.salaryModel.findFirst({
        where: and(
          eq(salaryModel.employeeId, salary.employeeId),
          eq(salaryModel.salaryMonth, salary.salaryMonth),
          eq(salaryModel.salaryYear, salary.salaryYear),
          eq(salaryModel.tenantId, tenantId)
        ),
      })

      if (existingSalary) {
        throw new Error(
          `Salary already generated for ${salary.salaryMonth} ${salary.salaryYear}`
        )
      }

      if (!employee.salaryStructureMasterId) {
        throw new Error(
          `Salary structure not assigned for ${employee.empFullName}`
        )
      }

      let totalAllowance = 0
      let totalDeduction = 0

      for (const component of salary.components) {
        if (component.componentType === 'Allowance') {
          totalAllowance += component.amount
        }

        if (component.componentType === 'Deduction') {
          totalDeduction += component.amount
        }
      }

      const grossSalary = salary.basicSalary + totalAllowance
      const netSalary = grossSalary - totalDeduction

      const componentInsert = salary.components.map((component: any) => ({
        employeeId: salary.employeeId,
        salaryStructureMasterId: employee.salaryStructureMasterId,
        salaryStructureDetailId: component.salaryStructureDetailId,
        tenantId,
        salaryMonth: salary.salaryMonth,
        salaryYear: salary.salaryYear,
        amount: component.amount,
        isDraft: true,
        isSalaryGiven: false,
        createdBy: salary.createdBy,
        createdAt: new Date(),
      }))

      await db.insert(employeeSalaryDetailsModel).values(componentInsert)

      const salaryInsert = {
        salaryMonth: salary.salaryMonth,
        salaryYear: salary.salaryYear,
        employeeId: salary.employeeId,
        departmentId: salary.departmentId,
        designationId: salary.designationId,
        tenantId,
        basicSalary: salary.basicSalary,
        grossSalary,
        netSalary,
        doj: salary.doj,
        isDraft: true,
        isSalaryGiven: false,
        createdBy: salary.createdBy,
        createdAt: new Date(),
      }

      const result = await db.insert(salaryModel).values(salaryInsert)

      createdSalaries.push({
        ...salaryInsert,
        salaryId: Number(result[0].insertId),
      })
    }

    return createdSalaries
  } catch (err) {
    throw err
  }
}

// GET ALL
export const getSalarys = async (tenantId: number) => {
  const rows = await db
    .select({
      // Salary
      salaryId: salaryModel.salaryId,
      salaryMonth: salaryModel.salaryMonth,
      salaryYear: salaryModel.salaryYear,
      basicSalary: salaryModel.basicSalary,
      grossSalary: salaryModel.grossSalary,
      netSalary: salaryModel.netSalary,
      doj: salaryModel.doj,
      createdAt: salaryModel.createdAt,

      // Employee
      employeeId: employeeModel.employeeId,
      empCode: employeeModel.empCode,
      employeeName: employeeModel.empFullName,

      // Department
      departmentId: departmentModel.departmentId,
      departmentName: departmentModel.departmentName,

      // Designation
      designationId: designationModel.designationId,
      designationName: designationModel.designationName,

      // Employee Salary Details
      employeeSalaryDetailsId:
        employeeSalaryDetailsModel.employeeSalaryDetailsId,
      amount: employeeSalaryDetailsModel.amount,
      isDraft: salaryModel.isDraft,
      isSalaryGiven: salaryModel.isSalaryGiven,
      // Salary Component
      salaryComponentId: salaryComponentsModel.salaryComponentId,
      componentName: salaryComponentsModel.componentName,
      componentType: salaryComponentsModel.componentType,
    })
    .from(salaryModel)
    .where(eq(salaryModel.tenantId, tenantId))
    .leftJoin(
      employeeModel,
      eq(salaryModel.employeeId, employeeModel.employeeId)
    )
    .leftJoin(
      departmentModel,
      eq(salaryModel.departmentId, departmentModel.departmentId)
    )
    .leftJoin(
      designationModel,
      eq(salaryModel.designationId, designationModel.designationId)
    )
    .leftJoin(
      employeeSalaryDetailsModel,
      and(
        eq(salaryModel.employeeId, employeeSalaryDetailsModel.employeeId),
        eq(salaryModel.salaryMonth, employeeSalaryDetailsModel.salaryMonth),
        eq(salaryModel.salaryYear, employeeSalaryDetailsModel.salaryYear),
        eq(salaryModel.tenantId, employeeSalaryDetailsModel.tenantId)
      )
    )
    .leftJoin(
      salaryStructureDetailsModel,
      eq(
        employeeSalaryDetailsModel.salaryStructureDetailId,
        salaryStructureDetailsModel.salaryStructureDetailId
      )
    )
    .leftJoin(
      salaryComponentsModel,
      eq(
        salaryStructureDetailsModel.salaryComponentId,
        salaryComponentsModel.salaryComponentId
      )
    )

  const salaryMap = new Map<number, any>()

  for (const row of rows) {
    if (!salaryMap.has(row.salaryId)) {
      salaryMap.set(row.salaryId, {
        salary: {
          salaryId: row.salaryId,
          salaryMonth: row.salaryMonth,
          salaryYear: row.salaryYear,
          basicSalary: row.basicSalary,
          grossSalary: row.grossSalary,
          netSalary: row.netSalary,
          doj: row.doj,
          employeeId: row.employeeId,
          empCode: row.empCode,
          employeeName: row.employeeName,
          departmentId: row.departmentId,
          departmentName: row.departmentName,
          designationId: row.designationId,
          designationName: row.designationName,
          isDraft: row.isDraft,
          isSalaryGiven: row.isSalaryGiven,
          createdAt: row.createdAt,
        },
        otherSalary: [],
      })
    }

    if (row.employeeSalaryDetailsId) {
      salaryMap.get(row.salaryId).otherSalary.push({
        employeeSalaryDetailsId: row.employeeSalaryDetailsId,
        salaryComponentId: row.salaryComponentId,
        componentName: row.componentName,
        componentType: row.componentType,
        amount: row.amount,
      })
    }
  }

  return Array.from(salaryMap.values())
}

// UPDATE
type ComponentType = {
  salaryComponentId: number
  componentType: string
  amount: number
}
type UpdateSalaryPayload = {
  employeeId: number
  salaryMonth: NewSalary['salaryMonth']
  salaryYear: number
  departmentId: number
  designationId: number
  basicSalary: number
  grossSalary?: number
  netSalary?: number
  doj: string
  updatedBy: number
  components?: ComponentType[]
}
export const updateSalaryWithSalaryComponents = async (
  data: UpdateSalaryPayload
) => {
  return await db.transaction(async (tx) => {
    const {
      employeeId,
      salaryMonth,
      salaryYear,
      components = [],
      ...salaryData
    } = data

    /* ---------------- find salary ---------------- */

    const [existingSalary] = await tx
      .select()
      .from(salaryModel)
      .where(
        and(
          eq(salaryModel.employeeId, employeeId),
          eq(salaryModel.salaryMonth, salaryMonth),
          eq(salaryModel.salaryYear, salaryYear)
        )
      )

    if (!existingSalary) {
      throw new Error('Salary record not found.')
    }

    /* ---------------- calculate salary ---------------- */

    const totalAllowance = components
      .filter((component) => component.componentType === 'Allowance')
      .reduce((sum, component) => sum + component.amount, 0)

    const totalDeduction = components
      .filter((component) => component.componentType === 'Deduction')
      .reduce((sum, component) => sum + component.amount, 0)

    const grossSalary = data.basicSalary + totalAllowance

    const netSalary = grossSalary - totalDeduction

    /* ---------------- update salary ---------------- */

    await tx
      .update(salaryModel)
      .set({
        ...salaryData,
        grossSalary,
        netSalary,
        updatedBy: data.updatedBy,
      })
      .where(eq(salaryModel.salaryId, existingSalary.salaryId))

    /* ---------------- get existing salary details ---------------- */

    const existingDetails = await tx
      .select()
      .from(employeeSalaryDetailsModel)
      .where(
        and(
          eq(employeeSalaryDetailsModel.employeeId, employeeId),
          eq(employeeSalaryDetailsModel.salaryMonth, salaryMonth),
          eq(employeeSalaryDetailsModel.salaryYear, salaryYear)
        )
      )

    /* ---------------- delete old salary details ---------------- */

    await tx
      .delete(employeeSalaryDetailsModel)
      .where(
        and(
          eq(employeeSalaryDetailsModel.employeeId, employeeId),
          eq(employeeSalaryDetailsModel.salaryMonth, salaryMonth),
          eq(employeeSalaryDetailsModel.salaryYear, salaryYear)
        )
      )

    /* ---------------- recreate salary details ---------------- */

    if (components.length > 0) {
      if (existingDetails.length !== components.length) {
        throw new Error('Salary components count mismatch.')
      }

      const rows = components.map((component, index) => {
        const existing = existingDetails[index]

        return {
          employeeId,
          tenantId: existing.tenantId,
          salaryMonth,
          salaryYear,

          // keep old structure IDs
          salaryStructureMasterId: existing.salaryStructureMasterId,

          salaryStructureDetailId: existing.salaryStructureDetailId,

          amount: component.amount,

          createdBy: existing.createdBy,

          updatedBy: data.updatedBy,
        }
      })

      await tx.insert(employeeSalaryDetailsModel).values(rows)
    }

    /* ---------------- fetch updated salary ---------------- */

    const [salary] = await tx
      .select()
      .from(salaryModel)
      .where(eq(salaryModel.salaryId, existingSalary.salaryId))

    const otherSalary = await tx
      .select()
      .from(employeeSalaryDetailsModel)
      .where(
        and(
          eq(employeeSalaryDetailsModel.employeeId, employeeId),
          eq(employeeSalaryDetailsModel.salaryMonth, salaryMonth),
          eq(employeeSalaryDetailsModel.salaryYear, salaryYear)
        )
      )

    return {
      salary,
      otherSalary,
    }
  })
}

// DELETE
export const deleteSalaryWithSalaryComponents = async (salaryId: number) => {
  return await db.transaction(async (tx) => {
    /* ---------------- get salary ---------------- */
    const [salary] = await tx
      .select()
      .from(salaryModel)
      .where(eq(salaryModel.salaryId, salaryId))

    if (!salary) return

    /* ---------------- delete other salary components ---------------- */
    await tx
      .delete(employeeSalaryDetailsModel)
      .where(
        and(
          eq(employeeSalaryDetailsModel.employeeId, salary.employeeId),
          eq(employeeSalaryDetailsModel.salaryMonth, salary.salaryMonth),
          eq(employeeSalaryDetailsModel.salaryYear, salary.salaryYear)
        )
      )

    /* ---------------- delete salary ---------------- */
    await tx.delete(salaryModel).where(eq(salaryModel.salaryId, salaryId))
  })
}

export const giveSalary = async (salaryId: number, tenantId: number) => {
  const salary = await db.query.salaryModel.findFirst({
    where: and(
      eq(salaryModel.salaryId, salaryId),
      eq(salaryModel.tenantId, tenantId)
    ),
  })

  if (!salary) {
    throw new Error('Salary record not found.')
  }

  if (salary.isSalaryGiven) {
    throw new Error('Salary has already been given.')
  }

  await db
    .update(salaryModel)
    .set({
      isSalaryGiven: true,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(salaryModel.salaryId, salaryId),
        eq(salaryModel.tenantId, tenantId)
      )
    )

  // Mark that month's loan installment(s) as paid for this employee
  await db
    .update(employeeLoneInstallemntsModel)
    .set({
      isPaid: true,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(employeeLoneInstallemntsModel.employeeId, salary.employeeId),
        eq(
          employeeLoneInstallemntsModel.loneInstallmentMonth,
          salary.salaryMonth
        ),
        eq(
          employeeLoneInstallemntsModel.loneInstallmentYear,
          salary.salaryYear
        ),
        eq(employeeLoneInstallemntsModel.isSkipped, false)
      )
    )

  return {
    message: 'Salary marked as given successfully.',
  }
}

export const makeSalaryPermanent = async (
  salaryId: number,
  tenantId: number
) => {
  const salary = await db.query.salaryModel.findFirst({
    where: and(
      eq(salaryModel.salaryId, salaryId),
      eq(salaryModel.tenantId, tenantId)
    ),
  })

  if (!salary) {
    throw new Error('Salary record not found.')
  }

  if (!salary.isDraft) {
    throw new Error('Salary is already permanent.')
  }

  await db
    .update(salaryModel)
    .set({
      isDraft: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(salaryModel.salaryId, salaryId),
        eq(salaryModel.tenantId, tenantId)
      )
    )

  return {
    message: 'Salary made permanent successfully.',
  }
}
