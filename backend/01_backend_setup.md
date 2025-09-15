# 01 - Backend Setup Guide

## Overview
This guide will help you set up the foundational infrastructure for your AIMS backend using Node.js, Express.js, TypeScript, and Supabase.

## Prerequisites
- Node.js 18+ installed
- Supabase account and project
- Git repository initialized
- Code editor (VS Code recommended)

## Step 1: Environment Configuration

### 1.1 Create Environment Files
```bash
# In backend/ directory
touch .env
touch .env.example
touch .env.local
```

### 1.2 Configure Environment Variables
**File: `.env.example`**
```env
# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Database Configuration
DATABASE_URL=your_supabase_database_url

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/

# Email Configuration (if using email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**File: `.env`** (copy from .env.example and fill in your values)
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Get these from your Supabase project settings
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Generate a strong JWT secret
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 1.3 Update Environment Configuration
**File: `src/config/env.ts`**
```typescript
import dotenv from 'dotenv';

dotenv.config();

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

## Step 2: Supabase Client Configuration

### 2.1 Update Supabase Client
**File: `src/config/supabaseClient.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';
import { config } from './env';

// Client for user operations (uses anon key)
export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Admin client for server operations (uses service role key)
export const supabaseAdmin = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database types (you'll update these after running schema)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string;
          branch_id?: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_login?: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string;
          branch_id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string;
          branch_id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string;
        };
      };
      // Add other table types as needed
    };
  };
};
```

## Step 3: Database Schema Integration

### 3.1 Run Database Schema Modules
Execute the SQL modules in this order:

```bash
# Connect to your Supabase database and run:
# 1. 01_core_functions.sql
# 2. 02_auth_users.sql
# 3. 03_branches.sql
# 4. 04_products_inventory.sql
# 5. 05_suppliers_purchasing.sql
# 6. 06_customers_orders.sql
# 7. 07_payments.sql
# 8. 08_marketing_promotions.sql
# 9. 09_audit_logs.sql
# 10. 10_system_settings.sql
# 11. 11_views.sql
```

### 3.2 Generate TypeScript Types
```bash
# Install Supabase CLI
npm install -g supabase

# Generate types from your database
supabase gen types typescript --project-id your-project-id > src/types/database.ts
```

## Step 4: Base Express Server Setup

### 4.1 Update Main Server File
**File: `src/index.ts`** (already exists, verify it matches)
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { config } from './config/env';

// Load environment variables
dotenv.config();

const app = express();
const PORT = config.PORT;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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
    version: '1.0.0'
  });
});

// API routes
app.use('/', routes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
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
```

## Step 5: Development Scripts

### 5.1 Update Package.json Scripts
**File: `package.json`** (verify these scripts exist)
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "type-check": "tsc --noEmit",
    "db:generate-types": "supabase gen types typescript --project-id your-project-id > src/types/database.ts"
  }
}
```

## Step 6: Testing the Setup

### 6.1 Start Development Server
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 6.2 Test Health Endpoint
```bash
# Test health check
curl http://localhost:3001/health

# Expected response:
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "version": "1.0.0"
}
```

### 6.3 Test API Info Endpoint
```bash
# Test API info
curl http://localhost:3001/v1

# Expected response:
{
  "success": true,
  "message": "AIMS API Server",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/v1/auth",
    "superAdmin": "/v1/super-admin",
    // ... other endpoints
  }
}
```

## Step 7: File Structure Verification

Your backend should now have this structure:
```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   └── supabaseClient.ts
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── index.ts
├── dist/ (after build)
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

## Next Steps
✅ **You've completed the backend setup!**

**What's next?**
- Move to `02_auth_module.md` to implement authentication
- Or run `npm run dev` to start developing

**Troubleshooting:**
- Check environment variables are set correctly
- Verify Supabase connection
- Ensure all dependencies are installed
- Check console for any error messages

**Current Status:**
- ✅ Environment configuration
- ✅ Supabase client setup
- ✅ Express server running
- ✅ Health check working
- ✅ API routes structure ready
