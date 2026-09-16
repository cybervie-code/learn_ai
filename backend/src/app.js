import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import collegeRoutes from './routes/collegeRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import attemptRoutes from './routes/attemptRoutes.js';
import learningPathRoutes from './routes/learningPathRoutes.js';
import rankingRoutes from './routes/rankingRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import userRoutes from './routes/userRoutes.js';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Security
app.use(helmet());

// CORS — CLIENT_URL may hold a comma-separated list of allowed origins
// (e.g. the deployed frontend + localhost dev)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''));

app.use(cors({
  origin(origin, cb) {
    // Allow same-origin/server-side requests (no Origin header) and listed origins
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      return cb(null, true);
    }
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 5000 : 300, // higher limit in development
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Cybervie API is running', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/paths', learningPathRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/users', userRoutes);

// 404
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
