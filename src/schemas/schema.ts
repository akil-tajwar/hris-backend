import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  date,
  double,
  json,
  MySqlTableWithColumns,
} from 'drizzle-orm/mysql-core'
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
    onDelete: 'restrict',
  }),
  tenantId: int('tenant_id').references(() => tenantModel.tenantId, {
    onDelete: 'restrict',
  }),
  email: varchar('email', { length: 50 }).notNull().unique(),
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
export const tenantModel = mysqlTable('tenants', {
  tenantId: int('tenant_id').primaryKey().autoincrement(),
  tenantName: varchar('tenant_name', { length: 100 }).notNull(),
  status: boolean('status').default(true),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const customerModel = mysqlTable('customers', {
  customerId: int('customer_id').primaryKey().autoincrement(),
  customerName: varchar('customer_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 50 }).notNull().unique(),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  isActive: boolean('is_active').default(false),
  companyId: int('company_id').references(() => companyModel.companyId, {
    onDelete: 'restrict',
  }),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const departmentModel: MySqlTableWithColumns<any> = mysqlTable(
  'departments',
  {
    departmentId: int('department_id').primaryKey().autoincrement(),
    departmentName: varchar('department_name', { length: 50 }).notNull(),
    departmentCode: varchar('department_code', { length: 20 }),
    divisionId: int('division_id').references(() => divisionModel.divisionId, {
      onDelete: 'restrict',
    }),
    parentDepartmentId: int('parent_department_id').references(
      () => departmentModel.departmentId,
      {
        onDelete: 'restrict',
      }
    ),
    costCenterId: int('cost_center_id').references(
      () => costCenterModel.costCenterId,
      {
        onDelete: 'restrict',
      }
    ),
    headEmployeeId: int('head_employee_id').references(
      () => employeeModel.employeeId,
      { onDelete: 'restrict' }
    ),
    status: boolean('status').default(true),
    createdBy: int('created_by').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedBy: int('updated_by'),
    updatedAt: timestamp('updated_at').default(
      sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    ),
  }
)

export const designationModel = mysqlTable('designations', {
  designationId: int('designation_id').primaryKey().autoincrement(),
  designationName: varchar('designation_name', { length: 50 }).notNull(),
  designationCode: varchar('designation_code', { length: 20 }),
  jobLevel: int('job_level'),
  description: text('description'),
  status: boolean('status').default(true),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const companyModel = mysqlTable('companies', {
  companyId: int('company_id').primaryKey().autoincrement(),
  code: varchar('code', { length: 50 }),
  companyName: varchar('company_name', { length: 100 }).notNull(),
  shortName: varchar('short_name', { length: 50 }),
  tradeLicense: varchar('trade_license', { length: 100 }),
  tin: varchar('tin', { length: 50 }),
  bin: varchar('bin', { length: 50 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  logoUrl: varchar('logo_url', { length: 500 }),
  timezone: varchar('timezone', { length: 100 }).default('UTC'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  status: boolean('status').default(true),
  createdBy: int('created_by'),
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

export const businessUnitsModel: MySqlTableWithColumns<any> = mysqlTable(
  'business_units',
  {
    businessUnitId: int('business_unit_id').primaryKey().autoincrement(),
    companyId: int('company_id')
      .references(() => companyModel.companyId, { onDelete: 'restrict' })
      .notNull(),
    unitName: varchar('unit_name', { length: 100 }).notNull(),
    unitCode: varchar('unit_code', { length: 50 }),
    description: text('description'),
    headEmployeeId: int('head_employee_id').references(
      () => employeeModel.employeeId,
      { onDelete: 'restrict' }
    ),
    status: boolean('status').default(true),
    createdBy: int('created_by').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedBy: int('updated_by'),
    updatedAt: timestamp('updated_at').default(
      sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    ),
  }
)

export const divisionModel: MySqlTableWithColumns<any> = mysqlTable(
  'divisions',
  {
    divisionId: int('division_id').primaryKey().autoincrement(),
    divisionName: varchar('division_name', { length: 100 }).notNull(),
    divisionCode: varchar('division_code', { length: 50 }),
    description: text('description'),
    businessUnitId: int('business_unit_id').references(
      () => businessUnitsModel.businessUnitId,
      { onDelete: 'restrict' }
    ),
    headEmployeeId: int('head_employee_id').references(
      () => employeeModel.employeeId,
      { onDelete: 'restrict' }
    ),
    status: boolean('status').default(true),
    createdBy: int('created_by').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedBy: int('updated_by'),
    updatedAt: timestamp('updated_at').default(
      sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    ),
  }
)

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

export const employmentTypeModel = mysqlTable('employment_types', {
  employmentTypeId: int('employment_type_id').primaryKey().autoincrement(),
  employmentTypeName: varchar('employment_type_name', { length: 50 }).notNull(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const checklistMasterModel = mysqlTable('checklist_master', {
  checklistMasterId: int('checklist_master_id').primaryKey().autoincrement(),
  checklistName: varchar('checklist_name', { length: 100 }).notNull(),
  heading: varchar('heading', { length: 255 }),
  responsibleEmployeeId: int('responsible_employee_id').references(
    () => employeeModel.employeeId
  ),
  isComplete: boolean('is_complete').notNull().default(false),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const checklistDetailsModel = mysqlTable('checklist_details', {
  checklistDetailsId: int('checklist_details_id').primaryKey().autoincrement(),
  checklistDetailsName: varchar('checklist_details_name', {
    length: 255,
  }).notNull(),
  checklistMasterId: int('checklist_master_id').references(
    () => checklistMasterModel.checklistMasterId
  ),
  responsibleEmployeeId: int('responsible_employee_id').references(
    () => employeeModel.employeeId
  ),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const employeePreboardingModel = mysqlTable('employee_preboarding', {
  preboardingId: int('preboarding_id').primaryKey().autoincrement(),
  preboardNo: varchar('preboard_no', { length: 20 }).notNull().unique(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  gender: mysqlEnum('gender', ['Male', 'Female']).notNull(),
  dob: date('dob').notNull(),
  personalEmail: varchar('personal_email', { length: 100 }).notNull(),
  personalPhone: varchar('personal_phone', { length: 20 }).notNull(),
  tentativeJoiningDate: date('tentative_joining_date').notNull(),
  companyId: int('company_id').references(() => companyModel.companyId),
  departmentId: int('department_id').references(
    () => departmentModel.departmentId
  ),
  designationId: int('designation_id').references(
    () => designationModel.designationId
  ),
  reportingAuthorityId: int('reporting_authority_id').references(
    () => employeeModel.employeeId
  ),
  employmentTypeId: int('employment_type_id').references(
    () => employmentTypeModel.employmentTypeId
  ),
  salaryStructureMasterId: int('salary_structure_master_id').references(
    () => salaryStructureMasterModel.salaryStructureMasterId
  ),
  offeredSalary: double('offered_salary'),
  probationMonths: int('probation_months'),
  isConfirmed: boolean('is_confirmed').notNull().default(false),
  status: varchar('status', { length: 50 }),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const employeePreboardingChecklistModel = mysqlTable(
  'employee_preboarding_checklists',
  {
    employeePreboardingChecklistId: int('employee_preboarding_checklist_id')
      .primaryKey()
      .autoincrement(),
    preboardingId: int('preboarding_id').references(
      () => employeePreboardingModel.preboardingId
    ),
    checklistDetailsId: int('checklist_details_id').references(
      () => checklistDetailsModel.checklistDetailsId
    ),
    responsibleEmployeeId: int('responsible_employee_id').references(
      () => employeeModel.employeeId
    ),
    completionDate: date('completion_date'),
    isComplete: boolean('is_complete').notNull().default(false),
    status: boolean('status').notNull().default(false),
    createdBy: int('created_by').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedBy: int('updated_by'),
    updatedAt: timestamp('updated_at').default(
      sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    ),
  }
)

export const employeeModel = mysqlTable('employees', {
  employeeId: int('employee_id').primaryKey().autoincrement(),
  empCode: varchar('emp_code', { length: 10 }).notNull().unique(),
  userId: int('user_id').references(() => userModel.userId),
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
  workEmail: varchar('work_email', { length: 100 }),
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
  religion: varchar('religion', { length: 20 }),
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
  employmentTypeId: int('employee_type_id')
    .references(() => employmentTypeModel.employmentTypeId)
    .notNull(),
  shiftId: int('shift_id')
    .references(() => shiftModel.shiftId)
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
    salaryStructureMasterId: int('salary_structure_master_id').references(
      () => salaryStructureMasterModel.salaryStructureMasterId
    ),
    leavePolicyMasterId: int('leave_policy_master_id').references(
      () => leavePolicyMasterModel.leavePolicyMasterId
    ),
  reportingAuthorityId: int('reporting_authority_id'),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const employeeLifecycleEvents = mysqlTable('employee_lifecycle_events', {
  employeeLifeCycleId: int('employee_life_cycle_id')
    .autoincrement()
    .primaryKey(),
  employeeId: int('employee_id')
    .references(() => employeeModel.employeeId)
    .notNull(),
  eventDate: date('event_date').notNull(),
  employeeEventType: mysqlEnum('employee_event_type', [
    'JOINING',
    'PROBATION_START',
    'PROBATION_EXTEND',
    'CONFIRMATION',

    'DESIGNATION_CHANGE',
    'DEPARTMENT_CHANGE',
    'LOCATION_CHANGE',
    'REPORTING_MANAGER_CHANGE',

    'EMPLOYMENT_TYPE_CHANGE',

    'SHIFT_CHANGE',
    'ATTENDANCE_POLICY_CHANGE',
    'LEAVE_POLICY_CHANGE',

    'SALARY_STRUCTURE_CHANGE',
    'SALARY_REVISION',
    'ALLOWANCE_CHANGE',

    'PROMOTION',
    'DEMOTION',
    'TRANSFER',

    'WARNING',
    'SUSPENSION',

    'RESIGNATION',
    'TERMINATION',
    'RETIREMENT',

    'REJOIN',

    'ASSET_ASSIGNED',
    'ASSET_RETURNED',
  ]),

  effectiveFrom: date('effective_from'),
  remarks: text('remarks'),
  performedBy: int('performed_by').references(() => employeeModel.employeeId),
  approvedBy: int('approved_by').references(() => employeeModel.employeeId),
  referenceType: varchar('reference_type', {
    length: 50,
  }),
  referenceId: int('reference_id'),
  oldValue: json('old_value'),
  newValue: json('new_value'),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const employeeDesignationHistory = mysqlTable(
  'employee_designation_history',
  {
    employeeDesignationHistoryId: int('employee_designation_history_id')
      .autoincrement()
      .primaryKey(),
    employeeId: int('employee_id')
      .references(() => employeeModel.employeeId)
      .notNull(),
    designationId: int('designation_id')
      .references(() => designationModel.designationId)
      .notNull(),
    effectiveFrom: date('effective_from').notNull(),
    effectiveTo: date('effective_to'),
    changeReason: text('change_reason'),
    createdBy: int('created_by').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedBy: int('updated_by'),
    updatedAt: timestamp('updated_at').default(
      sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    ),
  }
)

export const employeeDepartmentHistory = mysqlTable(
  'employee_department_history',
  {
    employeeDepartmentHistoryId: int('employee_department_history_id')
      .autoincrement()
      .primaryKey(),
    employeeId: int('employee_id')
      .references(() => employeeModel.employeeId)
      .notNull(),
    departmentId: int('department_id')
      .references(() => departmentModel.departmentId)
      .notNull(),
    effectiveFrom: date('effective_from').notNull(),
    effectiveTo: date('effective_to'),
    changeReason: text('change_reason'),
    createdBy: int('created_by').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedBy: int('updated_by'),
    updatedAt: timestamp('updated_at').default(
      sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    ),
  }
)

export const employeeSalaryStructureHistory = mysqlTable(
  'employee_salary_structure_history',
  {
    employeeSalaryStructureHistoryId: int(
      'employee_salary_structure_history_id'
    )
      .autoincrement()
      .primaryKey(),
    employeeId: int('employee_id')
      .references(() => employeeModel.employeeId)
      .notNull(),
    salaryStructureMasterId: int('salary_structure_master_id').references(
      () => salaryStructureMasterModel.salaryStructureMasterId
    ),
    effectiveFrom: date('effective_from').notNull(),
    effectiveTo: date('effective_to'),
    changeReason: text('change_reason'),
    createdBy: int('created_by').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedBy: int('updated_by'),
    updatedAt: timestamp('updated_at').default(
      sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    ),
  }
)

export const employeeShiftHistory = mysqlTable('employee_shift_history', {
  employeeShiftHistoryId: int('employee_shift_history_id')
    .autoincrement()
    .primaryKey(),
  employeeId: int('employee_id')
    .references(() => employeeModel.employeeId)
    .notNull(),
  shiftId: int('shift_id').references(() => shiftModel.shiftId),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  changeReason: text('change_reason'),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const employeeLeavePolicyHistory = mysqlTable(
  'employee_leave_policy_history',
  {
    employeeLeavePolicyHistoryId: int('employee_leave_policy_history_id')
      .autoincrement()
      .primaryKey(),
    employeeId: int('employee_id')
      .references(() => employeeModel.employeeId)
      .notNull(),
    leavePolicyId: int('leave_policy_id').references(
      () => leavePolicyMasterModel.leavePolicyMasterId
    ),
    effectiveFrom: date('effective_from').notNull(),
    effectiveTo: date('effective_to'),
    changeReason: text('change_reason'),
    createdBy: int('created_by').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedBy: int('updated_by'),
    updatedAt: timestamp('updated_at').default(
      sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    ),
  }
)

export const employeeEmploymentTypeHistory = mysqlTable(
  'employee_employment_type_history',
  {
    employeeEmploymentTypeHistoryId: int('employee_employment_type_history_id')
      .autoincrement()
      .primaryKey(),
    employeeId: int('employee_id')
      .references(() => employeeModel.employeeId)
      .notNull(),
    employmentTypeId: int('employment_type_id').references(
      () => employmentTypeModel.employmentTypeId
    ),
    effectiveFrom: date('effective_from').notNull(),
    effectiveTo: date('effective_to'),
    changeReason: text('change_reason'),
    createdBy: int('created_by').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedBy: int('updated_by'),
    updatedAt: timestamp('updated_at').default(
      sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    ),
  }
)

export const notificationsModel = mysqlTable('notifications', {
  notificationId: int('notification_id').primaryKey().autoincrement(),
  employeeId: int('employee_id')
    .notNull()
    .references(() => employeeModel.employeeId),
  notification: varchar('notification', { length: 255 }).notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const assetCategoryModel = mysqlTable('asset_categories', {
  assetCategoryId: int('asset_category_id').autoincrement().primaryKey(),
  categoryName: varchar('category_name', {
    length: 100,
  }).notNull(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const assetsModel = mysqlTable('assets', {
  assetId: int('asset_id').autoincrement().primaryKey(),
  assetCode: varchar('asset_code', { length: 50 }).notNull(),
  assetName: varchar('asset_name', { length: 200 }).notNull(),
  categoryId: int('category_id')
    .notNull()
    .references(() => assetCategoryModel.assetCategoryId),
  serialNumber: varchar('serial_number', { length: 100 }),
  purchaseDate: date('purchase_date'),
  purchaseValue: double('purchase_value', {
    precision: 18,
    scale: 2,
  }),
  currentStatus: mysqlEnum('current_status', [
    'AVAILABLE',
    'ASSIGNED',
    'DAMAGE',
    'LOST',
    'SCRAPPED',
  ]).default('AVAILABLE'),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const assetTransactionsModel = mysqlTable('asset_transactions', {
  assetTransactionId: int('asset_transaction_id').autoincrement().primaryKey(),
  assetId: int('asset_id')
    .notNull()
    .references(() => assetsModel.assetId),
  employeeId: int('employee_id'),
  transactionType: mysqlEnum('transaction_type', [
    'ISSUE',
    'RETURN',
    'TRANSFER',
    'LOST',
    'DAMAGE',
    'REPLACEMENT',
  ]).notNull(),
  transactionDate: date('transaction_date').notNull(),
  remarks: text('remarks'),
  approvedBy: int('approved_by'),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const shiftModel = mysqlTable('shift', {
  shiftId: int('shift_id').primaryKey().autoincrement(),
  companyId: int('company_id')
    .references(() => companyModel.companyId)
    .notNull(),
  shiftName: varchar('shift_name', { length: 100 }).notNull(),
  shiftCode: varchar('shift_code', { length: 20 }).notNull(),
  shiftType: mysqlEnum('shift_type', [
    'Fixed',
    'Flexible',
    'Rotational',
  ]).notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  endTime: varchar('end_time', { length: 10 }).notNull(),
  breakMinutes: int('break_minutes').notNull(),
  expectedWorkHours: double('expected_work_hours').notNull(),
  crossDay: boolean('cross_day').notNull().default(false),
  isFlexible: boolean('is_flexible').notNull().default(false),
  flexibleInFrom: varchar('flexible_in_from', { length: 10 }),
  flexibleInTo: varchar('flexible_in_to', { length: 10 }),
  minimumHoursForPresent: double('minimum_hours_for_present').notNull(),
  status: boolean('status').notNull().default(true),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const weekDayModel = mysqlTable('week_days', {
  weekDayId: int('week_day_id').primaryKey().autoincrement(),
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

export const shiftDayAndWeekDaysModel = mysqlTable('shift_day_and_week_days', {
  shiftDayAndWeekDaysId: int('shift_day_and_week_days_id')
    .primaryKey()
    .autoincrement(),
  shiftId: int('shift_id')
    .notNull()
    .references(() => shiftModel.shiftId, {
      onDelete: 'restrict',
    }),
  weekDayId: int('week_day_id')
    .notNull()
    .references(() => weekDayModel.weekDayId, { onDelete: 'restrict' }),
  dayType: mysqlEnum('day_type', ['FullDay', 'HalfDay', 'Weekend']).notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  endTime: varchar('end_time', { length: 10 }).notNull(),
  breakMinutes: int('break_minutes').notNull(),
  expectedWorkHours: double('expected_work_hours').notNull(),
  minimumHoursForPresent: double('minimum_hours_for_present').notNull(),
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
  companyId: int('company_id')
    .references(() => companyModel.companyId)
    .notNull(),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  category: mysqlEnum('category', ['Paid', 'Unpaid', 'Special']).notNull(),
  genderApplicable: mysqlEnum('gender_applicable', ['Male', 'Female', 'All']),
  religionApplicable: boolean('religion_applicable'),
  maritalStatusApplicable: boolean('marital_status_applicable'),
  maxDaysPerYear: double('max_days_per_year').notNull(),
  maxDaysPerRequest: double('max_days_per_request').notNull(),
  minDaysPerRequest: double('min_days_per_request').notNull(),
  allowHalfDay: boolean('allow_half_day').notNull().default(false),
  allowHourly: boolean('allow_hourly').notNull().default(false),
  attachmentRequired: boolean('attachment_required').notNull().default(false),
  attachmentAfterDays: double('attachment_after_days'),
  carryForwardAllowed: boolean('carry_forward_allowed')
    .notNull()
    .default(false),
  maxCarryForwardDays: double('max_carry_forward_days'),
  encashmentAllowed: boolean('encashment_allowed').notNull().default(false),
  negativeBalanceAllowed: boolean('negative_balance_allowed')
    .notNull()
    .default(false),
  sandwichPolicyApplicable: boolean('sandwich_policy_applicable')
    .notNull()
    .default(false),
  probationAllowed: boolean('probation_allowed').notNull().default(true),
  noticePeriodAllowed: boolean('notice_period_allowed').notNull().default(true),
  yearPeriod: int('year_period').notNull(),
  active: boolean('active').notNull().default(true),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const leavePolicyMasterModel = mysqlTable('leave_policy_master', {
  leavePolicyMasterId: int('leave_policy_master_id')
    .primaryKey()
    .autoincrement(),
  companyId: int('company_id')
    .references(() => companyModel.companyId)
    .notNull(),
  policyName: varchar('policy_name', {
    length: 150,
  }).notNull(),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const leavePolicyDetailsModel = mysqlTable('leave_policy_details', {
  leavePolicyDetailsId: int('leave_policy_details_id')
    .primaryKey()
    .autoincrement(),
  leavePolicyMasterId: int('leave_policy_master_id')
    .references(() => leavePolicyMasterModel.leavePolicyMasterId)
    .notNull(),
  leaveTypeId: int('leave_type_id')
    .references(() => leaveTypeModel.leaveTypeId)
    .notNull(),
  yearlyAllocation: double('yearly_allocation').notNull(),
  accrualFrequency: mysqlEnum('accrual_frequency', [
    'Monthly',
    'Quarterly',
    'Yearly',
  ]).notNull(),
  accrualRate: double('accrual_rate').notNull(),
  maxBalanceAllowed: double('max_balance_allowed').notNull(),
  carryForwardLimit: double('carry_forward_limit').notNull(),
  active: boolean('active').notNull().default(true),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const employeeLeaveAssignmentModel = mysqlTable(
  'employee_leave_assignment',
  {
    employeeLeaveAssignmentId: int('employee_leave_assignment_id')
      .primaryKey()
      .autoincrement(),
    employeeId: int('employee_id')
      .references(() => employeeModel.employeeId)
      .notNull(),
    leavePolicyMasterId: int('leave_policy_master_id')
      .references(() => leavePolicyMasterModel.leavePolicyMasterId)
      .notNull(),
    effectiveFrom: date('effective_from').notNull(),
    effectiveTo: date('effective_to'),
    active: boolean('active').notNull().default(true),
    createdBy: int('created_by').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedBy: int('updated_by'),
    updatedAt: timestamp('updated_at').default(
      sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    ),
  }
)

export const employeeAttendanceModel = mysqlTable('employee_attendances', {
  employeeAttendanceId: int('employee_attendance_id')
    .primaryKey()
    .autoincrement(),
  employeeId: int('employee_id')
    .notNull()
    .references(() => employeeModel.employeeId, { onDelete: 'restrict' }),
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

export const salaryComponentsModel = mysqlTable('salary_components', {
  salaryComponentId: int('salary_component_id').primaryKey().autoincrement(),
  componentCode: varchar('component_code', { length: 20 }).notNull(),
  componentName: text('component_name').notNull(),
  calculationType: mysqlEnum('calculation_type', [
    'Fixed',
    'Percentage',
    'Formula',
  ]).notNull(),
  amount: double('amount'),
  percentage: double('percentage'),
  formulaExpression: varchar('formula_expression', { length: 255 }),
  taxable: boolean('taxable').notNull().default(false),
  componentType: mysqlEnum('component_type', [
    'Allowance',
    'Deduction',
  ]).notNull(),
  active: int('active').notNull().default(1), // Changed from 'status' to 'active'
  affectsGross: boolean('affects_gross').notNull().default(false), // Add this
  affectsNet: boolean('affects_net').notNull().default(false), // Add this
  sequenceNo: int('sequence_no').notNull(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const salaryStructureMasterModel = mysqlTable(
  'salary_structure_master',
  {
    salaryStructureMasterId: int('salary_structure_master_id')
      .primaryKey()
      .autoincrement(),
    structureName: varchar('structure_name', { length: 100 }).notNull(),
    structureCode: varchar('structure_code', { length: 20 }),
    companyId: int('company_id')
      .references(() => companyModel.companyId)
      .notNull(),
    structureType: mysqlEnum('structure_type', [
      'Earning',
      'Deduction',
    ]).notNull(),
    effectiveFrom: date('effective_from').notNull(),
    effectiveTo: date('effective_to'),
    active: boolean('active').notNull().default(true),
    createdBy: int('created_by').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedBy: int('updated_by'),
    updatedAt: timestamp('updated_at').default(
      sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    ),
  }
)

export const salaryStructureDetailsModel = mysqlTable(
  'salary_structure_details',
  {
    salaryStructureDetailId: int('salary_structure_detail_id')
      .primaryKey()
      .autoincrement(),
    salaryStructureMasterId: int('salary_structure_master_id')
      .notNull()
      .references(() => salaryStructureMasterModel.salaryStructureMasterId, {
        onDelete: 'restrict',
      }),
    salaryComponentId: int('salary_component_id')
      .notNull()
      .references(() => salaryComponentsModel.salaryComponentId, {
        onDelete: 'restrict',
      }),
    amount: double('amount').notNull(),
    percentage: double('percentage'),
    formulaExpression: varchar('formula_expression', { length: 255 }),
    calculationOrder: int('calculation_order').notNull(),
    mandatory: boolean('mandatory').notNull().default(false),
    createdBy: int('created_by').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedBy: int('updated_by'),
    updatedAt: timestamp('updated_at').default(
      sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    ),
  }
)

//for storing an employees salary data for a particular month and year based on the salary components assigned to them either through salary structure or individually
export const employeeSalaryComponentsModel = mysqlTable(
  'employee_salary_components',
  {
    employeeSalaryComponentId: int('employee_salary_component_id')
      .primaryKey()
      .autoincrement(),
    employeeId: int('employee_id')
      .notNull()
      .references(() => employeeModel.employeeId, { onDelete: 'restrict' }),
    salaryComponentId: int('salary_component_id')
      .notNull()
      .references(() => salaryComponentsModel.salaryComponentId, {
        onDelete: 'restrict',
      }),
    employeeLoneId: int('employee_lone_id').references(
      () => employeeLoneModel.employeeLoneId,
      { onDelete: 'restrict' }
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

//for assigning salary structure to an employee
export const employeeSalaryStructureModel = mysqlTable(
  'employee_salary_structure',
  {
    employeeSalaryStructureId: int('employee_salary_structure_id')
      .primaryKey()
      .autoincrement(),
    employeeId: int('employee_id')
      .notNull()
      .references(() => employeeModel.employeeId, { onDelete: 'restrict' }),
    salaryStructureMasterId: int('salary_structure_master_id')
      .notNull()
      .references(() => salaryStructureMasterModel.salaryStructureMasterId, {
        onDelete: 'restrict',
      }),
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
    .references(() => employeeModel.employeeId, { onDelete: 'restrict' }),
  departmentId: int('department_id')
    .references(() => departmentModel.departmentId, { onDelete: 'restrict' })
    .notNull(),
  designationId: int('designation_id')
    .references(() => designationModel.designationId, { onDelete: 'restrict' })
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
    .references(() => employeeModel.employeeId, { onDelete: 'restrict' }),
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
// Attendance Policy Tables
// ========================
export const attendancePoliciesModel = mysqlTable('attendance_policies', {
  id: int('id').autoincrement().primaryKey(),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  graceMinutes: int('grace_minutes').default(0),
  lateAfterMinutes: int('late_after_minutes').default(0),
  halfDayAfterMinutes: int('half_day_after_minutes').default(120),
  absentAfterMinutes: int('absent_after_minutes').default(240),
  allowOvertime: boolean('allow_overtime').default(false),
  overtimeAfterMinutes: int('overtime_after_minutes').default(480),
  maxOvertimeMinutes: int('max_overtime_minutes').default(240),
  allowCompOff: boolean('allow_comp_off').default(false),
  isActive: boolean('is_active').default(true),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int('updated_by'),
  updatedAt: timestamp('updated_at').default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const attendancePolicyWeekendsModel = mysqlTable(
  'attendance_policy_weekends',
  {
    id: int('id').autoincrement().primaryKey(),
    policyId: int('policy_id')
      .notNull()
      .references(() => attendancePoliciesModel.id, { onDelete: 'restrict' }),
    weekDayId: int('week_day_id')
      .notNull()
      .references(() => weekDayModel.weekDayId, { onDelete: 'restrict' }),
    createdBy: int('created_by').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedBy: int('updated_by'),
    updatedAt: timestamp('updated_at').default(
      sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    ),
  }
)

// attendance punches table and attendance daily table 
export const attendancePunches = mysqlTable("attendance_punches", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employee_id")
    .notNull()
    .references(() => employeeModel.employeeId, { onDelete: "restrict" }),
  punchTime: timestamp("punch_time", { mode: "date" }).notNull(), // ✅ mode: "date"
  punchType: varchar("punch_type", { length: 20 }),
  deviceId: varchar("device_id", { length: 50 }),
  source: varchar("source", { length: 50 }),
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int("updated_by"),
  updatedAt: timestamp("updated_at", { mode: "date" }).default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
})

export const attendanceDaily = mysqlTable("attendance_daily", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employee_id")
    .notNull()
    .references(() => employeeModel.employeeId, { onDelete: "restrict" }),
  attendanceDate: date("attendance_date").notNull(),
  firstIn: timestamp("first_in", { mode: "date" }),   // ✅ mode: "date"
  lastOut: timestamp("last_out", { mode: "date" }),   // ✅ mode: "date"
  workedMinutes: int("worked_minutes"),
  lateMinutes: int("late_minutes"),
  earlyOutMinutes: int("early_out_minutes"),
  overtimeMinutes: int("overtime_minutes"),
  status: varchar("status", { length: 20 }).notNull(),
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  updatedBy: int("updated_by"),
  updatedAt: timestamp("updated_at", { mode: "date" }).default(
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
  tenant: one(tenantModel, {
    fields: [userModel.tenantId],
    references: [tenantModel.tenantId],
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

export const customerRelations = relations(customerModel, ({ one }) => ({
  company: one(companyModel, {
    fields: [customerModel.companyId],
    references: [companyModel.companyId],
  }),
}))

export const businessUnitRelations = relations(
  businessUnitsModel,
  ({ one }) => ({
    company: one(companyModel, {
      fields: [businessUnitsModel.companyId],
      references: [companyModel.companyId],
    }),
    headEmployee: one(employeeModel, {
      fields: [businessUnitsModel.headEmployeeId],
      references: [employeeModel.employeeId],
    }),
  })
)

export const divisionRelations = relations(divisionModel, ({ one }) => ({
  businessUnit: one(businessUnitsModel, {
    fields: [divisionModel.businessUnitId],
    references: [businessUnitsModel.businessUnitId],
  }),
  headEmployee: one(employeeModel, {
    fields: [divisionModel.headEmployeeId],
    references: [employeeModel.employeeId],
  }),
}))

export const departmentRelations = relations(departmentModel, ({ one }) => ({
  division: one(divisionModel, {
    fields: [departmentModel.divisionId],
    references: [divisionModel.divisionId],
  }),
  costCenter: one(costCenterModel, {
    fields: [departmentModel.costCenterId],
    references: [costCenterModel.costCenterId],
  }),
  headEmployee: one(employeeModel, {
    fields: [departmentModel.headEmployeeId],
    references: [employeeModel.employeeId],
  }),
}))

export const employeePreboardingRelations = relations(
  employeePreboardingModel,
  ({ one }) => ({
    company: one(companyModel, {
      fields: [employeePreboardingModel.companyId],
      references: [companyModel.companyId],
    }),
    department: one(departmentModel, {
      fields: [employeePreboardingModel.departmentId],
      references: [departmentModel.departmentId],
    }),
    designation: one(designationModel, {
      fields: [employeePreboardingModel.designationId],
      references: [designationModel.designationId],
    }),
    reportingAuthority: one(employeeModel, {
      fields: [employeePreboardingModel.reportingAuthorityId],
      references: [employeeModel.employeeId],
    }),
    employmentType: one(employmentTypeModel, {
      fields: [employeePreboardingModel.employmentTypeId],
      references: [employmentTypeModel.employmentTypeId],
    }),
    salaryStructure: one(salaryStructureMasterModel, {
      fields: [employeePreboardingModel.salaryStructureMasterId],
      references: [salaryStructureMasterModel.salaryStructureMasterId],
    }),
  })
)

export const checklistMasterRelations = relations(
  checklistMasterModel,
  ({ one }) => ({
    responsibleEmployee: one(employeeModel, {
      fields: [checklistMasterModel.responsibleEmployeeId],
      references: [employeeModel.employeeId],
    }),
  })
)

export const checklistDetailsRelations = relations(
  checklistDetailsModel,
  ({ one }) => ({
    checklistMaster: one(checklistMasterModel, {
      fields: [checklistDetailsModel.checklistMasterId],
      references: [checklistMasterModel.checklistMasterId],
    }),
    responsibleEmployee: one(employeeModel, {
      fields: [checklistDetailsModel.responsibleEmployeeId],
      references: [employeeModel.employeeId],
    }),
  })
)

export const employeeChecklistDetailsRelations = relations(
  checklistDetailsModel,
  ({ one }) => ({
    responsibleEmployee: one(employeeModel, {
      fields: [checklistDetailsModel.responsibleEmployeeId],
      references: [employeeModel.employeeId],
    }),
  })
)

export const employeePreboardingChecklistRelations = relations(
  employeePreboardingChecklistModel,
  ({ one }) => ({
    preboarding: one(employeePreboardingModel, {
      fields: [employeePreboardingChecklistModel.preboardingId],
      references: [employeePreboardingModel.preboardingId],
    }),
    checklistDetails: one(checklistDetailsModel, {
      fields: [employeePreboardingChecklistModel.checklistDetailsId],
      references: [checklistDetailsModel.checklistDetailsId],
    }),
    responsibleEmployee: one(employeeModel, {
      fields: [employeePreboardingChecklistModel.responsibleEmployeeId],
      references: [employeeModel.employeeId],
    }),
  })
)

export const employeeRelations = relations(employeeModel, ({ one }) => ({
  department: one(departmentModel, {
    fields: [employeeModel.departmentId],
    references: [departmentModel.departmentId],
  }),
  designation: one(designationModel, {
    fields: [employeeModel.designationId],
    references: [designationModel.designationId],
  }),
  employmentType: one(employmentTypeModel, {
    fields: [employeeModel.employmentTypeId],
    references: [employmentTypeModel.employmentTypeId],
  }),
  shift: one(shiftModel, {
    fields: [employeeModel.shiftId],
    references: [shiftModel.shiftId],
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
  SalaryStructure: one(salaryStructureMasterModel, {
    fields: [employeeModel.salaryStructureMasterId],
    references: [salaryStructureMasterModel.salaryStructureMasterId],
  }),
  LeavePolicy: one(leavePolicyMasterModel, {
    fields: [employeeModel.leavePolicyMasterId],
    references: [leavePolicyMasterModel.leavePolicyMasterId],
  }),
}))

export const shiftRelations = relations(shiftModel, ({ one }) => ({
  company: one(companyModel, {
    fields: [shiftModel.companyId],
    references: [companyModel.companyId],
  }),
}))

export const shiftDayAndWeekDaysRelations = relations(
  shiftDayAndWeekDaysModel,
  ({ one }) => ({
    shift: one(shiftModel, {
      fields: [shiftDayAndWeekDaysModel.shiftId],
      references: [shiftModel.shiftId],
    }),
    weekDay: one(weekDayModel, {
      fields: [shiftDayAndWeekDaysModel.weekDayId],
      references: [weekDayModel.weekDayId],
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

export const employeeSalaryComponentsRelations = relations(
  employeeSalaryComponentsModel,
  ({ one }) => ({
    employee: one(employeeModel, {
      fields: [employeeSalaryComponentsModel.employeeId],
      references: [employeeModel.employeeId],
    }),
    salaryComponent: one(salaryComponentsModel, {
      fields: [employeeSalaryComponentsModel.salaryComponentId],
      references: [salaryComponentsModel.salaryComponentId],
    }),
    employeeLone: one(employeeLoneModel, {
      fields: [employeeSalaryComponentsModel.employeeLoneId],
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

export const salaryStructureDetailsRelations = relations(
  salaryStructureDetailsModel,
  ({ one }) => ({
    salaryStructureMaster: one(salaryStructureMasterModel, {
      fields: [salaryStructureDetailsModel.salaryStructureMasterId],
      references: [salaryStructureMasterModel.salaryStructureMasterId],
    }),
    salaryComponent: one(salaryComponentsModel, {
      fields: [salaryStructureDetailsModel.salaryComponentId],
      references: [salaryComponentsModel.salaryComponentId],
    }),
  })
)

export const employeeSalaryStructureRelations = relations(
  employeeSalaryStructureModel,
  ({ one }) => ({
    employee: one(employeeModel, {
      fields: [employeeSalaryStructureModel.employeeId],
      references: [employeeModel.employeeId],
    }),
    salaryStructureMaster: one(salaryStructureMasterModel, {
      fields: [employeeSalaryStructureModel.salaryStructureMasterId],
      references: [salaryStructureMasterModel.salaryStructureMasterId],
    }),
  })
)

export const leavePolicyDetailsRelations = relations(
  leavePolicyDetailsModel,
  ({ one }) => ({
    leavePolicyMaster: one(leavePolicyMasterModel, {
      fields: [leavePolicyDetailsModel.leavePolicyMasterId],
      references: [leavePolicyMasterModel.leavePolicyMasterId],
    }),
    leaveType: one(leaveTypeModel, {
      fields: [leavePolicyDetailsModel.leaveTypeId],
      references: [leaveTypeModel.leaveTypeId],
    }),
  })
)

export const employeeLeaveAssignmentRelations = relations(
  employeeLeaveAssignmentModel,
  ({ one }) => ({
    employee: one(employeeModel, {
      fields: [employeeLeaveAssignmentModel.employeeId],
      references: [employeeModel.employeeId],
    }),
    leavePolicyMaster: one(leavePolicyMasterModel, {
      fields: [employeeLeaveAssignmentModel.leavePolicyMasterId],
      references: [leavePolicyMasterModel.leavePolicyMasterId],
    }),
  })
)

export const leaveTypeRelations = relations(leaveTypeModel, ({ one }) => ({
  company: one(companyModel, {
    fields: [leaveTypeModel.companyId],
    references: [companyModel.companyId],
  }),
}))

export const leavePolicyMasterRelations = relations(
  leavePolicyMasterModel,
  ({ one }) => ({
    company: one(companyModel, {
      fields: [leavePolicyMasterModel.companyId],
      references: [companyModel.companyId],
    }),
  })
)

export const assetRelations = relations(assetsModel, ({ one }) => ({
  category: one(assetCategoryModel, {
    fields: [assetsModel.categoryId],
    references: [assetCategoryModel.assetCategoryId],
  }),
}))

export const assetTransactionsRelations = relations(
  assetTransactionsModel,
  ({ one }) => ({
    asset: one(assetsModel, {
      fields: [assetTransactionsModel.assetId],
      references: [assetsModel.assetId],
    }),
    employee: one(employeeModel, {
      fields: [assetTransactionsModel.employeeId],
      references: [employeeModel.employeeId],
    }),
  })
)

// Relations for Attendance Policy and related tables
export const attendancePoliciesRelations = relations(
  attendancePoliciesModel,
  ({ many }) => ({
    weekends: many(attendancePolicyWeekendsModel),
  })
)

export const attendancePolicyWeekendsRelations = relations(
  attendancePolicyWeekendsModel,
  ({ one }) => ({
    policy: one(attendancePoliciesModel, {
      fields: [attendancePolicyWeekendsModel.policyId],
      references: [attendancePoliciesModel.id],
    }),
    weekDay: one(weekDayModel, {
      fields: [attendancePolicyWeekendsModel.weekDayId],
      references: [weekDayModel.weekDayId],
    }),
  })
)

export const attendancePunchesRelations = relations(attendancePunches, ({ one }) => ({
  employee: one(employeeModel, {
    fields: [attendancePunches.employeeId],
    references: [employeeModel.employeeId],
  }),
}))

export const attendanceDailyRelations = relations(attendanceDaily, ({ one }) => ({
  employee: one(employeeModel, {
    fields: [attendanceDaily.employeeId],
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
export type Customer = typeof customerModel.$inferSelect
export type NewCustomer = typeof customerModel.$inferInsert
export type Tenant = typeof tenantModel.$inferSelect
export type NewTenant = typeof tenantModel.$inferInsert
export type Department = typeof departmentModel.$inferSelect
export type NewDepartment = typeof departmentModel.$inferInsert
export type Designation = typeof designationModel.$inferSelect
export type NewDesignation = typeof designationModel.$inferInsert
export type Company = typeof companyModel.$inferSelect
export type NewCompany = typeof companyModel.$inferInsert
export type WorkStation = typeof workStationModel.$inferSelect
export type BusinessUnit = typeof businessUnitsModel.$inferSelect
export type NewBusinessUnit = typeof businessUnitsModel.$inferInsert
export type NewWorkStation = typeof workStationModel.$inferInsert
export type Division = typeof divisionModel.$inferSelect
export type NewDivision = typeof divisionModel.$inferInsert
export type CostCenter = typeof costCenterModel.$inferSelect
export type NewCostCenter = typeof costCenterModel.$inferInsert
export type EmploymentType = typeof employmentTypeModel.$inferSelect
export type NewEmploymentType = typeof employmentTypeModel.$inferInsert
export type EmployeePreboarding = typeof employeePreboardingModel.$inferSelect
export type NewEmployeePreboarding =
  typeof employeePreboardingModel.$inferInsert
export type ChecklistMaster = typeof checklistMasterModel.$inferSelect
export type NewChecklistMaster = typeof checklistMasterModel.$inferInsert
export type ChecklistDetails = typeof checklistDetailsModel.$inferSelect
export type NewChecklistDetails = typeof checklistDetailsModel.$inferInsert
export type EmployeePreboardingChecklist =
  typeof employeePreboardingChecklistModel.$inferSelect
export type NewEmployeePreboardingChecklist =
  typeof employeePreboardingChecklistModel.$inferInsert
export type Employee = typeof employeeModel.$inferSelect
export type NewEmployee = typeof employeeModel.$inferInsert
export type WeekDay = typeof weekDayModel.$inferSelect
export type NewWeekDay = typeof weekDayModel.$inferInsert
export type Shift = typeof shiftModel.$inferSelect
export type NewShift = typeof shiftModel.$inferInsert
export type Holiday = typeof holidayModel.$inferSelect
export type NewHoliday = typeof holidayModel.$inferInsert
export type LeaveType = typeof leaveTypeModel.$inferSelect
export type NewLeaveType = typeof leaveTypeModel.$inferInsert
export type LeavePolicyMaster = typeof leavePolicyMasterModel.$inferSelect
export type NewLeavePolicyMaster = typeof leavePolicyMasterModel.$inferInsert
export type LeavePolicyDetails = typeof leavePolicyDetailsModel.$inferSelect
export type NewLeavePolicyDetails = typeof leavePolicyDetailsModel.$inferInsert
export type EmployeeLeaveAssignment =
  typeof employeeLeaveAssignmentModel.$inferSelect
export type NewEmployeeLeaveAssignment =
  typeof employeeLeaveAssignmentModel.$inferInsert
export type EmployeeAttendance = typeof employeeAttendanceModel.$inferSelect
export type NewEmployeeAttendance = typeof employeeAttendanceModel.$inferInsert
export type SalaryComponent = typeof salaryComponentsModel.$inferSelect
export type NewSalaryComponent = typeof salaryComponentsModel.$inferInsert
export type EmployeeSalaryComponent =
  typeof employeeSalaryComponentsModel.$inferSelect
export type NewEmployeeSalaryComponent =
  typeof employeeSalaryComponentsModel.$inferInsert
export type Salary = typeof salaryModel.$inferSelect
export type NewSalary = typeof salaryModel.$inferInsert
export type Lone = typeof employeeLoneModel.$inferSelect
export type NewLone = typeof employeeLoneModel.$inferInsert
export type SalaryStructureMaster =
  typeof salaryStructureMasterModel.$inferSelect
export type NewSalaryStructureMaster =
  typeof salaryStructureMasterModel.$inferInsert
export type SalaryStructureDetails =
  typeof salaryStructureDetailsModel.$inferSelect
export type NewSalaryStructureDetails =
  typeof salaryStructureDetailsModel.$inferInsert
export type EmployeeSalaryStructure =
  typeof employeeSalaryStructureModel.$inferSelect
export type NewEmployeeSalaryStructure =
  typeof employeeSalaryStructureModel.$inferInsert
export type AssetCategory = typeof assetCategoryModel.$inferSelect
export type NewAssetCategory = typeof assetCategoryModel.$inferInsert
export type Assets = typeof assetsModel.$inferSelect
export type NewAssets = typeof assetsModel.$inferInsert
export type AssetTransaction = typeof assetTransactionsModel.$inferSelect
export type NewAssetTransaction = typeof assetTransactionsModel.$inferInsert

// Types for Attendance Policy
export type AttendancePolicy = typeof attendancePoliciesModel.$inferSelect
export type NewAttendancePolicy = typeof attendancePoliciesModel.$inferInsert
export type AttendancePolicyWeekend =
  typeof attendancePolicyWeekendsModel.$inferSelect
export type NewAttendancePolicyWeekend =
  typeof attendancePolicyWeekendsModel.$inferInsert
export type AttendancePunch = typeof attendancePunches.$inferSelect
export type NewAttendancePunch = typeof attendancePunches.$inferInsert
export type AttendanceDaily = typeof attendanceDaily.$inferSelect
export type NewAttendanceDaily = typeof attendanceDaily.$inferInsert