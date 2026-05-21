import { eq, inArray } from 'drizzle-orm'
import { db } from '../config/database'
import {
  companyModel,
  leavePolicyDetailsModel,
  leavePolicyMasterModel,
  leaveTypeModel,
  NewLeavePolicyDetails,
  NewLeavePolicyMaster,
} from '../schemas'

type LeavePolicyInput = {
  leavePolicyMaster: NewLeavePolicyMaster
  leavePolicyDetails: NewLeavePolicyDetails[]
}

const toDate = (value: Date | string) => {
  return new Date(value)
}

export const createLeavePolicyService = async (data: LeavePolicyInput) => {
  try {
    return await db.transaction(async (tx) => {
      // insert master
      const [created] = await tx
        .insert(leavePolicyMasterModel)
        .values({
          companyId: data.leavePolicyMaster.companyId,
          policyName: data.leavePolicyMaster.policyName,
          effectiveFrom: toDate(data.leavePolicyMaster.effectiveFrom),
          effectiveTo: data.leavePolicyMaster.effectiveTo
            ? toDate(data.leavePolicyMaster.effectiveTo)
            : null,
          description: data.leavePolicyMaster.description,
          active: data.leavePolicyMaster.active,
          createdBy: data.leavePolicyMaster.createdBy,
        })
        .$returningId()

      if (!created?.leavePolicyMasterId) {
        throw new Error('Failed to create leave policy master')
      }

      const insertId = created.leavePolicyMasterId

      // insert details
      if (data.leavePolicyDetails?.length) {
        await tx.insert(leavePolicyDetailsModel).values(
          data.leavePolicyDetails.map((item) => ({
            leavePolicyMasterId: insertId,
            leaveTypeId: item.leaveTypeId,
            yearlyAllocation: item.yearlyAllocation,
            accrualFrequency: item.accrualFrequency,
            accrualRate: item.accrualRate,
            maxBalanceAllowed: item.maxBalanceAllowed,
            carryForwardLimit: item.carryForwardLimit,
            active: item.active,
            createdBy: item.createdBy,
          }))
        )
      }

      return {
        success: true,
        leavePolicyMasterId: insertId,
      }
    })
  } catch (error: any) {
    console.error('Leave Policy Create Error:', error)

    // MySQL / Drizzle error handling
    if (error?.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new Error('Invalid companyId or leaveTypeId reference')
    }

    if (error?.code === 'ER_DUP_ENTRY') {
      throw new Error('Duplicate leave policy entry')
    }

    // fallback
    throw new Error(error?.message || 'Failed to create leave policy')
  }
}

export const getAllLeavePoliciesService = async (): Promise<
  LeavePolicyInput[]
> => {
  // master
  const masters = await db
    .select({
      leavePolicyMasterId: leavePolicyMasterModel.leavePolicyMasterId,
      companyId: leavePolicyMasterModel.companyId,
      companyName: companyModel.companyName,
      policyName: leavePolicyMasterModel.policyName,
      effectiveFrom: leavePolicyMasterModel.effectiveFrom,
      effectiveTo: leavePolicyMasterModel.effectiveTo,
      description: leavePolicyMasterModel.description,
      active: leavePolicyMasterModel.active,
      createdBy: leavePolicyMasterModel.createdBy,
      createdAt: leavePolicyMasterModel.createdAt,
      updatedBy: leavePolicyMasterModel.updatedBy,
      updatedAt: leavePolicyMasterModel.updatedAt,
    })
    .from(leavePolicyMasterModel)
    .leftJoin(
      companyModel,
      eq(leavePolicyMasterModel.companyId, companyModel.companyId)
    )

  if (masters.length === 0) {
    return []
  }

  // details
  const details = await db
    .select({
      leavePolicyDetailsId: leavePolicyDetailsModel.leavePolicyDetailsId,
      leavePolicyMasterId: leavePolicyDetailsModel.leavePolicyMasterId,
      leaveTypeId: leavePolicyDetailsModel.leaveTypeId,
      leaveTypeName: leaveTypeModel.name,
      yearlyAllocation: leavePolicyDetailsModel.yearlyAllocation,
      accrualFrequency: leavePolicyDetailsModel.accrualFrequency,
      accrualRate: leavePolicyDetailsModel.accrualRate,
      maxBalanceAllowed: leavePolicyDetailsModel.maxBalanceAllowed,
      carryForwardLimit: leavePolicyDetailsModel.carryForwardLimit,
      active: leavePolicyDetailsModel.active,
      createdBy: leavePolicyDetailsModel.createdBy,
      createdAt: leavePolicyDetailsModel.createdAt,
      updatedBy: leavePolicyDetailsModel.updatedBy,
      updatedAt: leavePolicyDetailsModel.updatedAt,
    })
    .from(leavePolicyDetailsModel)
    .leftJoin(
      leaveTypeModel,
      eq(leavePolicyDetailsModel.leaveTypeId, leaveTypeModel.leaveTypeId)
    )

  // group details by master id
  const groupedDetails = details.reduce<
    Record<number, NewLeavePolicyDetails[]>
  >((acc, item) => {
    const key = item.leavePolicyMasterId

    if (!acc[key]) {
      acc[key] = []
    }

    acc[key].push(item)

    return acc
  }, {})

  // final shape
  return masters.map((master) => ({
    leavePolicyMaster: master,
    leavePolicyDetails: groupedDetails[master.leavePolicyMasterId] || [],
  }))
}

