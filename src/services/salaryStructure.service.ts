// salary-structure.service.ts

import { eq, inArray } from 'drizzle-orm'
import { db } from '../config/database'
import {
  companyModel,
  salaryComponentsModel,
  salaryStructureDetailsModel,
  salaryStructureMasterModel,
} from '../schemas'

/* =========================
   TYPES
========================= */

type SalaryStructureMasterInput = {
  salaryStructureMasterId?: number
  structureName: string
  structureCode?: string | null
  companyId: number
  companyName?: string | null
  structureType: 'Earning' | 'Deduction'
  effectiveFrom: Date
  effectiveTo?: Date | null
  active: boolean
  createdBy: number
  createdAt?: Date | null
  updatedBy?: number | null
  updatedAt?: Date | null
}

type SalaryStructureDetailsInput = {
  salaryStructureDetailId?: number
  salaryStructureMasterId: number
  salaryComponentId: number
  salaryComponentName?: string | null
  amount: number
  percentage?: number | null
  formulaExpression?: string | null
  calculationOrder: number
  mandatory: boolean
  createdBy: number
  createdAt?: Date | null
  updatedBy?: number | null
  updatedAt?: Date | null
}

type SalaryStructureInput = {
  salaryStructureMaster: SalaryStructureMasterInput
  salaryStructureDetails: SalaryStructureDetailsInput[]
}

/* =========================
   UTILS
========================= */

const toDate = (value: Date | string) => {
  return new Date(value)
}

/* =========================
   CREATE
========================= */

export const createSalaryStructureService = async (
  data: SalaryStructureInput
) => {
  try {
    return await db.transaction(async (tx) => {
      // insert master
      const [created] = await tx
        .insert(salaryStructureMasterModel)
        .values({
          structureName: data.salaryStructureMaster.structureName,
          structureCode: data.salaryStructureMaster.structureCode,
          companyId: data.salaryStructureMaster.companyId,
          structureType: data.salaryStructureMaster.structureType,
          effectiveFrom: toDate(data.salaryStructureMaster.effectiveFrom),
          effectiveTo: data.salaryStructureMaster.effectiveTo
            ? toDate(data.salaryStructureMaster.effectiveTo)
            : null,
          active: data.salaryStructureMaster.active,
          createdBy: data.salaryStructureMaster.createdBy,
        })
        .$returningId()

      if (!created?.salaryStructureMasterId) {
        throw new Error('Failed to create salary structure')
      }

      const insertId = created.salaryStructureMasterId

      // insert details
      if (data.salaryStructureDetails?.length) {
        await tx.insert(salaryStructureDetailsModel).values(
          data.salaryStructureDetails.map((item) => ({
            salaryStructureMasterId: insertId,
            salaryComponentId: item.salaryComponentId,
            amount: item.amount,
            percentage: item.percentage,
            formulaExpression: item.formulaExpression,
            calculationOrder: item.calculationOrder,
            mandatory: item.mandatory,
            createdBy: item.createdBy,
          }))
        )
      }

      return {
        success: true,
        salaryStructureMasterId: insertId,
      }
    })
  } catch (error: any) {
    console.error('Salary Structure Create Error:', error)

    if (error?.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new Error('Invalid companyId or salaryComponentId reference')
    }

    if (error?.code === 'ER_DUP_ENTRY') {
      throw new Error('Duplicate salary structure entry')
    }

    throw new Error(error?.message || 'Failed to create salary structure')
  }
}

/* =========================
   GET ALL
========================= */

