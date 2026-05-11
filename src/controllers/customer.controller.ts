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
) => {
  try {
    requirePermission(req, 'edit_customer')
    const { customerId } = req.params

    const customer = await activateCustomer(Number(customerId))
    res.json({ status: 'success', data: customer })
  } catch (err) {
    next(err)
  }
}
