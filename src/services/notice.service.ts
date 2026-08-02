import { db } from '../config/database'
import { noticeModel, NewNotice } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
/* ================================
   CREATE NOTICE
================================ */
export const createNotice = async (data: NewNotice) => {
  const insertResult = await db.insert(noticeModel).values({
    ...data,
  })

  const noticeId = Number(insertResult[0].insertId)

  const [notice] = await db
    .select()
    .from(noticeModel)
    .where(eq(noticeModel.noticeId, noticeId))

  return notice
}

/* ================================
   UPDATE NOTICE
================================ */
export const updateNotice = async (
  noticeId: number,
  data: Partial<NewNotice>
) => {
  return await db.transaction(async (tx) => {
    // 🔍 Check existing notice
    const existing = await tx.query.noticeModel.findFirst({
      where: eq(noticeModel.noticeId, noticeId),
    })

    if (!existing) {
      throw new Error('Notice not found')
    }

    // 🔧 Normalize values
    const normalizeValue = (val: any) =>
      val === '' || val === undefined ? null : val

    // 🎯 Dynamic update object
    const updateData: any = {}

    Object.entries(data).forEach(([key, value]) => {
      updateData[key] = normalizeValue(value)
    })

    // 🕒 Updated time and updatedBy
    updateData.updatedAt = new Date()
    if (data.updatedBy) {
      updateData.updatedBy = data.updatedBy
    }

    // ✅ Update
    if (Object.keys(updateData).length > 0) {
      await tx
        .update(noticeModel)
        .set(updateData)
        .where(eq(noticeModel.noticeId, noticeId))
    }

    // 📦 Return updated notice
    const updatedNotice = await tx.query.noticeModel.findFirst({
      where: eq(noticeModel.noticeId, noticeId),
    })

    return updatedNotice
  })
}

// READ ALL
export const getNotices = async (tenantId: number) => {
  return await db
    .select()
    .from(noticeModel)
    .where(eq(noticeModel.tenantId, tenantId))
}

// READ ONE
export const getNoticeById = async (noticeId: number) => {
  const [notice] = await db
    .select()
    .from(noticeModel)
    .where(eq(noticeModel.noticeId, noticeId))

  return notice
}

// DELETE
export const deleteNotice = async (noticeId: number) => {
  await db.delete(noticeModel).where(eq(noticeModel.noticeId, noticeId))
}
