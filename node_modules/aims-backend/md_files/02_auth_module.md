# 02 - Authentication Module Guide

## Overview
This guide will implement JWT-based authentication with bcrypt password hashing and Joi validation for your AIMS backend.

## Prerequisites
- ✅ Backend setup completed (01_backend_setup.md)
- ✅ Database schema modules executed
- ✅ Supabase client configured

## Step 1: Authentication Types

### 1.1 Create Authentication Types
**File: `src/types/auth.ts`**
```typescript
export interface User {
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
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  branch_id?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    access_token: string;
    refresh_token: string;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
  branchId?: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}
```

## Step 2: JWT Utility Functions

### 2.1 Create JWT Utilities
**File: `src/utils/jwt.ts`**
```typescript
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JWTPayload } from '../types/auth';

export class JWTUtils {
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
      issuer: 'aims-backend',
      audience: 'aims-frontend'
    });
  }

  static generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN,
      issuer: 'aims-backend',
      audience: 'aims-frontend'
    });
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.JWT_SECRET, {
        issuer: 'aims-backend',
        audience: 'aims-frontend'
      }) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static extractTokenFromHeader(authHeader: string | undefined): string {
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Invalid authorization header format');
    }

    return parts[1];
  }
}
```

## Step 3: Password Utilities

### 3.1 Create Password Utilities
**File: `src/utils/password.ts`**
```typescript
import bcrypt from 'bcryptjs';

export class PasswordUtils {
  private static readonly SALT_ROUNDS = 12;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

## Step 4: Validation Schemas

### 4.1 Create Joi Validation Schemas
**File: `src/utils/validation.ts`**
```typescript
import Joi from 'joi';

export const authValidation = {
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(8)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'any.required': 'Password is required'
      })
  }),

  register: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }),
    first_name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name must not exceed 50 characters',
        'any.required': 'First name is required'
      }),
    last_name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name must not exceed 50 characters',
        'any.required': 'Last name is required'
      }),
    phone: Joi.string()
      .pattern(/^[\+]?[1-9][\d]{0,15}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    branch_id: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'Please provide a valid branch ID'
      })
  }),

  refreshToken: Joi.object({
    refresh_token: Joi.string()
      .required()
      .messages({
        'any.required': 'Refresh token is required'
      })
  })
};

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};
```

## Step 5: Authentication Service

### 5.1 Create Authentication Service
**File: `src/services/auth.service.ts`**
```typescript
import { supabaseAdmin } from '../config/supabaseClient';
import { JWTUtils } from '../utils/jwt';
import { PasswordUtils } from '../utils/password';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

export class AuthService {
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', data.email)
        .single();

      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }

      // Validate password strength
      const passwordValidation = PasswordUtils.validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors
        };
      }

      // Hash password
      const hashedPassword = await PasswordUtils.hashPassword(data.password);

      // Create user in database
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .insert({
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          branch_id: data.branch_id,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create auth user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        user_metadata: {
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          branch_id: data.branch_id
        }
      });

      if (authError) {
        // Rollback user creation
        await supabaseAdmin
          .from('users')
          .delete()
          .eq('id', user.id);
        
        throw authError;
      }

      // Generate tokens
      const accessToken = JWTUtils.generateAccessToken({
        userId: user.id,
        email: user.email,
        branchId: user.branch_id
      });

      const refreshToken = JWTUtils.generateRefreshToken({
        userId: user.id,
        email: user.email,
        branchId: user.branch_id
      });

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          access_token: accessToken,
          refresh_token: refreshToken
        }
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed'
      };
    }
  }

  static async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (authError) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Get user from database
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .eq('is_active', true)
        .single();

      if (userError || !user) {
        return {
          success: false,
          message: 'User not found or inactive'
        };
      }

      // Update last login
      await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Generate tokens
      const accessToken = JWTUtils.generateAccessToken({
        userId: user.id,
        email: user.email,
        branchId: user.branch_id
      });

      const refreshToken = JWTUtils.generateRefreshToken({
        userId: user.id,
        email: user.email,
        branchId: user.branch_id
      });

      return {
        success: true,
        message: 'Login successful',
        data: {
          user,
          access_token: accessToken,
          refresh_token: refreshToken
        }
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  }

  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const payload = JWTUtils.verifyToken(refreshToken);

      // Get user from database
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', payload.userId)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return {
          success: false,
          message: 'User not found or inactive'
        };
      }

      // Generate new tokens
      const newAccessToken = JWTUtils.generateAccessToken({
        userId: user.id,
        email: user.email,
        branchId: user.branch_id
      });

      const newRefreshToken = JWTUtils.generateRefreshToken({
        userId: user.id,
        email: user.email,
        branchId: user.branch_id
      });

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user,
          access_token: newAccessToken,
          refresh_token: newRefreshToken
        }
      };
    } catch (error: any) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        message: 'Invalid or expired refresh token'
      };
    }
  }

  static async logout(userId: string): Promise<AuthResponse> {
    try {
      // In a real implementation, you might want to blacklist the token
      // For now, we'll just return success
      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error: any) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed'
      };
    }
  }
}
```

## Step 6: Authentication Controller

### 6.1 Create Authentication Controller
**File: `src/controllers/auth.controller.ts`**
```typescript
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { validateRequest } from '../utils/validation';
import { authValidation } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.refreshToken(req.body.refresh_token);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const result = await AuthService.logout(userId);
    
    res.status(200).json(result);
  });
}
```

## Step 7: Authentication Routes

### 7.1 Create Authentication Routes
**File: `src/routes/auth.routes.ts`**
```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../utils/validation';
import { authValidation } from '../utils/validation';

