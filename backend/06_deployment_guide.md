# 06 - Deployment Guide

## Overview
This guide will help you deploy your AIMS backend to production using Supabase, environment configuration, and best practices.

## Prerequisites
- ✅ Backend setup completed (01_backend_setup.md)
- ✅ Authentication module completed (02_auth_module.md)
- ✅ RBAC module completed (03_role_permission_module.md)
- ✅ CRUD modules implemented (04_crud_modules.md)
- ✅ Testing and linting setup (05_testing_and_linting.md)

## Step 1: Production Environment Setup

### 1.1 Create Production Environment Files
**File: `.env.production`**
```env
# Production Environment Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com

# Supabase Production Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# JWT Configuration (use strong, unique secrets)
JWT_SECRET=your_very_secure_production_jwt_secret_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_production_email@gmail.com
SMTP_PASS=your_production_app_password

# Security Configuration
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Monitoring Configuration
SENTRY_DSN=your_sentry_dsn_here
```

### 1.2 Update Environment Configuration
**File: `src/config/env.ts`**
```typescript
import dotenv from 'dotenv';
import path from 'path';

// Load environment-specific .env file
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.local';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  DATABASE_URL: process.env.DATABASE_URL!,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads/',

  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,

  // Security
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log',

  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN
};

// Validation
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'DATABASE_URL',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

## Step 2: Production Dependencies

### 2.1 Install Production Dependencies
```bash
# Install production dependencies
npm install --save express-rate-limit compression morgan winston
npm install --save @sentry/node @sentry/integrations

# Install development dependencies for production builds
npm install --save-dev @types/compression @types/morgan
```

### 2.2 Update Package.json
**File: `package.json`**
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "start:prod": "NODE_ENV=production node dist/index.js",
    "build:prod": "npm run build && npm prune --production",
    "deploy": "npm run build:prod && npm start:prod"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```

## Step 3: Production Middleware

### 3.1 Create Rate Limiting Middleware
**File: `src/middleware/rateLimiter.ts`**
```typescript
import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

export const createRateLimiter = (windowMs?: number, max?: number) => {
  return rateLimit({
    windowMs: windowMs || config.RATE_LIMIT_WINDOW_MS,
    max: max || config.RATE_LIMIT_MAX_REQUESTS,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((windowMs || config.RATE_LIMIT_WINDOW_MS) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((windowMs || config.RATE_LIMIT_WINDOW_MS) / 1000)
      });
    }
  });
};

// Specific rate limiters for different endpoints
export const authRateLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
export const apiRateLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const strictRateLimiter = createRateLimiter(60 * 1000, 10); // 10 requests per minute
```

### 3.2 Create Logging Middleware
**File: `src/middleware/logger.ts`**
```typescript
import winston from 'winston';
import { config } from '../config/env';

// Create logger instance
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'aims-backend' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// If we're not in production, log to the console as well
if (config.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId || 'anonymous'
    };
    
    if (res.statusCode >= 400) {
      logger.error('HTTP Request Error', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
};
```

### 3.3 Create Security Middleware
**File: `src/middleware/security.ts`**
```typescript
import helmet from 'helmet';
import { config } from '../config/env';

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", config.SUPABASE_URL],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      config.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};
```

## Step 4: Error Monitoring

### 4.1 Setup Sentry
**File: `src/middleware/sentry.ts`**
```typescript
import * as Sentry from '@sentry/node';
import { config } from '../config/env';

export const initSentry = () => {
  if (config.SENTRY_DSN) {
    Sentry.init({
      dsn: config.SENTRY_DSN,
      environment: config.NODE_ENV,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: undefined }),
      ],
      tracesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
  }
};

export const sentryErrorHandler = Sentry.getExpressErrorHandler();
export const sentryRequestHandler = Sentry.requestHandler();
export const sentryTracingHandler = Sentry.tracingHandler();
```

