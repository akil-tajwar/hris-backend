import { db } from '../config/database'
import { workStationModel } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createWorkStation = async (
  workStationId: number,
  workStationName: string,
  workStationNumber: number,
  createdBy: number
) => {
  await db.insert(workStationModel).values({
    workStationName,
    workStationId,
    workStationNumber,
    createdBy,
  })

  const [workStation] = await db
    .select()
    .from(workStationModel)
    .orderBy(workStationModel.workStationId)
    .limit(1)

  return workStation
}

// READ ALL
export const getWorkStations = async () => {
  return await db.select().from(workStationModel)
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
    .set({ workStationName, workStationId, workStationNumber, updatedBy })
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