export const getLeavePolicyByIdService = async (
  leavePolicyMasterId: number
) => {
  const [master] = await db
    .select({
      leavePolicyMasterId: leavePolicyMasterModel.leavePolicyMasterId,
      companyId: leavePolicyMasterModel.companyId,
      companyName: companyModel.companyName,
      policyName: leavePolicyMasterModel.policyName,
      effectiveFrom: leavePolicyMasterModel.effectiveFrom,
      effectiveTo: leavePolicyMasterModel.effectiveTo,
      description: leavePolicyMasterModel.description,
      active: leavePolicyMasterModel.active,
      createdBy: leavePolicyMasterModel.createdBy,
      createdAt: leavePolicyMasterModel.createdAt,
      updatedBy: leavePolicyMasterModel.updatedBy,
      updatedAt: leavePolicyMasterModel.updatedAt,
    })
    .from(leavePolicyMasterModel)
    .leftJoin(
      companyModel,
      eq(leavePolicyMasterModel.companyId, companyModel.companyId)
    )
    .where(eq(leavePolicyMasterModel.leavePolicyMasterId, leavePolicyMasterId))

  if (!master) {
    return null
  }

  const details = await db
    .select({
      leavePolicyDetailsId: leavePolicyDetailsModel.leavePolicyDetailsId,
      leavePolicyMasterId: leavePolicyDetailsModel.leavePolicyMasterId,
      leaveTypeId: leavePolicyDetailsModel.leaveTypeId,
      leaveTypeName: leaveTypeModel.name,
      yearlyAllocation: leavePolicyDetailsModel.yearlyAllocation,
      accrualFrequency: leavePolicyDetailsModel.accrualFrequency,
      accrualRate: leavePolicyDetailsModel.accrualRate,
      maxBalanceAllowed: leavePolicyDetailsModel.maxBalanceAllowed,
      carryForwardLimit: leavePolicyDetailsModel.carryForwardLimit,
      active: leavePolicyDetailsModel.active,
      createdBy: leavePolicyDetailsModel.createdBy,
      createdAt: leavePolicyDetailsModel.createdAt,
      updatedBy: leavePolicyDetailsModel.updatedBy,
      updatedAt: leavePolicyDetailsModel.updatedAt,
    })
    .from(leavePolicyDetailsModel)
    .leftJoin(
      leaveTypeModel,
      eq(leavePolicyDetailsModel.leaveTypeId, leaveTypeModel.leaveTypeId)
    )
    .where(eq(leavePolicyDetailsModel.leavePolicyMasterId, leavePolicyMasterId))

  return {
    leavePolicyMaster: master,
    leavePolicyDetails: details,
  }
}

export const updateLeavePolicyService = async (
  leavePolicyMasterId: number,
  data: LeavePolicyInput
) => {
  return await db.transaction(async (tx) => {
    // update master
    await tx
      .update(leavePolicyMasterModel)
      .set({
        companyId: data.leavePolicyMaster.companyId,
        policyName: data.leavePolicyMaster.policyName,
        effectiveFrom: data.leavePolicyMaster.effectiveFrom,
        effectiveTo: data.leavePolicyMaster.effectiveTo,
        description: data.leavePolicyMaster.description,
        active: data.leavePolicyMaster.active,
        updatedBy: data.leavePolicyMaster.updatedBy,
      })
      .where(
        eq(leavePolicyMasterModel.leavePolicyMasterId, leavePolicyMasterId)
      )

    const incomingDetailIds = data.leavePolicyDetails
      .map((item) => item.leavePolicyDetailsId)
      .filter((id): id is number => typeof id === 'number')

    const existingDetails = await tx
      .select({
        leavePolicyDetailsId: leavePolicyDetailsModel.leavePolicyDetailsId,
      })
      .from(leavePolicyDetailsModel)
      .where(
        eq(leavePolicyDetailsModel.leavePolicyMasterId, leavePolicyMasterId)
      )

    const existingIds = existingDetails.map((item) => item.leavePolicyDetailsId)

    const deleteIds = existingIds.filter(
      (id) => !incomingDetailIds.includes(id)
    )

    // delete removed details
    if (deleteIds.length > 0) {
      await tx
        .delete(leavePolicyDetailsModel)
        .where(inArray(leavePolicyDetailsModel.leavePolicyDetailsId, deleteIds))
    }

    // insert/update details
    for (const item of data.leavePolicyDetails) {
      if (item.leavePolicyDetailsId) {
        // update
        await tx
          .update(leavePolicyDetailsModel)
          .set({
            leaveTypeId: item.leaveTypeId,
            yearlyAllocation: item.yearlyAllocation,
            accrualFrequency: item.accrualFrequency,
            accrualRate: item.accrualRate,
            maxBalanceAllowed: item.maxBalanceAllowed,
            carryForwardLimit: item.carryForwardLimit,
            active: item.active,
            updatedBy: item.updatedBy,
          })
          .where(
            eq(
              leavePolicyDetailsModel.leavePolicyDetailsId,
              item.leavePolicyDetailsId
            )
          )
      } else {
        // insert
        await tx.insert(leavePolicyDetailsModel).values({
          leavePolicyMasterId,
          leaveTypeId: item.leaveTypeId,
          yearlyAllocation: item.yearlyAllocation,
          accrualFrequency: item.accrualFrequency,
          accrualRate: item.accrualRate,
          maxBalanceAllowed: item.maxBalanceAllowed,
          carryForwardLimit: item.carryForwardLimit,
          active: item.active,
          createdBy: item.createdBy,
        })
      }
    }

    return true
  })
}

export const deleteLeavePolicyService = async (leavePolicyMasterId: number) => {
  return await db.transaction(async (tx) => {
    await tx
      .delete(leavePolicyDetailsModel)
      .where(
        eq(leavePolicyDetailsModel.leavePolicyMasterId, leavePolicyMasterId)
      )

    await tx
      .delete(leavePolicyMasterModel)
      .where(
        eq(leavePolicyMasterModel.leavePolicyMasterId, leavePolicyMasterId)
      )

    return true
  })
}
