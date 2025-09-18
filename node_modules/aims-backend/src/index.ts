import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { config } from './config/env';
import rbacRoutes from './routes/rbac.routes';
import usersRouter from './routes/activeUsers.routes';
import staffRouter from './routes/staff.routes';
// Load environment variables
dotenv.config();

const app = express();
const PORT = config.PORT;
app.use(express.json());
app.use('/v1/rbac', rbacRoutes);
app.use('/v1/users', usersRouter);
app.use('/v1/staff', staffRouter);
// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    version: '1.0.0',
  });
});

// API info endpoint at root level
app.get('/v1', (req, res) => {
  res.json({
    success: true,
    message: 'AIMS API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/v1/auth',
      superAdmin: '/v1/super-admin',
      hr: '/v1/hr',
      marketing: '/v1/marketing',
      pos: '/v1/pos',
      inventory: '/v1/inventory',
      client: '/v1/client',
      accounts: '/v1/accounts',
      products: '/v1/products',
      sales: '/v1/sales',
      purchases: '/v1/purchases',
      notifications: '/v1/notifications',
    },
    documentation: '/api/docs',
    health: '/health',
  });
});

// API routes
app.use('/', routes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AIMS Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${config.FRONTEND_URL}`);
});



export default app;