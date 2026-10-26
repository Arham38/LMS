import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';
import requestId from './middleware/requestId.js';
import sanitizeKeys from './middleware/mongoSanitize.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/course.routes.js';
import enrollmentRoutes from './routes/enrollment.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// Trust reverse proxy (for Render/Vercel and accurate IP rate limiting)
app.set('trust proxy', 1);

// Request identifier
app.use(requestId);

// Security Headers
app.use(helmet());

// CORS configuration limited to CLIENT_URL
const allowedOrigins = [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })
);

// Body parser with 100kb limit
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Reject keys starting with $ or containing a dot
app.use(sanitizeKeys);

// Request logging (skip during tests)
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiting on API endpoints
if (env.NODE_ENV !== 'test') {
  app.use('/api', generalLimiter);
}

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use(notFound);

// Error Handler
app.use(errorHandler);

export default app;
