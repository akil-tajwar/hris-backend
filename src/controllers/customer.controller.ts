import { Request, Response, NextFunction } from 'express'
import {
  createCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
  activateCustomer,
} from '../services/customer.service'
import { requirePermission } from '../services/utils/jwt.utils'

export const createCustomerController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'create_customer')
    const customer = await createCustomer(req.body)
    res.status(201).json({
      status: 'success',
      data: customer,
    })
  } catch (err) {
    next(err)
  }
}

export const getCustomersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'view_customer')
    const customers = await getCustomers()
    res.json(customers)
  } catch (err) {
    next(err)
  }
}

export const updateCustomerController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'edit_customer')
    const { customerId } = req.params
    const { customerName, updatedBy } = req.body

    const customer = await updateCustomer(
      Number(customerId),
      customerName,
      updatedBy
    )
    res.json({ status: 'success', data: customer })
  } catch (err) {
    next(err)
  }
}

export const deleteCustomerController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    requirePermission(req, 'delete_customer')
    const { customerId } = req.params
    await deleteCustomer(Number(customerId))
    res.json({ status: 'success', message: 'Customer deleted' })
  } catch (err) {
    next(err)
  }
}

export const activateCustomerController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { customerId } = req.params

    const customer = await activateCustomer(Number(customerId))

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Activated</title>

        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background: #f3f4f6;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }

          .card {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
          }

          .success {
            color: #16a34a;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 16px;
          }

          .text {
            color: #374151;
            font-size: 16px;
          }
        </style>
      </head>

      <body>
        <div class="card">
          <div class="success">
            Customer Activated Successfully
          </div>

          <div class="text">
            Customer "${customer?.customerName}" is now active.
          </div>
        </div>
      </body>
      </html>
    `)
  } catch (err) {
    next(err)
  }
}
