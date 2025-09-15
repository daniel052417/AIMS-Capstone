// Backend-specific types
// TODO: Implement backend types
export * from './auth';
export * from './database';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface FilterParams {
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: any;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface FileUploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  uploadPath: string;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export interface LogConfig {
  level: string;
  format: string;
  filename?: string;
}

export interface ServerConfig {
  port: number;
  host: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  helmet: boolean;
  morgan: boolean;
}

// TODO: Add more backend-specific types as needed

