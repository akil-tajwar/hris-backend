import { Request, Response } from 'express'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  deleteEmployee,
  getEmployeeIdByUserIdService,
  updateEmployees,
} from '../services/employees.service'

/* ================================
   CREATE EMPLOYEE
================================ */
export const createEmployeeController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'create_employee')

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[]
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`

    const payload = Array.isArray(req.body) ? req.body : [req.body]
    const results = []

    for (const item of payload) {
      const tenantId = req.user?.tenantId
      const employeeDetails = {
        ...(typeof item.employeeDetails === 'string'
          ? JSON.parse(item.employeeDetails)
          : item.employeeDetails),
        tenantId,
      }

      const userData = {
        ...(typeof item.userData === 'string'
          ? JSON.parse(item.userData)
          : item.userData),
        tenantId,
      }

      // files mapping
      if (files?.photoUrl?.[0]) {
        employeeDetails.photoUrl = `${baseUrl}${files.photoUrl[0].filename}`
      }

      if (files?.cvUrl?.[0]) {
        employeeDetails.cvUrl = `${baseUrl}${files.cvUrl[0].filename}`
      }

      if (files?.certificateUrl?.[0]) {
        employeeDetails.certificateUrl = `${baseUrl}${files.certificateUrl[0].filename}`
      }

      const employee = await createEmployee({
        employeeData: employeeDetails,
        userData,
      })
      results.push(employee)
    }

    res.status(201).json({
      success: true,
      data: Array.isArray(req.body) ? results : results[0],
    })
  } catch (error: any) {
    console.error('❌ Employee creation error:', error)
    res.status(400).json({
      success: false,
      message: error.message || 'Something went wrong',
    })
  }
}

/* ================================
   UPDATE EMPLOYEE
================================ */
export const updateEmployeeController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'edit_employee')

    const employeeDetailsList =
      typeof req.body.employeeDetails === 'string'
        ? JSON.parse(req.body.employeeDetails)
        : req.body.employeeDetails

    // employeeDetailsList is now an array, each item must include its own employeeId
    employeeDetailsList.forEach((emp: any) => {
      if (files?.[`photoUrl_${emp.employeeId}`]?.[0]) {
        emp.photoUrl = `${baseUrl}${files[`photoUrl_${emp.employeeId}`][0].filename}`
      }
      if (files?.[`cvUrl_${emp.employeeId}`]?.[0]) {
        emp.cvUrl = `${baseUrl}${files[`cvUrl_${emp.employeeId}`][0].filename}`
      }
      if (files?.[`certificateUrl_${emp.employeeId}`]?.[0]) {
        emp.certificateUrl = `${baseUrl}${files[`certificateUrl_${emp.employeeId}`][0].filename}`
      }
    })

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[]
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`

    const employeeDetails =
      typeof req.body.employeeDetails === 'string'
        ? JSON.parse(req.body.employeeDetails)
        : req.body.employeeDetails

    if (files?.photoUrl?.[0]) {
      employeeDetails.photoUrl = `${baseUrl}${files.photoUrl[0].filename}`
    }

    if (files?.cvUrl?.[0]) {
      employeeDetails.cvUrl = `${baseUrl}${files.cvUrl[0].filename}`
    }

    if (files?.certificateUrl?.[0]) {
      employeeDetails.certificateUrl = `${baseUrl}${files.certificateUrl[0].filename}`
    }

    const updatedEmployees = await updateEmployees(employeeDetailsList)

    res.json({
      success: true,
      data: updatedEmployees,
    })
  } catch (error: any) {
    console.error('❌ Employee update error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
}

/* ================================
   GET ALL EMPLOYEES
================================ */
export const getAllEmployeesController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_employee')

    const tenantId = req.user?.tenantId
    if (tenantId === undefined) {
      throw new Error('Tenant ID is required')
    }
    const data = await getAllEmployees(tenantId)
    res.json(data)
  } catch (error) {
    console.error('Get All Employees Error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error',
    })
  }
}

/* ================================
   GET EMPLOYEE BY ID
================================ */
export const getEmployeeByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    requirePermission(req, 'view_employee')

    const employeeId = Number(req.params.id)
    if (!employeeId) {
      res.status(400).json({ message: 'Invalid employee ID' })
    }

    const data = await getEmployeeById(employeeId)

    if (!data) {
      res.status(404).json({ success: false, message: 'Employee not found' })
    }

    res.json(data)
  } catch (error) {
    console.error('Get Employee By ID Error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error',
    })
  }
}

/* ================================
   DELETE EMPLOYEE
================================ */
export const deleteEmployeeController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'delete_employee')

    const employeeId = Number(req.params.id)
    if (!employeeId) {
      res.status(400).json({ message: 'Invalid employee ID' })
    }

    const result = await deleteEmployee(employeeId)
    res.status(200).json(result)
  } catch (error: any) {
    console.error('Delete Employee Error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    })
  }
}

export const getEmployeeIdByUserIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = Number(req.params.userId)
    console.log(
      '🚀 ~ getEmployeeIdByUserIdController ~ req.params.userId:',
      req.params.userId
    )
    console.log('🚀 ~ getEmployeeIdByUserIdController ~ userId:', userId)

    if (!userId) {
      res.status(400).json({ message: 'Invalid userId' })
    }

    const employeeId = await getEmployeeIdByUserIdService(Number(userId))

    res.status(200).json(employeeId)
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || 'Something went wrong',
    })
  }
}