### 4.2 Update Error Handler
**File: `src/middleware/errorHandler.ts`**
```typescript
import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { logger } from './logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Log error details
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    userId: (req as any).user?.userId
  });

  // Send to Sentry
  Sentry.captureException(error);

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  });
};

// 404 handler
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Route ${req.originalUrl} not found`) as AppError;
  error.statusCode = 404;
  next(error);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

## Step 5: Production Server Configuration

### 5.1 Update Main Server File
**File: `src/index.ts`**
```typescript
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initSentry, sentryRequestHandler, sentryErrorHandler } from './middleware/sentry';
import { securityMiddleware, corsOptions } from './middleware/security';
import { requestLogger } from './middleware/logger';
import { apiRateLimiter, authRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFound } from './middleware/errorHandler';
import routes from './routes';
import { config } from './config/env';

// Load environment variables
dotenv.config();

// Initialize Sentry
initSentry();

const app = express();
const PORT = config.PORT;

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(securityMiddleware);

// CORS configuration
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));
app.use(requestLogger);

// Rate limiting
app.use('/v1/auth', authRateLimiter);
app.use('/v1', apiRateLimiter);

// Health check endpoint (before Sentry)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    version: '1.0.0',
    memory: process.memoryUsage(),
    pid: process.pid
  });
});

// Sentry request handler
app.use(sentryRequestHandler);

// API routes
app.use('/', routes);

// 404 handler
app.use('*', notFound);

// Sentry error handler
app.use(sentryErrorHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AIMS Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${config.FRONTEND_URL}`);
  console.log(`📝 Log Level: ${config.LOG_LEVEL}`);
});

