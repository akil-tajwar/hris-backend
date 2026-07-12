// src/config/database.ts
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import { drizzle } from 'drizzle-orm/mysql2'
import * as schema from '../schemas'

dotenv.config()

// Create a connection pool instead of a single connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  dateStrings: true,

  ssl: {
    rejectUnauthorized: false,
  },

  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
})

// Create and export the Drizzle ORM instance
export const db = drizzle(pool, { schema, mode: 'default' })

// Test the database connection
export async function testDatabaseConnection(): Promise<void> {
  try {
    const connection = await pool.getConnection()
    console.log('Connected to the MySQL database!')
    connection.release()
  } catch (err: any) {
    console.error('Full error:', err)
    console.error('Code:', err.code)
    console.error('Message:', err.message)
    console.error('Cause:', err.cause)
  }
}

testDatabaseConnection()

// Export the pool for direct usage if needed
export { pool }
