"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    supabase: {
        url: process.env.SUPABASE_URL || '',
        anonKey: process.env.SUPABASE_ANON_KEY || '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        uploadPath: process.env.UPLOAD_PATH || './uploads'
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
    },
    database: {
        connectionString: process.env.DATABASE_URL || '',
        ssl: process.env.NODE_ENV === 'production'
    }
};
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => {
        console.error(`   - ${envVar}`);
    });
    process.exit(1);
}
exports.default = exports.config;
//# sourceMappingURL=env.js.map