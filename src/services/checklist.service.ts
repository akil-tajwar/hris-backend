import { eq, inArray } from 'drizzle-orm'
import { db } from '../config/database'
import {
  checklistMasterModel,
  checklistDetailsModel,
  employeeModel,
  NewChecklistMaster,
  NewChecklistDetails,
} from '../schemas'

type ChecklistInput = {
  checklistMaster: NewChecklistMaster
  checklistDetails: NewChecklistDetails[]
}

export const createChecklistService = async (data: ChecklistInput) => {
  try {
    return await db.transaction(async (tx) => {
      // insert master
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

      // insert details
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
      }
    })
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

export const getAllChecklistsService = async (): Promise<ChecklistInput[]> => {
  // masters
  const masters = await db
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

export const updateChecklistService = async (
  checklistMasterId: number,
  data: ChecklistInput
) => {
  console.log('Update Service Called with:', {
    checklistMasterId,
    masterData: data.checklistMaster,
    detailsData: data.checklistDetails
  });

  return await db.transaction(async (tx) => {
    try {
      // update master
      console.log('Updating master...');
      await tx
        .update(checklistMasterModel)
        .set({
          checklistName: data.checklistMaster.checklistName,
          heading: data.checklistMaster.heading,
          responsibleEmployeeId: data.checklistMaster.responsibleEmployeeId,
          updatedBy: data.checklistMaster.updatedBy,
        })
        .where(eq(checklistMasterModel.checklistMasterId, checklistMasterId))
      
      console.log('Master updated successfully');

      const incomingDetailIds = data.checklistDetails
        .map((item) => item.checklistDetailsId)
        .filter((id): id is number => typeof id === 'number')

      console.log('Incoming detail IDs:', incomingDetailIds);

      const existingDetails = await tx
        .select({
          checklistDetailsId: checklistDetailsModel.checklistDetailsId,
        })
        .from(checklistDetailsModel)
        .where(eq(checklistDetailsModel.checklistMasterId, checklistMasterId))

      const existingIds = existingDetails.map((item) => item.checklistDetailsId)
      console.log('Existing detail IDs:', existingIds);

      const deleteIds = existingIds.filter(
        (id) => !incomingDetailIds.includes(id)
      )
      console.log('IDs to delete:', deleteIds);

      // delete removed details
      if (deleteIds.length > 0) {
        await tx
          .delete(checklistDetailsModel)
          .where(inArray(checklistDetailsModel.checklistDetailsId, deleteIds))
        console.log('Details deleted successfully');
      }

      // insert/update details
      for (const item of data.checklistDetails) {
        console.log('Processing detail item:', item);
        
        if (item.checklistDetailsId) {
          // update
          console.log(`Updating detail with ID: ${item.checklistDetailsId}`);
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
          console.log(`Detail ${item.checklistDetailsId} updated successfully`);
        } else {
          // insert
          console.log('Inserting new detail');
          await tx.insert(checklistDetailsModel).values({
            checklistMasterId,
            checklistDetailsName: item.checklistDetailsName,
            responsibleEmployeeId: item.responsibleEmployeeId,
            createdBy: item.createdBy,
          })
          console.log('New detail inserted successfully');
        }
      }

      console.log('Update transaction completed successfully');
      return true
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  })
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