export const getAllSalaryStructuresService = async (tenantId: number) => {
  try {
    const masters = await db
      .select()
      .from(salaryStructureMasterModel)
      .where(eq(salaryStructureMasterModel.tenantId, tenantId))

    const details = await db
      .select({
        salaryStructureDetailId:
          salaryStructureDetailsModel.salaryStructureDetailId,
        salaryStructureMasterId:
          salaryStructureDetailsModel.salaryStructureMasterId,
        salaryComponentId:
          salaryStructureDetailsModel.salaryComponentId,
        salaryComponentName:
          salaryComponentsModel.componentName,
        amount: salaryStructureDetailsModel.amount,
        percentage: salaryStructureDetailsModel.percentage,
        formulaExpression:
          salaryStructureDetailsModel.formulaExpression,
        calculationOrder:
          salaryStructureDetailsModel.calculationOrder,
        mandatory: salaryStructureDetailsModel.mandatory,
      })
      .from(salaryStructureDetailsModel)
      .where(eq(salaryStructureDetailsModel.tenantId, tenantId))
      .leftJoin(
        salaryComponentsModel,
        eq(
          salaryStructureDetailsModel.salaryComponentId,
          salaryComponentsModel.salaryComponentId
        )
      )

    const grouped = details.reduce((acc: any, item: any) => {
      if (!acc[item.salaryStructureMasterId]) {
        acc[item.salaryStructureMasterId] = []
      }
      acc[item.salaryStructureMasterId].push(item)
      return acc
    }, {})

    return masters.map((m) => ({
      salaryStructureMaster: m,
      salaryStructureDetails: grouped[m.salaryStructureMasterId] || [],
    }))
  } catch (error: any) {
    console.error('GET ALL ERROR:', error)
    throw new Error(error?.message || 'Fetch failed')
  }
}


/* =========================
   GET BY ID
========================= */

export const getSalaryStructureByIdService = async (
  salaryStructureMasterId: number
) => {
  try {
    const [master] = await db
      .select({
        salaryStructureMasterId: salaryStructureMasterModel.salaryStructureMasterId,
        structureName: salaryStructureMasterModel.structureName,
        structureCode: salaryStructureMasterModel.structureCode,
        companyId: salaryStructureMasterModel.companyId,
        companyName: companyModel.companyName,
        structureType: salaryStructureMasterModel.structureType,
        effectiveFrom: salaryStructureMasterModel.effectiveFrom,
        effectiveTo: salaryStructureMasterModel.effectiveTo,
        active: salaryStructureMasterModel.active,
        createdBy: salaryStructureMasterModel.createdBy,
        createdAt: salaryStructureMasterModel.createdAt,
        updatedBy: salaryStructureMasterModel.updatedBy,
        updatedAt: salaryStructureMasterModel.updatedAt,
      })
      .from(salaryStructureMasterModel)
      .leftJoin(
        companyModel,
        eq(
          salaryStructureMasterModel.companyId,
          companyModel.companyId
        )
      )
      .where(
        eq(
          salaryStructureMasterModel.salaryStructureMasterId,
          salaryStructureMasterId
        )
      )

    if (!master) return null

    const details = await db
      .select({
        salaryStructureDetailId:
          salaryStructureDetailsModel.salaryStructureDetailId,
        salaryStructureMasterId:
          salaryStructureDetailsModel.salaryStructureMasterId,
        salaryComponentId:
          salaryStructureDetailsModel.salaryComponentId,
        salaryComponentName:
          salaryComponentsModel.componentName,
        amount: salaryStructureDetailsModel.amount,
        percentage:
          salaryStructureDetailsModel.percentage,
        formulaExpression:
          salaryStructureDetailsModel.formulaExpression,
        calculationOrder:
          salaryStructureDetailsModel.calculationOrder,
        mandatory: salaryStructureDetailsModel.mandatory,
        createdBy:
          salaryStructureDetailsModel.createdBy,
        createdAt:
          salaryStructureDetailsModel.createdAt,
        updatedBy:
          salaryStructureDetailsModel.updatedBy,
        updatedAt:
          salaryStructureDetailsModel.updatedAt,
      })
      .from(salaryStructureDetailsModel)
      .leftJoin(
        salaryComponentsModel,
        eq(
          salaryStructureDetailsModel.salaryComponentId,
          salaryComponentsModel.salaryComponentId
        )
      )
      .where(
        eq(
          salaryStructureDetailsModel.salaryStructureMasterId,
          salaryStructureMasterId
        )
      )

    return {
      salaryStructureMaster: master,
      salaryStructureDetails: details,
    }
  } catch (error: any) {
    console.error('SERVICE ERROR getSalaryStructureById:', {
      salaryStructureMasterId,
      error,
    })

    throw new Error(
      error?.message || 'Failed to fetch salary structure'
    )
  }
}

