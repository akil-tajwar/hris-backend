export const geminiTools = [
  {
    functionDeclarations: [
      {
        name: 'get_tenant_details',
        description: "Get the current tenant's name/organization name.",
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_tenant_employee_count_by_name',
        description:
          "Get the total employee count for an organization by name, but ONLY if the named organization matches the current authenticated user's own tenant. Use this whenever the user asks how many employees a specific named company/organization/group has.",
        parameters: {
          type: 'object',
          properties: {
            nameAsked: {
              type: 'string',
              description:
                'The organization/tenant name the user asked about, e.g. "Habib Group".',
            },
          },
          required: ['nameAsked'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_today_attendance_summary',
        description:
          "Get today's employee attendance summary for the current tenant.",
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'search_employees',
        description: 'Search employees by employee name or employee code.',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Employee name to search for.',
            },
          },
          required: ['name'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_employees_by_company',
        description:
          'List all employees who work under a specific company name (a tenant can have multiple companies).',
        parameters: {
          type: 'object',
          properties: {
            companyName: {
              type: 'string',
              description:
                'Company name to search for, e.g. "Kattoli Textile Ltd".',
            },
          },
          required: ['companyName'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_employee_count_by_company',
        description:
          'Get the total number of active employees who work under a specific company name (a tenant can have multiple companies).',
        parameters: {
          type: 'object',
          properties: {
            companyName: {
              type: 'string',
              description:
                'Company name to search for, e.g. "Kattoli Textile Ltd".',
            },
          },
          required: ['companyName'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_employee_attendance',
        description: "Get an employee's attendance for a specific date.",
        parameters: {
          type: 'object',
          properties: {
            employeeId: {
              type: 'integer',
              description: 'Employee ID.',
            },
            date: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format.',
            },
          },
          required: ['employeeId', 'date'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_absent_employees',
        description: 'Get employees who are absent on a specific date.',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format.',
            },
          },
          required: ['date'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_late_employees',
        description: 'Get employees who arrived late on a specific date.',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format.',
            },
          },
          required: ['date'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_present_employees',
        description: 'Get employees who were present on a specific date.',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date in YYYY-MM-DD format.' },
          },
          required: ['date'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_attendance_summary_by_date',
        description:
          'Get a full attendance breakdown (present, absent, late, leave, holiday counts) for any specific date, not just today.',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date in YYYY-MM-DD format.' },
          },
          required: ['date'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_employees_on_leave',
        description:
          'Get employees who were on approved leave on a specific date.',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date in YYYY-MM-DD format.' },
          },
          required: ['date'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_employee_details',
        description:
          "Get an employee's full profile details by their employee ID.",
        parameters: {
          type: 'object',
          properties: {
            employeeId: { type: 'integer', description: 'Employee ID.' },
          },
          required: ['employeeId'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_employees_by_department',
        description: 'List all employees in a given department.',
        parameters: {
          type: 'object',
          properties: {
            departmentName: {
              type: 'string',
              description: 'Department name to search for.',
            },
          },
          required: ['departmentName'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_employees_by_designation',
        description: 'List all employees with a given designation/job title.',
        parameters: {
          type: 'object',
          properties: {
            designationName: {
              type: 'string',
              description: 'Designation name to search for.',
            },
          },
          required: ['designationName'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_total_employee_count',
        description: 'Get the total number of active employees for the tenant.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_new_joiners',
        description: 'Get employees who joined within a specific date range.',
        parameters: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              description: 'Start date in YYYY-MM-DD format.',
            },
            endDate: {
              type: 'string',
              description: 'End date in YYYY-MM-DD format.',
            },
          },
          required: ['startDate', 'endDate'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_employee_leave_balance',
        description:
          "Get an employee's remaining leave balance broken down by leave type.",
        parameters: {
          type: 'object',
          properties: {
            employeeId: { type: 'integer', description: 'Employee ID.' },
          },
          required: ['employeeId'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_pending_leave_requests',
        description: 'Get all leave requests currently pending approval.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_leave_types',
        description:
          'Get the list of available leave types and their yearly allocation.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_employee_salary',
        description:
          "Get an employee's salary details for a specific month and year.",
        parameters: {
          type: 'object',
          properties: {
            employeeId: { type: 'integer', description: 'Employee ID.' },
            month: { type: 'string', description: 'Month name, e.g. "July".' },
            year: { type: 'integer', description: 'Year, e.g. 2026.' },
          },
          required: ['employeeId', 'month', 'year'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_monthly_payroll_summary',
        description:
          'Get total payroll summary (headcount, gross, net) for a given month and year.',
        parameters: {
          type: 'object',
          properties: {
            month: { type: 'string', description: 'Month name, e.g. "July".' },
            year: { type: 'integer', description: 'Year, e.g. 2026.' },
          },
          required: ['month', 'year'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_employees_with_salary_given',
        description:
          'Get employees who have actually been paid/given their salary for a specific month and year (isSalaryGiven = true), as opposed to employees whose salary was only generated but not yet paid.',
        parameters: {
          type: 'object',
          properties: {
            month: { type: 'string', description: 'Month name, e.g. "July".' },
            year: { type: 'integer', description: 'Year, e.g. 2026.' },
          },
          required: ['month', 'year'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_employees_with_salary_pending',
        description:
          'Get employees whose salary was generated for a month but has NOT yet been given/paid to them (isSalaryGiven = false).',
        parameters: {
          type: 'object',
          properties: {
            month: { type: 'string', description: 'Month name, e.g. "July".' },
            year: { type: 'integer', description: 'Year, e.g. 2026.' },
          },
          required: ['month', 'year'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_departments',
        description: 'List all active departments for the tenant.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_designations',
        description: 'List all active designations/job titles for the tenant.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_companies',
        description: 'List all active companies under the tenant.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_employee_assets',
        description: 'Get assets currently assigned to a specific employee.',
        parameters: {
          type: 'object',
          properties: {
            employeeId: { type: 'integer', description: 'Employee ID.' },
          },
          required: ['employeeId'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_available_assets',
        description:
          'Get assets currently available (not assigned) for the tenant.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_upcoming_holidays',
        description: 'Get upcoming holidays from a given date onward.',
        parameters: {
          type: 'object',
          properties: {
            fromDate: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format to search from.',
            },
          },
          required: ['fromDate'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_notices',
        description: 'Get the most recent company notices/announcements.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'get_employee_loans',
        description: "Get an employee's loan records and repayment status.",
        parameters: {
          type: 'object',
          properties: {
            employeeId: { type: 'integer', description: 'Employee ID.' },
          },
          required: ['employeeId'],
          additionalProperties: false,
        },
      },
    ],
  },
]
