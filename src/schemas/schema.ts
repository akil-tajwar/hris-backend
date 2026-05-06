import { relations, sql } from 'drizzle-orm'
import { boolean, date, double } from 'drizzle-orm/mysql-core'
import {
  mysqlTable,
  int,
  text,
  timestamp,
  mysqlEnum,
  varchar,
} from 'drizzle-orm/mysql-core'

// ========================
// Roles & Permissions
// ========================
export const roleModel = mysqlTable('roles', {
  roleId: int('role_id').primaryKey(),
  roleName: varchar('role_name', { length: 50 }).notNull(),
})

export const userModel = mysqlTable('users', {
  userId: int('user_id').primaryKey().autoincrement(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('PASSWORD', { length: 255 }).notNull(),
  active: boolean('active').notNull().default(true),
  roleId: int('role_id').references(() => roleModel.roleId, {
    onDelete: 'set null',
  }),
  isPasswordResetRequired: boolean('is_password_reset_required').default(true),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow(),
})

export const permissionsModel = mysqlTable('permissions', {
  id: int('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
})

export const rolePermissionsModel = mysqlTable('role_permissions', {
  roleId: int('role_id').references(() => roleModel.roleId),
  permissionId: int('permission_id')
    .notNull()
    .references(() => permissionsModel.id),
})

export const userRolesModel = mysqlTable('user_roles', {
  userId: int('user_id')
    .notNull()
    .references(() => userModel.userId),
  roleId: int('role_id')
    .notNull()
    .references(() => roleModel.roleId),
})

// ========================
// Business Tables
// ========================
export const departmentModel = mysqlTable('departments', {
  departmentId: int('department_id').primaryKey().autoincrement(),
  departmentName: varchar('department_name', { length: 50 }).notNull(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const designationModel = mysqlTable('designations', {
  designationId: int('designation_id').primaryKey().autoincrement(),
  designationName: varchar('designation_name', { length: 50 }).notNull(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const companyModel = mysqlTable('companies', {
  companyId: int('company_id').primaryKey().autoincrement(),
  companyName: varchar('company_name', { length: 100 }).notNull(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const workStationModel = mysqlTable('work_stations', {
  workStationId: int('work_station_id').primaryKey().autoincrement(),
  workStationNumber: int('work_station_number').notNull(),
  workStationName: varchar('work_station_name', { length: 100 }).notNull(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const divisionModel = mysqlTable('divisions', {
  divisionId: int('division_id').primaryKey().autoincrement(),
  divisionName: varchar('division_name', { length: 100 }).notNull(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const costCenterModel = mysqlTable('cost_centers', {
  costCenterId: int('cost_center_id').primaryKey().autoincrement(),
  costCenterName: varchar('cost_center_name', { length: 100 }).notNull(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const reportingAuthorityModel = mysqlTable('reporting_authorities', {
  reportingAuthorityId: int('reporting_authority_id')
    .primaryKey()
    .autoincrement(),
  reportingAuthorityName: varchar('reporting_authority_name', {
    length: 100,
  }).notNull(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const employeeTypeModel = mysqlTable('employee_types', {
  employeeTypeId: int('employee_type_id').primaryKey().autoincrement(),
  employeeTypeName: varchar('employee_type_name', { length: 50 }).notNull(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const employeeModel = mysqlTable('employees', {
  employeeId: int('employee_id').primaryKey().autoincrement(),
  empCode: varchar('emp_code', { length: 10 }).notNull().unique(),
  empFullName: varchar('emp_full_name', { length: 100 }).notNull(),
  empShortName: varchar('emp_short_name', { length: 20 }),
  dob: date('dob').notNull(),
  doj: date('doj').notNull(),
  doc: date('doc'),
  gender: mysqlEnum('gender', ['Male', 'Female']).notNull(),
  nationalIdNo: varchar('national_id_no', { length: 50 }),
  nationality: mysqlEnum('nationality', [
    'Bangladeshi',
    'Pakistani',
    'Indian',
    'British',
    'American',
  ]),
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),
  zipCode: varchar('zip_code', { length: 20 }),
  workEmail: varchar('workEmail', { length: 100 }),
  privateEmail: varchar('private_email', { length: 100 }),
  homePhone: varchar('home_phone', { length: 20 }),
  personalPhone: varchar('personal_phone', { length: 20 }),
  officialPhone: varchar('official_phone', { length: 20 }).notNull().unique(),
  presentAddress: varchar('present_address', { length: 255 }).notNull(),
  permanentAddress: varchar('permanent_address', { length: 255 }),
  emergencyContactName: varchar('emergency_contact_name', { length: 100 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
  emergencyContactRelation: varchar('emergency_contact_relation', {
    length: 50,
  }),
  maritalStatus: mysqlEnum('marital_status', ['Single', 'Married']),
  photoUrl: varchar('photo_url', { length: 255 }),
  cvUrl: varchar('cv_url', { length: 255 }),
  religion: varchar('religiion', { length: 20 }),
  bloodGroup: mysqlEnum('blood_group', [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
  ]),
  qualification: mysqlEnum('qualification', [
    'SSC',
    'HSC',
    'Graduate',
    'Postgraduate',
  ]).notNull(),
  instituteName: varchar('institute_name', { length: 255 }),
  subjectName: varchar('subject_name', { length: 255 }),
  startDate: date('start_date'),
  endDate: date('end_date'),
  result: varchar('result', { length: 50 }),
  certificateUrl: varchar('certificate_url', { length: 255 }),
  basicSalary: double('basic_salary').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  dependentsName: varchar('dependents_name', { length: 255 }),
  dependentRelation: varchar('dependent_relation', { length: 50 }),
  departmentId: int('department_id')
    .references(() => departmentModel.departmentId)
    .notNull(),
  designationId: int('designation_id')
    .references(() => designationModel.designationId)
    .notNull(),
  employeeTypeId: int('employee_type_id')
    .references(() => employeeTypeModel.employeeTypeId)
    .notNull(),
  officeTimingId: int('office_timing_id')
    .references(() => officeTimingModel.officeTimingId)
    .notNull(),
  companyId: int('company_id')
    .references(() => companyModel.companyId)
    .notNull(),
  workStationId: int('work_station_id')
    .references(() => workStationModel.workStationId)
    .notNull(),
  divisionId: int('division_id')
    .references(() => divisionModel.divisionId)
    .notNull(),
  costCenterId: int('cost_center_id')
    .references(() => costCenterModel.costCenterId)
    .notNull(),
  reportingAuthorityId: int('reporting_authority_id').references(
    () => reportingAuthorityModel.reportingAuthorityId
  ),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const weekendModel = mysqlTable('weekends', {
  weekendId: int('weekend_id').primaryKey().autoincrement(),
  day: mysqlEnum('day', [
    'Saturday',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]).notNull(),
})

export const officeTimingModel = mysqlTable('office_timing', {
  officeTimingId: int('office_timing_id').primaryKey().autoincrement(),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  endTime: varchar('end_time', { length: 10 }).notNull(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const officeTimingWeekendsModel = mysqlTable('office_timing_weekends', {
  officeTimingWeekendId: int('office_timing_weekend_id')
    .primaryKey()
    .autoincrement(),
  officeTimingId: int('office_timing_id')
    .notNull()
    .references(() => officeTimingModel.officeTimingId, {
      onDelete: 'cascade',
    }),
  weekendId: int('weekend_id')
    .notNull()
    .references(() => weekendModel.weekendId, { onDelete: 'cascade' }),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const holidayModel = mysqlTable('holidays', {
  holidayId: int('holiday_id').primaryKey().autoincrement(),
  holidayName: varchar('holiday_name', { length: 100 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  noOfDays: int('no_of_days').notNull(),
  description: text('description'),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const leaveTypeModel = mysqlTable('leave_types', {
  leaveTypeId: int('leave_type_id').primaryKey().autoincrement(),
  leaveTypeName: varchar('leave_type_name', { length: 100 }).notNull(),
  totalLeaves: int('total_leaves').notNull(),
  yearPeriod: int('year_period').notNull(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

//to track which leave types are assigned to which employees
export const employeeLeaveTypeModel = mysqlTable('employee_leave_types', {
  employeeLeaveTypeId: int('employee_leave_type_id')
    .primaryKey()
    .autoincrement(),
  employeeId: int('employee_id')
    .notNull()
    .references(() => employeeModel.employeeId, { onDelete: 'cascade' }),

  leaveTypeId: int('leave_type_id')
    .notNull()
    .references(() => leaveTypeModel.leaveTypeId, { onDelete: 'cascade' }),
})

// to track leaves taken by employees
export const employeeLeaveModel = mysqlTable('employee_leaves', {
  employeeLeaveId: int('employee_leave_id').primaryKey().autoincrement(),
  employeeId: int('employee_id')
    .notNull()
    .references(() => employeeModel.employeeId, { onDelete: 'cascade' }),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  noOfDays: int('no_of_days').notNull(),
  leaveTypeId: int('leave_type_id')
    .notNull()
    .references(() => leaveTypeModel.leaveTypeId, {
      onDelete: 'cascade',
    }),
  description: text('description'),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const employeeAttendanceModel = mysqlTable('employee_attendances', {
  employeeAttendanceId: int('employee_attendance_id')
    .primaryKey()
    .autoincrement(),
  employeeId: int('employee_id')
    .notNull()
    .references(() => employeeModel.employeeId, { onDelete: 'cascade' }),
  attendanceDate: date('attendance_date').notNull(),
  inTime: varchar('in_time', { length: 10 }),
  outTime: varchar('out_time', { length: 10 }),
  lateInMinutes: int('late_in_minutes'),
  earlyOutMinutes: int('early_out_minutes'),
  isAbsent: boolean('is_absent').notNull().default(false),
  isLeave: boolean('is_leave').notNull().default(false),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const otherSalaryComponentsModel = mysqlTable(
  'other_salary_components',
  {
    otherSalaryComponentId: int('other_salary_component_id')
      .primaryKey()
      .autoincrement(),
    componentName: text('component_name').notNull(),
    componentType: mysqlEnum('component_type', [
      'Allowance',
      'Deduction',
    ]).notNull(),
    amount: double('amount').notNull(),
    forDays: int('for_days').notNull(),
    status: int('status').notNull().default(1),
    isAbsentFee: boolean('is_absent_fee').notNull().default(false),
    isLoneFee: boolean('is_lone_fee').notNull().default(false),
    isLateEarlyOutFee: boolean('is_late_early_out_fee')
      .notNull()
      .default(false),
    createdBy: int('created_by').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedBy: int('updated_by'),
    updatedAt: timestamp('updated_at').default(
      sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    ),
  }
)

export const employeeOtherSalaryComponentsModel = mysqlTable(
  'employee_other_salary_components',
  {
    employeeOtherSalaryComponentId: int('employee_other_salary_component_id')
      .primaryKey()
      .autoincrement(),
    employeeId: int('employee_id')
      .notNull()
      .references(() => employeeModel.employeeId, { onDelete: 'cascade' }),
    otherSalaryComponentId: int('other_salary_component_id')
      .notNull()
      .references(() => otherSalaryComponentsModel.otherSalaryComponentId, {
        onDelete: 'cascade',
      }),
    employeeLoneId: int('employee_lone_id').references(
      () => employeeLoneModel.employeeLoneId,
      { onDelete: 'set null' }
    ),
    salaryMonth: mysqlEnum('salary_month', [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]).notNull(),
    salaryYear: int('salary_year').notNull(),
    amount: double('amount').notNull(),
    isAuthorized: boolean('is_authorized').notNull().default(false),
    isSkipped: boolean('is_skipped').notNull().default(false),
    isSalaryGiven: boolean('is_salary_given').notNull().default(false),
    createdBy: int('created_by').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedBy: int('updated_by'),
    updatedAt: timestamp('updated_at').default(
      sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    ),
  }
)

export const salaryModel = mysqlTable('salary', {
  salaryId: int('salary_id').primaryKey().autoincrement(),
  salaryMonth: mysqlEnum('salary_month', [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]).notNull(),
  salaryYear: int('salary_year').notNull(),
  employeeId: int('employee_id')
    .notNull()
    .references(() => employeeModel.employeeId, { onDelete: 'cascade' }),
  departmentId: int('department_id')
    .references(() => departmentModel.departmentId, { onDelete: 'cascade' })
    .notNull(),
  designationId: int('designation_id')
    .references(() => designationModel.designationId, { onDelete: 'cascade' })
    .notNull(),
  basicSalary: double('basic_salary').notNull(),
  grossSalary: double('gross_salary').notNull(),
  netSalary: double('net_salary').notNull(),
  doj: text('doj').notNull(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const employeeLoneModel = mysqlTable('employee_lones', {
  employeeLoneId: int('employee_lone_id').primaryKey().autoincrement(),
  employeeLoneName: text('employee_lone_name').notNull(),
  employeeId: int('employee_id')
    .notNull()
    .references(() => employeeModel.employeeId, { onDelete: 'cascade' }),
  amount: double('amount').notNull(),
  perMonth: int('per_month').notNull(),
  loneDate: date('lone_date').notNull(),
  description: text('description'),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

// ========================
// Relations (unchanged)
// ========================
export const userRelations = relations(userModel, ({ one }) => ({
  role: one(roleModel, {
    fields: [userModel.roleId],
    references: [roleModel.roleId],
  }),
}))

export const roleRelations = relations(roleModel, ({ many }) => ({
  rolePermissions: many(rolePermissionsModel),
}))

export const rolePermissionsRelations = relations(
  rolePermissionsModel,
  ({ one }) => ({
    role: one(roleModel, {
      fields: [rolePermissionsModel.roleId],
      references: [roleModel.roleId],
    }),
    permission: one(permissionsModel, {
      fields: [rolePermissionsModel.permissionId],
      references: [permissionsModel.id],
    }),
  })
)

export const userRolesRelations = relations(userRolesModel, ({ one }) => ({
  user: one(userModel, {
    fields: [userRolesModel.userId],
    references: [userModel.userId],
  }),
  role: one(roleModel, {
    fields: [userRolesModel.roleId],
    references: [roleModel.roleId],
  }),
}))

export const employeeRelations = relations(employeeModel, ({ one }) => ({
  department: one(departmentModel, {
    fields: [employeeModel.departmentId],
    references: [departmentModel.departmentId],
  }),
  designation: one(designationModel, {
    fields: [employeeModel.designationId],
    references: [designationModel.designationId],
  }),
  employeeType: one(employeeTypeModel, {
    fields: [employeeModel.employeeTypeId],
    references: [employeeTypeModel.employeeTypeId],
  }),
  officeTiming: one(officeTimingModel, {
    fields: [employeeModel.officeTimingId],
    references: [officeTimingModel.officeTimingId],
  }),
  company: one(companyModel, {
    fields: [employeeModel.companyId],
    references: [companyModel.companyId],
  }),
  workStation: one(workStationModel, {
    fields: [employeeModel.workStationId],
    references: [workStationModel.workStationId],
  }),
  division: one(divisionModel, {
    fields: [employeeModel.divisionId],
    references: [divisionModel.divisionId],
  }),
  costCenter: one(costCenterModel, {
    fields: [employeeModel.costCenterId],
    references: [costCenterModel.costCenterId],
  }),
  reportingAuthority: one(reportingAuthorityModel, {
    fields: [employeeModel.reportingAuthorityId],
    references: [reportingAuthorityModel.reportingAuthorityId],
  }),
}))

export const officeTimingWeekendRelations = relations(
  officeTimingWeekendsModel,
  ({ one }) => ({
    officeTiming: one(officeTimingModel, {
      fields: [officeTimingWeekendsModel.officeTimingId],
      references: [officeTimingModel.officeTimingId],
    }),
    weekend: one(weekendModel, {
      fields: [officeTimingWeekendsModel.weekendId],
      references: [weekendModel.weekendId],
    }),
  })
)

export const employeeLeaveTypeRelations = relations(
  employeeLeaveTypeModel,
  ({ one }) => ({
    employee: one(employeeModel, {
      fields: [employeeLeaveTypeModel.employeeId],
      references: [employeeModel.employeeId],
    }),
    leaveType: one(leaveTypeModel, {
      fields: [employeeLeaveTypeModel.leaveTypeId],
      references: [leaveTypeModel.leaveTypeId],
    }),
  })
)

export const employeeLeaveRelations = relations(
  employeeLeaveModel,
  ({ one }) => ({
    employee: one(employeeModel, {
      fields: [employeeLeaveModel.employeeId],
      references: [employeeModel.employeeId],
    }),
    leaveType: one(leaveTypeModel, {
      fields: [employeeLeaveModel.leaveTypeId],
      references: [leaveTypeModel.leaveTypeId],
    }),
  })
)

export const employeeAttendanceRelations = relations(
  employeeAttendanceModel,
  ({ one }) => ({
    employee: one(employeeModel, {
      fields: [employeeAttendanceModel.employeeId],
      references: [employeeModel.employeeId],
    }),
  })
)

export const employeeOtherSalaryComponentsRelations = relations(
  employeeOtherSalaryComponentsModel,
  ({ one }) => ({
    employee: one(employeeModel, {
      fields: [employeeOtherSalaryComponentsModel.employeeId],
      references: [employeeModel.employeeId],
    }),
    otherSalaryComponent: one(otherSalaryComponentsModel, {
      fields: [employeeOtherSalaryComponentsModel.otherSalaryComponentId],
      references: [otherSalaryComponentsModel.otherSalaryComponentId],
    }),
    employeeLone: one(employeeLoneModel, {
      fields: [employeeOtherSalaryComponentsModel.employeeLoneId],
      references: [employeeLoneModel.employeeLoneId],
    }),
  })
)

export const salaryRelations = relations(salaryModel, ({ one }) => ({
  employee: one(employeeModel, {
    fields: [salaryModel.employeeId],
    references: [employeeModel.employeeId],
  }),
  department: one(departmentModel, {
    fields: [salaryModel.departmentId],
    references: [departmentModel.departmentId],
  }),
  designation: one(designationModel, {
    fields: [salaryModel.designationId],
    references: [designationModel.designationId],
  }),
}))

export const loneRelations = relations(employeeLoneModel, ({ one }) => ({
  employee: one(employeeModel, {
    fields: [employeeLoneModel.employeeId],
    references: [employeeModel.employeeId],
  }),
}))

// ========================
// Types (unchanged)
// ========================
export type User = typeof userModel.$inferSelect
export type NewUser = typeof userModel.$inferInsert
export type Role = typeof roleModel.$inferSelect
export type NewRole = typeof roleModel.$inferInsert
export type Permission = typeof permissionsModel.$inferSelect
export type NewPermission = typeof permissionsModel.$inferInsert
export type UserRole = typeof userRolesModel.$inferSelect
export type NewUserRole = typeof userRolesModel.$inferInsert
export type RolePermission = typeof rolePermissionsModel.$inferSelect
export type NewRolePermission = typeof rolePermissionsModel.$inferInsert
export type Department = typeof departmentModel.$inferSelect
export type NewDepartment = typeof departmentModel.$inferInsert
export type Designation = typeof designationModel.$inferInsert
export type NewDesignation = typeof designationModel.$inferInsert
export type EmployeeType = typeof employeeTypeModel.$inferSelect
export type NewEmployeeType = typeof employeeTypeModel.$inferInsert
export type Employee = typeof employeeModel.$inferSelect
export type NewEmployee = typeof employeeModel.$inferInsert
export type Weekend = typeof weekendModel.$inferSelect
export type NewWeekend = typeof weekendModel.$inferInsert
export type OfficeTiming = typeof officeTimingModel.$inferSelect
export type NewOfficeTiming = typeof officeTimingModel.$inferInsert
export type Holiday = typeof holidayModel.$inferSelect
export type NewHoliday = typeof holidayModel.$inferInsert
export type LeaveType = typeof leaveTypeModel.$inferSelect
export type NewLeaveType = typeof leaveTypeModel.$inferInsert
export type EmployeeLeaveType = typeof employeeLeaveTypeModel.$inferSelect
export type NewEmployeeLeaveType = typeof employeeLeaveTypeModel.$inferInsert
export type EmployeeLeave = typeof employeeLeaveModel.$inferSelect
export type NewEmployeeLeave = typeof employeeLeaveModel.$inferInsert
export type EmployeeAttendance = typeof employeeAttendanceModel.$inferSelect
export type NewEmployeeAttendance = typeof employeeAttendanceModel.$inferInsert
export type OtherSalaryComponent =
  typeof otherSalaryComponentsModel.$inferSelect
export type NewOtherSalaryComponent =
  typeof otherSalaryComponentsModel.$inferInsert
export type EmployeeOtherSalaryComponent =
  typeof employeeOtherSalaryComponentsModel.$inferSelect
export type NewEmployeeOtherSalaryComponent =
  typeof employeeOtherSalaryComponentsModel.$inferInsert
export type Salary = typeof salaryModel.$inferSelect
export type NewSalary = typeof salaryModel.$inferInsert
export type Lone = typeof employeeLoneModel.$inferSelect
export type NewLone = typeof employeeLoneModel.$inferInsert