/* =========================
   UPDATE
========================= */

export const updateSalaryStructureService = async (
  salaryStructureMasterId: number,
  data: SalaryStructureInput
) => {
  return await db.transaction(async (tx) => {
    // update master
    await tx
      .update(salaryStructureMasterModel)
      .set({
        structureName: data.salaryStructureMaster.structureName,
        structureCode: data.salaryStructureMaster.structureCode,
        companyId: data.salaryStructureMaster.companyId,
        structureType: data.salaryStructureMaster.structureType,
        effectiveFrom: data.salaryStructureMaster.effectiveFrom,
        effectiveTo: data.salaryStructureMaster.effectiveTo,
        active: data.salaryStructureMaster.active,
        updatedBy: data.salaryStructureMaster.updatedBy,
      })
      .where(
        eq(salaryStructureMasterModel.salaryStructureMasterId, salaryStructureMasterId)
      )

    const incomingDetailIds = data.salaryStructureDetails
      .map((item) => item.salaryStructureDetailId)
      .filter((id): id is number => typeof id === 'number')

    const existingDetails = await tx
      .select({
        salaryStructureDetailId:
          salaryStructureDetailsModel.salaryStructureDetailId,
      })
      .from(salaryStructureDetailsModel)
      .where(
        eq(salaryStructureDetailsModel.salaryStructureMasterId, salaryStructureMasterId)
      )

    const existingIds = existingDetails.map(
      (item) => item.salaryStructureDetailId
    )

    const deleteIds = existingIds.filter(
      (id) => !incomingDetailIds.includes(id)
    )

    // delete removed
    if (deleteIds.length > 0) {
      await tx
        .delete(salaryStructureDetailsModel)
        .where(
          inArray(
            salaryStructureDetailsModel.salaryStructureDetailId,
            deleteIds
          )
        )
    }

    // insert/update details
    for (const item of data.salaryStructureDetails) {
      if (item.salaryStructureDetailId) {
        // update
        await tx
          .update(salaryStructureDetailsModel)
          .set({
            salaryComponentId: item.salaryComponentId,
            amount: item.amount,
            percentage: item.percentage,
            formulaExpression: item.formulaExpression,
            calculationOrder: item.calculationOrder,
            mandatory: item.mandatory,
            updatedBy: item.updatedBy,
          })
          .where(
            eq(
              salaryStructureDetailsModel.salaryStructureDetailId,
              item.salaryStructureDetailId
            )
          )
      } else {
        // insert
        await tx.insert(salaryStructureDetailsModel).values({
          salaryStructureMasterId,
          salaryComponentId: item.salaryComponentId,
          amount: item.amount,
          percentage: item.percentage,
          formulaExpression: item.formulaExpression,
          calculationOrder: item.calculationOrder,
          mandatory: item.mandatory,
          createdBy: item.createdBy,
        })
      }
    }

    return true
  })
}

/* =========================
   DELETE
========================= */

export const deleteSalaryStructureService = async (
  salaryStructureMasterId: number
) => {
  return await db.transaction(async (tx) => {
    await tx
      .delete(salaryStructureDetailsModel)
      .where(
        eq(salaryStructureDetailsModel.salaryStructureMasterId, salaryStructureMasterId)
      )

    await tx
      .delete(salaryStructureMasterModel)
      .where(
        eq(salaryStructureMasterModel.salaryStructureMasterId, salaryStructureMasterId)
      )

    return true
  })
}
