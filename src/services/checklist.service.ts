import { eq, inArray } from 'drizzle-orm'
import { db } from '../config/database'
import {
  checklistMasterModel,
  checklistDetailsModel,
  employeeModel,
  NewChecklistMaster,
  NewChecklistDetails,
} from '../schemas'
import { sendToUser } from '../middlewares/sse'
import { notifyEmployee } from '../middlewares/notifyEmployee'

type ChecklistInput = {
  checklistMaster: NewChecklistMaster
  checklistDetails: NewChecklistDetails[]
}

export const createChecklistService = async (data: ChecklistInput) => {
  try {
    const result = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(checklistMasterModel)
        .values({
          checklistName: data.checklistMaster.checklistName,
          heading: data.checklistMaster.heading,
          responsibleEmployeeId: data.checklistMaster.responsibleEmployeeId,
          createdBy: data.checklistMaster.createdBy,
        })
        .$returningId()

      if (!created?.checklistMasterId) {
        throw new Error('Failed to create checklist master')
      }

      const insertId = created.checklistMasterId

      if (data.checklistDetails?.length) {
        await tx.insert(checklistDetailsModel).values(
          data.checklistDetails.map((item) => ({
            checklistMasterId: insertId,
            checklistDetailsName: item.checklistDetailsName,
            responsibleEmployeeId: item.responsibleEmployeeId || 0,
            createdBy: item.createdBy,
          }))
        )
      }

      return {
        success: true,
        checklistMasterId: insertId,
        responsibleEmployeeId: data.checklistMaster.responsibleEmployeeId,
      }
    })

    // 🔥 NOTIFICATION (OUTSIDE TX)
    if (result.responsibleEmployeeId) {
      await notifyEmployee(
        result.responsibleEmployeeId,
        "You've been assigned a checklist",
        {
          checklistMasterId: result.checklistMasterId,
        }
      )
    }

    return result
  } catch (error: any) {
    console.error('Checklist Create Error:', error)

    if (error?.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new Error('Invalid employeeId reference')
    }

    if (error?.code === 'ER_DUP_ENTRY') {
      throw new Error('Duplicate checklist entry')
    }

    throw new Error(error?.message || 'Failed to create checklist')
  }
}

export const updateChecklistService = async (
  checklistMasterId: number,
  data: ChecklistInput
) => {
  const result = await db.transaction(async (tx) => {
    await tx
      .update(checklistMasterModel)
      .set({
        checklistName: data.checklistMaster.checklistName,
        heading: data.checklistMaster.heading,
        responsibleEmployeeId: data.checklistMaster.responsibleEmployeeId,
        updatedBy: data.checklistMaster.updatedBy,
      })
      .where(eq(checklistMasterModel.checklistMasterId, checklistMasterId))

    const incomingDetailIds = data.checklistDetails
      .map((item) => item.checklistDetailsId)
      .filter((id): id is number => typeof id === 'number')

    const existingDetails = await tx
      .select({
        checklistDetailsId: checklistDetailsModel.checklistDetailsId,
      })
      .from(checklistDetailsModel)
      .where(eq(checklistDetailsModel.checklistMasterId, checklistMasterId))

    const existingIds = existingDetails.map((item) => item.checklistDetailsId)

    const deleteIds = existingIds.filter(
      (id) => !incomingDetailIds.includes(id)
    )

    if (deleteIds.length > 0) {
      await tx
        .delete(checklistDetailsModel)
        .where(inArray(checklistDetailsModel.checklistDetailsId, deleteIds))
    }

    for (const item of data.checklistDetails) {
      if (item.checklistDetailsId) {
        await tx
          .update(checklistDetailsModel)
          .set({
            checklistDetailsName: item.checklistDetailsName,
            responsibleEmployeeId: item.responsibleEmployeeId,
            updatedBy: item.updatedBy,
          })
          .where(
            eq(
              checklistDetailsModel.checklistDetailsId,
              item.checklistDetailsId
            )
          )
      } else {
        await tx.insert(checklistDetailsModel).values({
          checklistMasterId,
          checklistDetailsName: item.checklistDetailsName,
          responsibleEmployeeId: item.responsibleEmployeeId,
          createdBy: item.createdBy,
        })
      }
    }

    return {
      success: true,
      checklistMasterId,
      responsibleEmployeeId: data.checklistMaster.responsibleEmployeeId,
    }
  })

  // 🔥 NOTIFICATION (OUTSIDE TX)
  if (result.responsibleEmployeeId) {
    await notifyEmployee(
      result.responsibleEmployeeId,
      'Your assigned checklist has been modified',
      {
        checklistMasterId,
      }
    )
  }

  return result
}

