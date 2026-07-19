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
} from '../schemas'
import { and, eq } from 'drizzle-orm'

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
    const components = structureDetails.map((item) => {
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
        isAuthorized: true,
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
        isDraft: false,
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
      isDraft: employeeSalaryDetailsModel.isDraft,
      isSalaryGiven: employeeSalaryDetailsModel.isSalaryGiven,
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
type UpdateSalaryPayload = {
  salary: Partial<NewSalary>
  otherSalary?: NewEmployeeSalaryComponent[]
}
export const updateSalaryWithSalaryComponents = async (
  salaryId: number,
  data: UpdateSalaryPayload
) => {
  return await db.transaction(async (tx) => {
    /* ---------------- update salary ---------------- */
    await tx
      .update(salaryModel)
      .set(data.salary)
      .where(eq(salaryModel.salaryId, salaryId))

    /* ---------------- delete old other salary components ---------------- */
    await tx
      .delete(employeeSalaryDetailsModel)
      .where(
        and(
          eq(employeeSalaryDetailsModel.employeeId, data.salary.employeeId!),
          eq(employeeSalaryDetailsModel.salaryMonth, data.salary.salaryMonth!),
          eq(employeeSalaryDetailsModel.salaryYear, data.salary.salaryYear!)
        )
      )

    /* ---------------- insert new other salary components ---------------- */
    if (data.otherSalary && data.otherSalary.length > 0) {
      await tx.insert(employeeSalaryDetailsModel).values(data.otherSalary)
    }

    /* ---------------- fetch updated data ---------------- */
    const [salary] = await tx
      .select()
      .from(salaryModel)
      .where(eq(salaryModel.salaryId, salaryId))

    const otherSalary = await tx
      .select()
      .from(employeeSalaryDetailsModel)
      .where(
        and(
          eq(employeeSalaryDetailsModel.employeeId, salary.employeeId),
          eq(employeeSalaryDetailsModel.salaryMonth, salary.salaryMonth),
          eq(employeeSalaryDetailsModel.salaryYear, salary.salaryYear)
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
