import { db } from '../config/database'
import { NewWorkStation, workStationModel } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createWorkStation = async (data: NewWorkStation) => {
  await db.insert(workStationModel).values(data)

  const [costCenter] = await db
    .select()
    .from(workStationModel)
    .orderBy(workStationModel.workStationId)
    .limit(1)

  return costCenter
}

// READ ALL
export const getWorkStations = async (tenantId: number) => {
  return await db
    .select()
    .from(workStationModel)
    .where(eq(workStationModel.tenantId, tenantId))
}

// READ ONE
export const getWorkStationById = async (workStationId: number) => {
  const [workStation] = await db
    .select()
    .from(workStationModel)
    .where(eq(workStationModel.workStationId, workStationId))

  return workStation
}

// UPDATE
export const updateWorkStation = async (
  workStationId: number,
  workStationName: string,
  workStationNumber: number,
  updatedBy: number
) => {
  await db
    .update(workStationModel)
    .set({ workStationName, workStationNumber, updatedBy })
    .where(eq(workStationModel.workStationId, workStationId))

  const [updated] = await db
    .select()
    .from(workStationModel)
    .where(eq(workStationModel.workStationId, workStationId))

  return updated
}

// DELETE
export const deleteWorkStation = async (workStationId: number) => {
  await db
    .delete(workStationModel)
    .where(eq(workStationModel.workStationId, workStationId))
}