export const getAllChecklistsService = async (): Promise<ChecklistInput[]> => {
  // masters
  const masters = await db
    .select({
      checklistMasterId: checklistMasterModel.checklistMasterId,
      checklistName: checklistMasterModel.checklistName,
      heading: checklistMasterModel.heading,
      responsibleEmployeeId: checklistMasterModel.responsibleEmployeeId,
      responsibleEmployeeName: employeeModel.empFullName,
      userId: employeeModel.userId,
      createdBy: checklistMasterModel.createdBy,
      createdAt: checklistMasterModel.createdAt,
      updatedBy: checklistMasterModel.updatedBy,
      updatedAt: checklistMasterModel.updatedAt,
    })
    .from(checklistMasterModel)
    .leftJoin(
      employeeModel,
      eq(checklistMasterModel.responsibleEmployeeId, employeeModel.employeeId)
    )

  if (masters.length === 0) {
    return []
  }

  // details
  const details = await db
    .select({
      checklistDetailsId: checklistDetailsModel.checklistDetailsId,
      checklistMasterId: checklistDetailsModel.checklistMasterId,
      checklistDetailsName: checklistDetailsModel.checklistDetailsName,
      responsibleEmployeeId: checklistDetailsModel.responsibleEmployeeId,
      responsibleEmployeeName: employeeModel.empFullName,
      createdBy: checklistDetailsModel.createdBy,
      createdAt: checklistDetailsModel.createdAt,
      updatedBy: checklistDetailsModel.updatedBy,
      updatedAt: checklistDetailsModel.updatedAt,
    })
    .from(checklistDetailsModel)
    .leftJoin(
      employeeModel,
      eq(checklistDetailsModel.responsibleEmployeeId, employeeModel.employeeId)
    )

  // group details by master id
  const groupedDetails = details.reduce<Record<number, NewChecklistDetails[]>>(
    (acc, item) => {
      const key = item.checklistMasterId

      if (key == null) {
        return acc
      }

      if (!acc[key]) {
        acc[key] = []
      }

      acc[key].push(item)

      return acc
    },
    {}
  )

  // final shape
  return masters.map((master) => ({
    checklistMaster: master,
    checklistDetails: groupedDetails[master.checklistMasterId] || [],
  }))
}

export const getChecklistByIdService = async (checklistMasterId: number) => {
  const [master] = await db
    .select({
      checklistMasterId: checklistMasterModel.checklistMasterId,
      checklistName: checklistMasterModel.checklistName,
      heading: checklistMasterModel.heading,
      responsibleEmployeeId: checklistMasterModel.responsibleEmployeeId,
      responsibleEmployeeName: employeeModel.empFullName,
      createdBy: checklistMasterModel.createdBy,
      createdAt: checklistMasterModel.createdAt,
      updatedBy: checklistMasterModel.updatedBy,
      updatedAt: checklistMasterModel.updatedAt,
    })
    .from(checklistMasterModel)
    .leftJoin(
      employeeModel,
      eq(checklistMasterModel.responsibleEmployeeId, employeeModel.employeeId)
    )
    .where(eq(checklistMasterModel.checklistMasterId, checklistMasterId))

  if (!master) {
    return null
  }

  const details = await db
    .select({
      checklistDetailsId: checklistDetailsModel.checklistDetailsId,
      checklistMasterId: checklistDetailsModel.checklistMasterId,
      responsibleEmployeeId: checklistDetailsModel.responsibleEmployeeId,
      responsibleEmployeeName: employeeModel.empFullName,
      createdBy: checklistDetailsModel.createdBy,
      createdAt: checklistDetailsModel.createdAt,
      updatedBy: checklistDetailsModel.updatedBy,
      updatedAt: checklistDetailsModel.updatedAt,
    })
    .from(checklistDetailsModel)
    .leftJoin(
      employeeModel,
      eq(checklistDetailsModel.responsibleEmployeeId, employeeModel.employeeId)
    )
    .where(eq(checklistDetailsModel.checklistMasterId, checklistMasterId))

  return {
    checklistMaster: master,
    checklistDetails: details,
  }
}

export const deleteChecklistService = async (checklistMasterId: number) => {
  return await db.transaction(async (tx) => {
    await tx
      .delete(checklistDetailsModel)
      .where(eq(checklistDetailsModel.checklistMasterId, checklistMasterId))

    await tx
      .delete(checklistMasterModel)
      .where(eq(checklistMasterModel.checklistMasterId, checklistMasterId))

    return true
  })
}

export const completeChecklist = async (
  checklistMasterId: number
) => {
  const existing = await db
    .select()
    .from(checklistMasterModel)
    .where(eq(checklistMasterModel.checklistMasterId, checklistMasterId))
    .limit(1)

  if (!existing.length) {
    throw new Error('Checklist not found')
  }

  await db
    .update(checklistMasterModel)
    .set({
      isComplete: true,
    })
    .where(eq(checklistMasterModel.checklistMasterId, checklistMasterId))

  const [updated] = await db
    .select()
    .from(checklistMasterModel)
    .where(eq(checklistMasterModel.checklistMasterId, checklistMasterId))
    .limit(1)

  return updated
}