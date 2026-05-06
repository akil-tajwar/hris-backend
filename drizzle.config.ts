import { defineConfig } from 'drizzle-kit'

import * as dotenv from 'dotenv'

dotenv.config()


const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;
const encodedPassword = encodeURIComponent(DB_PASSWORD!);
const DATABASE_URL = `mysql://${DB_USER}:${encodedPassword}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
export default defineConfig({
  schema: './src/schemas/schema.ts',
  out: './migrations',
  dialect:'mysql',
  dbCredentials: {
    url: DATABASE_URL!,
  },
})
