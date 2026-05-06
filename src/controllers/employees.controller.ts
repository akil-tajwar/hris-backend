import { Request, Response } from 'express'
import { requirePermission } from '../services/utils/jwt.utils'
import {
  createEmployee,
  updateEmployee,
  getAllEmployees,
  getEmployeeById,
  deleteEmployee,
  assignLeaveType,
} from '../services/employees.service'

/* ================================
   CREATE EMPLOYEE
================================ */
export const createEmployeeController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'create_employee')
    console.log('FILES 👉', req.files)
    console.log('BODY 👉', req.body)

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[]
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`

    // Normalize payload
    const payload = Array.isArray(req.body) ? req.body : [req.body]

    const results = []

    for (const item of payload) {
      const employeeDetails =
        typeof item.employeeDetails === 'string'
          ? JSON.parse(item.employeeDetails)
          : item.employeeDetails

      // 📸 Photo
      if (files?.photoUrl?.[0]) {
        employeeDetails.photoUrl = `${baseUrl}${files.photoUrl[0].filename}`
      }

      // 📄 CV (PDF)
      if (files?.cvUrl?.[0]) {
        employeeDetails.cvUrl = `${baseUrl}${files.cvUrl[0].filename}`
      }

      // 🔁 Create employee (MUST await)
      const employee = await createEmployee(employeeDetails)
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

    const employeeId = Number(req.params.id)
    if (!employeeId) {
      res.status(400).json({ error: 'Invalid employee ID' })
    }

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[]
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`

    // ✅ Parse employeeDetails EXACTLY like create
    const employeeDetails =
      typeof req.body.employeeDetails === 'string'
        ? JSON.parse(req.body.employeeDetails)
        : req.body.employeeDetails

    // 📸 Photo
    if (files?.photoUrl?.[0]) {
      employeeDetails.photoUrl = `${baseUrl}${files.photoUrl[0].filename}`
    }

    // 📄 CV
    if (files?.cvUrl?.[0]) {
      employeeDetails.cvUrl = `${baseUrl}${files.cvUrl[0].filename}`
    }

    const updatedEmployee = updateEmployee(employeeId, employeeDetails)

    res.json({ success: true, data: updatedEmployee })
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

    const data = await getAllEmployees()
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

export const assignLeaveTypeController = async (req: Request, res: Response) => {
  try {
    requirePermission(req, 'edit_employee')
    const result = await assignLeaveType(req.body)
    res.status(200).json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to assign leave types' })
  }
}