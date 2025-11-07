import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth';
import courseRoutes from './routes/courses';
import materialRoutes from './routes/materials';
import quizRoutes from './routes/quizzes';
import analyticsRoutes from './routes/analytics';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors({ 
  origin: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/courses', materialRoutes); // Materials routes are nested under courses
app.use('/api/courses', quizRoutes); // Quiz routes are nested under courses
app.use('/api/quizzes', quizRoutes); // Also mount at /api/quizzes for direct quiz access
app.use('/api/analytics', analyticsRoutes);

// Root route
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ 
    message: 'AI Study Tool API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      courses: '/api/courses',
      quizzes: '/api/quizzes',
      analytics: '/api/analytics'
    }
  });
});

// Health check
app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

