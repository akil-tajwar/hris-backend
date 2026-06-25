import { db } from '../config/database'
import { NewCustomer, companyModel, customerModel } from '../schemas'
import { eq, sql } from 'drizzle-orm'
import { Resend } from 'resend'

// CREATE
const resend = new Resend(process.env.RESEND_API_KEY)

export const createCustomer = async (data: NewCustomer) => {
  return await db.transaction(async (tx) => {
    // create customer
    const [result] = await tx.insert(customerModel).values({
      ...data,
      isActive: false,
    })

    const customerId = result.insertId

    // get created customer
    const [customer] = await tx
      .select()
      .from(customerModel)
      .where(eq(customerModel.customerId, customerId))

    if (!customer) {
      throw new Error('Customer creation failed')
    }

    // get company email
    if (customer.companyId) {
      const [company] = await tx
        .select({
          email: companyModel.email,
          companyName: companyModel.companyName,
        })
        .from(companyModel)
        .where(eq(companyModel.companyId, customer.companyId))

      if (company?.email) {
        const activationLink = `${process.env.BASE_URL}/api/customers/activate-customer/${customer.customerId}`

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: company.email,
          subject: 'Activate Customer Account',
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Customer Activation Required</h2>

              <p>
                A new customer has been created under your company.
              </p>

              <p>
                <strong>Customer Name:</strong> ${customer.customerName}
              </p>

              <p>
                Please click the button below to activate this customer.
              </p>

              <a
                href="${activationLink}"
                style="
                  display: inline-block;
                  padding: 12px 20px;
                  background-color: #2563eb;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: bold;
                "
              >
                Activate Customer
              </a>
            </div>
          `,
        })
      }
    }

    return customer
  })
}

// READ ALL
export const getCustomers = async (tenantId: number) => {
  return await db
    .select()
    .from(customerModel)
    .where(eq(customerModel.tenantId, tenantId))
}

// UPDATE
export const updateCustomer = async (
  data: NewCustomer & { customerId: number }
) => {
  await db
    .update(customerModel)
    .set(data)
    .where(eq(customerModel.customerId, data.customerId))

  const [updated] = await db
    .select()
    .from(customerModel)
    .where(eq(customerModel.customerId, data.customerId))

  return updated
}

// DELETE
export const deleteCustomer = async (customerId: number) => {
  await db.delete(customerModel).where(eq(customerModel.customerId, customerId))
}

//Active Customer
export const activateCustomer = async (customerId: number) => {
  await db
    .update(customerModel)
    .set({
      isActive: true,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(customerModel.customerId, customerId))

  const [activated] = await db
    .select()
    .from(customerModel)
    .where(eq(customerModel.customerId, customerId))

  return activated
}
