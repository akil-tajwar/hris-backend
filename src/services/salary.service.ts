import { db } from '../config/database'
import {
  salaryModel,
  NewSalary,
  employeeModel,
  departmentModel,
  designationModel,
  employeeOtherSalaryComponentsModel,
  NewEmployeeOtherSalaryComponent,
  otherSalaryComponentsModel,
} from '../schemas'
import { and, eq } from 'drizzle-orm'

// CREATE
export const createSalaries = async (
  salariesData: Array<
    Omit<NewSalary, 'salaryId' | 'updatedAt' | 'updatedBy' | 'createdAt'>
  >
) => {
  try {
    // Check duplicate salary for same employee + month + year
    for (const salary of salariesData) {
      const existingSalary = await db.query.salaryModel.findFirst({
        where: and(
          eq(salaryModel.employeeId, salary.employeeId),
          eq(salaryModel.salaryMonth, salary.salaryMonth),
          eq(salaryModel.salaryYear, salary.salaryYear)
        ),
      })

      if (existingSalary) {
        throw new Error(
          `Salary already exists for employee ID ${salary.employeeId} for ${salary.salaryMonth} ${salary.salaryYear}`
        )
      }
    }

    // Prepare salaries with timestamps as Date objects
    const salariesWithTimestamps = salariesData.map((salary) => ({
      ...salary,
      createdAt: new Date(), // Use Date object instead of timestamp
    }))

    // Insert salaries
    const result = await db.insert(salaryModel).values(salariesWithTimestamps)

    // Update employee other salary components
    for (const salary of salariesData) {
      await db
        .update(employeeOtherSalaryComponentsModel)
        .set({
          isSalaryGiven: true,
          updatedAt: new Date(), // Use Date object
        })
        .where(
          and(
            eq(
              employeeOtherSalaryComponentsModel.employeeId,
              salary.employeeId
            ),
            eq(
              employeeOtherSalaryComponentsModel.salaryMonth,
              salary.salaryMonth
            ),
            eq(employeeOtherSalaryComponentsModel.salaryYear, salary.salaryYear)
          )
        )
    }

    // Return inserted data with generated IDs
    return salariesWithTimestamps.map((salary, index) => ({
      ...salary,
      salaryId: Number(result[0].insertId) + index,
    }))
  } catch (error) {
    throw error
  }
}

// GET ALL
export const getSalarys = async () => {
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

      // Other salary
      otherSalaryComponentId:
        employeeOtherSalaryComponentsModel.otherSalaryComponentId,
      otherAmount: employeeOtherSalaryComponentsModel.amount,
      componentName: otherSalaryComponentsModel.componentName,
      componentType: otherSalaryComponentsModel.componentType,

      createdAt: salaryModel.createdAt,
    })
    .from(salaryModel)
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
      employeeOtherSalaryComponentsModel,
      and(
        eq(
          salaryModel.employeeId,
          employeeOtherSalaryComponentsModel.employeeId
        ),
        eq(
          salaryModel.salaryMonth,
          employeeOtherSalaryComponentsModel.salaryMonth
        ),
        eq(
          salaryModel.salaryYear,
          employeeOtherSalaryComponentsModel.salaryYear
        )
      )
    )
    .leftJoin(
      otherSalaryComponentsModel,
      and(
        eq(
          employeeOtherSalaryComponentsModel.otherSalaryComponentId,
          otherSalaryComponentsModel.otherSalaryComponentId
        )
      )
    )

  /* ---------------- GROUP RESULT ---------------- */

  const map = new Map<number, any>()

  for (const row of rows) {
    if (!map.has(row.salaryId)) {
      map.set(row.salaryId, {
        salary: {
          salaryId: row.salaryId,
          salaryMonth: row.salaryMonth,
          salaryYear: row.salaryYear,
          basicSalary: row.basicSalary,
          grossSalary: row.grossSalary,
          netSalary: row.netSalary,
          doj: row.doj,

          employeeId: row.employeeId,
          employeeName: row.employeeName,

          departmentId: row.departmentId,
          departmentName: row.departmentName,

          designationId: row.designationId,
          designationName: row.designationName,
          createdAt: row.createdAt,
        },
        otherSalary: [],
      })
    }

    if (row.otherSalaryComponentId) {
      map.get(row.salaryId).otherSalary.push({
        otherSalaryComponentId: row.otherSalaryComponentId,
        amount: row.otherAmount,
        componentName: row.componentName,
        componentType: row.componentType,
        salaryMonth: row.salaryMonth,
        salaryYear: row.salaryYear,
        employeeId: row.employeeId,
        employeeName: row.employeeName,
      })
    }
  }

  return Array.from(map.values())
}

// UPDATE
type UpdateSalaryPayload = {
  salary: Partial<NewSalary>
  otherSalary?: NewEmployeeOtherSalaryComponent[]
}
export const updateSalaryWithOtherSalaryComponents = async (
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
      .delete(employeeOtherSalaryComponentsModel)
      .where(
        and(
          eq(
            employeeOtherSalaryComponentsModel.employeeId,
            data.salary.employeeId!
          ),
          eq(
            employeeOtherSalaryComponentsModel.salaryMonth,
            data.salary.salaryMonth!
          ),
          eq(
            employeeOtherSalaryComponentsModel.salaryYear,
            data.salary.salaryYear!
          )
        )
      )

    /* ---------------- insert new other salary components ---------------- */
    if (data.otherSalary && data.otherSalary.length > 0) {
      await tx
        .insert(employeeOtherSalaryComponentsModel)
        .values(data.otherSalary)
    }

    /* ---------------- fetch updated data ---------------- */
    const [salary] = await tx
      .select()
      .from(salaryModel)
      .where(eq(salaryModel.salaryId, salaryId))

    const otherSalary = await tx
      .select()
      .from(employeeOtherSalaryComponentsModel)
      .where(
        and(
          eq(employeeOtherSalaryComponentsModel.employeeId, salary.employeeId),
          eq(
            employeeOtherSalaryComponentsModel.salaryMonth,
            salary.salaryMonth
          ),
          eq(employeeOtherSalaryComponentsModel.salaryYear, salary.salaryYear)
        )
      )

    return {
      salary,
      otherSalary,
    }
  })
}

// DELETE
export const deleteSalaryWithOtherSalaryComponents = async (
  salaryId: number
) => {
  return await db.transaction(async (tx) => {
    /* ---------------- get salary ---------------- */
    const [salary] = await tx
      .select()
      .from(salaryModel)
      .where(eq(salaryModel.salaryId, salaryId))

    if (!salary) return

    /* ---------------- delete other salary components ---------------- */
    await tx
      .delete(employeeOtherSalaryComponentsModel)
      .where(
        and(
          eq(employeeOtherSalaryComponentsModel.employeeId, salary.employeeId),
          eq(
            employeeOtherSalaryComponentsModel.salaryMonth,
            salary.salaryMonth
          ),
          eq(employeeOtherSalaryComponentsModel.salaryYear, salary.salaryYear)
        )
      )

    /* ---------------- delete salary ---------------- */
    await tx.delete(salaryModel).where(eq(salaryModel.salaryId, salaryId))
  })
}
