import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import helmet from 'helmet'
import path from 'path'
import { errorHandler } from './middlewares/error.middleware'
import routes from './routes'
import 'dotenv/config';
import Redis from 'ioredis'

dotenv.config()

const app = express()

// CORS middleware - applied to ALL routes including static files
app.use(
  cors({
    credentials: true,
    origin: (
      origin: string | undefined,
      cb: (err: Error | null, allow?: boolean) => void
    ) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://srv938571.hstgr.cloud:6070",
        "https://www.srv938571.hstgr.cloud:6070",
        "https://hris-frontend-swart.vercel.app",
      ];

      // Allow non-browser requests (no origin) and whitelisted domains
      if (!origin || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }

      return cb(new Error("Not allowed by CORS"));
    },
  })
);

const redisUrl = process.env.REDIS_URL
if (!redisUrl) {
  throw new Error('REDIS_URL must be defined')
}

const redis = new Redis(redisUrl, {
  keyPrefix: process.env.REDIS_PREFIX, // Automatically prefixes everything with "app_one:"
});

const bcrypt = require("bcrypt");

bcrypt.hash("A123456a!", 10).then(console.log);

// This saves globally as "app_one:session:xyz"
redis.set('session:xyz', 'active').catch(console.error)

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ✅ Serve static files with CORS (add this AFTER CORS middleware)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api', routes)

// Error handling
app.use(errorHandler)

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
