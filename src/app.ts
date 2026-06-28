import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import helmet from 'helmet'
import path from 'path'
import { errorHandler } from './middlewares/error.middleware'
import routes from './routes'
import 'dotenv/config';

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
      ];

      // Allow non-browser requests (no origin) and whitelisted domains
      if (!origin || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }

      return cb(new Error("Not allowed by CORS"));
    },
  })
);

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