export default app;
```

## Step 6: Database Migration

### 6.1 Create Migration Script
**File: `scripts/migrate.js`**
```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  const migrationFiles = [
    '01_core_functions.sql',
    '02_auth_users.sql',
    '03_branches.sql',
    '04_products_inventory.sql',
    '05_suppliers_purchasing.sql',
    '06_customers_orders.sql',
    '07_payments.sql',
    '08_marketing_promotions.sql',
    '09_audit_logs.sql',
    '10_system_settings.sql',
    '11_views.sql'
  ];

  for (const file of migrationFiles) {
    try {
      const filePath = path.join(__dirname, '..', file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`📄 Executing ${file}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`❌ Error executing ${file}:`, error);
        process.exit(1);
      }
      
      console.log(`✅ ${file} executed successfully`);
    } catch (error) {
      console.error(`❌ Error reading ${file}:`, error);
      process.exit(1);
    }
  }
  
  console.log('🎉 All migrations completed successfully!');
}

runMigrations().catch(console.error);
```

### 6.2 Create Seed Script
**File: `scripts/seed.js`**
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  console.log('🌱 Seeding initial data...');
  
  try {
    // Seed roles
    const roles = [
      { name: 'super_admin', description: 'System administrator', is_system_role: true },
      { name: 'hr_admin', description: 'HR administrator', is_system_role: false },
      { name: 'inventory_clerk', description: 'Inventory clerk', is_system_role: false },
      { name: 'cashier', description: 'Cashier', is_system_role: false },
      { name: 'marketing_staff', description: 'Marketing staff', is_system_role: false }
    ];

    for (const role of roles) {
      const { error } = await supabase
        .from('roles')
        .insert(role);
      
      if (error && !error.message.includes('duplicate key')) {
        console.error('Error seeding role:', error);
      }
    }

    // Seed permissions
    const permissions = [
      { name: 'users.create', resource: 'users', action: 'create' },
      { name: 'users.read', resource: 'users', action: 'read' },
      { name: 'users.update', resource: 'users', action: 'update' },
      { name: 'users.delete', resource: 'users', action: 'delete' },
      { name: 'products.create', resource: 'products', action: 'create' },
      { name: 'products.read', resource: 'products', action: 'read' },
      { name: 'products.update', resource: 'products', action: 'update' },
      { name: 'products.delete', resource: 'products', action: 'delete' }
    ];

    for (const permission of permissions) {
      const { error } = await supabase
        .from('permissions')
        .insert(permission);
      
      if (error && !error.message.includes('duplicate key')) {
        console.error('Error seeding permission:', error);
      }
    }

    console.log('✅ Initial data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData().catch(console.error);
```

## Step 7: Docker Configuration

### 7.1 Create Dockerfile
**File: `Dockerfile`**
```dockerfile
# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
```

### 7.2 Create Docker Compose
**File: `docker-compose.yml`**
```yaml
version: '3.8'

services:
  aims-backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    env_file:
      - .env.production
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Step 8: Deployment Scripts

### 8.1 Create Deployment Script
**File: `scripts/deploy.sh`**
```bash
#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ package.json not found. Are you in the right directory?"
  exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
  echo "❌ .env.production not found. Please create it first."
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests
echo "🧪 Running tests..."
npm run test:ci

# Run linting
echo "🔍 Running linting..."
npm run lint

# Build the application
echo "🔨 Building application..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
node scripts/migrate.js

# Seed initial data
echo "🌱 Seeding initial data..."
node scripts/seed.js

echo "✅ Deployment completed successfully!"
echo "🎉 Your AIMS backend is ready for production!"
```

### 8.2 Create PM2 Configuration
**File: `ecosystem.config.js`**
```javascript
module.exports = {
  apps: [{
    name: 'aims-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

## Step 9: Monitoring and Health Checks

### 9.1 Create Health Check Script
**File: `scripts/health-check.js`**
```javascript
const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3001,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('✅ Health check passed');
    process.exit(0);
  } else {
    console.log(`❌ Health check failed with status: ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.log(`❌ Health check failed: ${err.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Health check timed out');
  req.destroy();
  process.exit(1);
});

req.end();
```

### 9.2 Create Monitoring Script
**File: `scripts/monitor.js`**
```javascript
const { exec } = require('child_process');
const fs = require('fs');

function checkDiskSpace() {
  exec('df -h', (error, stdout, stderr) => {
    if (error) {
      console.error('Error checking disk space:', error);
      return;
    }
    console.log('💾 Disk space:');
    console.log(stdout);
  });
}

function checkMemoryUsage() {
  const memUsage = process.memoryUsage();
  console.log('🧠 Memory usage:');
  console.log(`RSS: ${Math.round(memUsage.rss / 1024 / 1024)} MB`);
  console.log(`Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`);
  console.log(`Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`);
  console.log(`External: ${Math.round(memUsage.external / 1024 / 1024)} MB`);
}

function checkLogFiles() {
  const logDir = './logs';
  if (fs.existsSync(logDir)) {
    const files = fs.readdirSync(logDir);
    console.log('📝 Log files:');
    files.forEach(file => {
      const stats = fs.statSync(`${logDir}/${file}`);
      console.log(`${file}: ${Math.round(stats.size / 1024)} KB`);
    });
  }
}

console.log('🔍 System monitoring...');
checkDiskSpace();
checkMemoryUsage();
checkLogFiles();
```

## Step 10: Deployment Commands

### 10.1 Production Deployment
```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh

# Or run individual steps
npm run build:prod
npm run start:prod
```

### 10.2 Docker Deployment
```bash
# Build Docker image
docker build -t aims-backend .

# Run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 10.3 PM2 Deployment
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# Stop
pm2 stop aims-backend

# Restart
pm2 restart aims-backend
```

## Next Steps
✅ **You've completed the deployment setup!**

**What's next?**
- Set up CI/CD pipeline with GitHub Actions
- Configure monitoring and alerting
- Set up backup strategies
- Implement load balancing if needed

**Current Status:**
- ✅ Production environment configuration
- ✅ Security middleware and rate limiting
- ✅ Error monitoring with Sentry
- ✅ Logging with Winston
- ✅ Docker configuration
- ✅ Database migration scripts
- ✅ Health checks and monitoring
- ✅ PM2 process management

**Deployment Checklist:**
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Initial data seeded
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error monitoring active
- [ ] Logging configured
- [ ] Health checks working
- [ ] SSL certificates configured
- [ ] Domain and DNS configured
