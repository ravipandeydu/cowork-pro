import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import leadRoutes from './routes/leads';
import centerRoutes from './routes/centers';
import proposalRoutes from './routes/proposals';
import testRoutes from './routes/test';
import webhookRoutes from './routes/webhooks';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Configure body parsing based on Content-Type
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/test', testRoutes);
app.use('/api/webhooks', webhookRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'CoWork Pro API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

export default app;