const router = Router();

// Public routes
router.post('/register', 
  validateRequest(authValidation.register),
  AuthController.register
);

router.post('/login', 
  validateRequest(authValidation.login),
  AuthController.login
);

router.post('/refresh-token', 
  validateRequest(authValidation.refreshToken),
  AuthController.refreshToken
);

// Protected routes (will add auth middleware later)
router.post('/logout', AuthController.logout);

export default router;
```

## Step 8: Authentication Middleware

### 8.1 Create Authentication Middleware
**File: `src/middleware/auth.ts`**
```typescript
import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwt';
import { supabaseAdmin } from '../config/supabaseClient';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role?: string;
    branchId?: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);
    
    // Verify token
    const payload = JWTUtils.verifyToken(token);
    
    // Get user from database to ensure they're still active
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, is_active, branch_id')
      .eq('id', payload.userId)
      .single();

    if (error || !user || !user.is_active) {
      res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
      return;
    }

    // Attach user info to request
    req.user = {
      userId: user.id,
      email: user.email,
      branchId: user.branch_id
    };

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid token'
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      next();
      return;
    }

    const token = JWTUtils.extractTokenFromHeader(authHeader);
    const payload = JWTUtils.verifyToken(token);
    
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, is_active, branch_id')
      .eq('id', payload.userId)
      .single();

    if (user && user.is_active) {
      req.user = {
        userId: user.id,
        email: user.email,
        branchId: user.branch_id
      };
    }

    next();
  } catch (error) {
    // If token is invalid, continue without user info
    next();
  }
};
```

## Step 9: Testing Authentication

### 9.1 Test Registration
```bash
curl -X POST http://localhost:3001/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890"
  }'
```

### 9.2 Test Login
```bash
curl -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### 9.3 Test Protected Route
```bash
# Use the access_token from login response
curl -X POST http://localhost:3001/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Step 10: Update Main Types

### 10.1 Update Main Types File
**File: `src/types/index.ts`**
```typescript
export * from './auth';
export * from './database';
```

## Next Steps
✅ **You've completed the authentication module!**

**What's next?**
- Move to `03_role_permission_module.md` to implement RBAC
- Or test your authentication endpoints

**Current Status:**
- ✅ JWT token generation and verification
- ✅ Password hashing with bcrypt
- ✅ Joi validation schemas
- ✅ User registration and login
- ✅ Token refresh functionality
- ✅ Authentication middleware
- ✅ Protected routes ready

**Testing Checklist:**
- [ ] Registration with valid data works
- [ ] Registration with invalid data returns errors
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials fails
- [ ] Token refresh works
- [ ] Protected routes require valid token
- [ ] Password strength validation works
