import { eq } from 'drizzle-orm'

import {
  officeLocationsModel,
  NewOfficeLocation,
  companyModel,
} from '../schemas'
import { db } from '../config/database'
import { BadRequestError } from './utils/errors.utils'

export const createOfficeLocation = async (
  officeLocationData: Omit<NewOfficeLocation, 'createdAt' | 'updatedAt'>
) => {
  try {
    const [newOfficeLocation] = await db
      .insert(officeLocationsModel)
      .values({
        ...officeLocationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute()
    return newOfficeLocation
  } catch (error) {
    throw error
  }
}

export const getAllOfficeLocations = async (tenantId: number) => {
  const officeLocations = await db
    .select({
      officeLocationId: officeLocationsModel.officeLocationId,
      companyId: officeLocationsModel.companyId,
      companyName: companyModel.companyName,
      address: officeLocationsModel.address,
      latitude: officeLocationsModel.latitude,
      longitude: officeLocationsModel.longitude,
      radiusMeters: officeLocationsModel.radiusMeters,
      tenantId: officeLocationsModel.tenantId,
      createdBy: officeLocationsModel.createdBy,
      createdAt: officeLocationsModel.createdAt,
      updatedBy: officeLocationsModel.updatedBy,
      updatedAt: officeLocationsModel.updatedAt,
    })
    .from(officeLocationsModel)
    .leftJoin(
      companyModel,
      eq(officeLocationsModel.companyId, companyModel.companyId)
    )
    .where(eq(officeLocationsModel.tenantId, tenantId))

  if (!officeLocations.length) {
    throw BadRequestError('No office locations found')
  }

  return officeLocations
}

export const updateOfficeLocation = async (
  officeLocationId: number,
  officeLocationData: Partial<
    Omit<NewOfficeLocation, 'createdAt' | 'updatedAt'>
  >
) => {
  // Remove any timestamp fields that might be in the update data
  const { createdAt, updatedAt, ...cleanData } = officeLocationData as any

  const [updatedOfficeLocation] = await db
    .update(officeLocationsModel)
    .set({
      ...cleanData,
      updatedAt: new Date(), // Only update this timestamp
    })
    .where(eq(officeLocationsModel.officeLocationId, officeLocationId))
    .execute()

  if (!updatedOfficeLocation) {
    throw new Error('Asset category not found or update failed')
  }

  return updatedOfficeLocation
}

export const deleteOfficeLocation = async (officeLocationId: number) => {
  await db
    .delete(officeLocationsModel)
    .where(eq(officeLocationsModel.officeLocationId, officeLocationId))
}
