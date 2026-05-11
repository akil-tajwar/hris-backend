import { db } from '../config/database'
import { NewCustomer, customerModel } from '../schemas'
import { eq } from 'drizzle-orm'

// CREATE
export const createCustomer = async (data: NewCustomer) => {
  return await db.transaction(async (tx) => {
    const [result] = await tx.insert(customerModel).values(data)
    const customerId = result.insertId
    
    const [customer] = await tx
      .select()
      .from(customerModel)
      .where(eq(customerModel.customerId, customerId))
    
    return customer
  })
}

// READ ALL
export const getCustomers = async () => {
  return await db.select().from(customerModel)
}

// UPDATE
export const updateCustomer = async (
  customerId: number,
  customerName: string,
  updatedBy: number
) => {
  await db
    .update(customerModel)
    .set({ customerName, updatedBy })
    .where(eq(customerModel.customerId, customerId))

  const [updated] = await db
    .select()
    .from(customerModel)
    .where(eq(customerModel.customerId, customerId))

  return updated
}

// DELETE
export const deleteCustomer = async (customerId: number) => {
  await db
    .delete(customerModel)
    .where(eq(customerModel.customerId, customerId))
}
