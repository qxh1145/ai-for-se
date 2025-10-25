import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';

import passport from './config/passport.js';
import googleAuthRoutes from './routes/auth.js';   // Google OAuth
import authRouter from './routes/auth.routes.js';
import adminRouter from './routes/admin.routes.js';
import trainerRouter from './routes/trainer.routes.js';
import exerciseRouter from './routes/exercise.routes.js';
import planRouter from './routes/plan.routes.js';

import onboardingRouter from './routes/onboarding.routes.js';
import nutritionRouter from './routes/nutrition.routes.js';

dotenv.config();
import activityTracker from "./middleware/activity.tracker.js";

const app = express();
const isDev = process.env.NODE_ENV !== 'production';
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';

/* -------------------- CORS -------------------- */
const corsOptions = {
  origin: [
    FRONTEND,
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5178',
    'http://localhost:5179',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
};
app.use(cors(corsOptions));

/* -------------------- Security & Logging -------------------- */
app.use(helmet());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(isDev ? 'dev' : 'combined'));
}

/* -------------------- Body & Cookies -------------------- */
app.use(cookieParser());
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));

/* -------------------- Session -------------------- */
if (!process.env.SESSION_SECRET) {
  console.warn('[WARN] SESSION_SECRET is missing in .env');
}
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,     // true khi dùng HTTPS
      sameSite: 'lax',   // nếu FE/BE khác domain + HTTPS => 'none' + secure:true
    },
  })
);

/* -------------------- Passport -------------------- */
app.use(passport.initialize());
app.use(passport.session());

/* -------------------- Rate limit cho auth -------------------- */
const authLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 phút
  max: isDev ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    errors: [],
  },
});

/* -------------------- Routes -------------------- */
app.use('/api/auth', authLimiter, authRouter);
app.use('/auth', googleAuthRoutes);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/nutrition', nutritionRouter);

// Theo dõi hoạt động người dùng (cập nhật lastActiveAt)
app.use("/api", activityTracker);

// Sau middleware này, mọi request có token hợp lệ sẽ tự cập nhật lastActiveAt
app.use('/api/admin', adminRouter);
app.use('/api/trainer', trainerRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/exercises', exerciseRouter);
app.use('/api/plans', planRouter);

/* -------------------- Health & Root -------------------- */
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req, res) => {
  res.json({ message: 'Chào mừng các tình yêu đã đến với web của anh 💕' });
});

/* -------------------- 404 -------------------- */
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    errors: [],
  });
});

/* -------------------- Global error handler -------------------- */
app.use((err, _req, res, _next) => {
  if (isDev) console.error('Global error:', err);
  const status = err.status || 500;
  const safeMessage = status === 500 && !isDev ? 'Internal server error' : err.message;

  res.status(status).json({
    success: false,
    message: safeMessage || 'Internal server error',
    errors: Array.isArray(err.errors) ? err.errors : [],
    ...(isDev ? { stack: err.stack } : {}),
  });
});

export default app;
