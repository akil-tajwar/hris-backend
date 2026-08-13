export const geminiTools = [
  {
    type: 'function' as const,

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
    type: 'function' as const,

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
    type: 'function' as const,

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
    type: 'function' as const,

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
    type: 'function' as const,

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
]
