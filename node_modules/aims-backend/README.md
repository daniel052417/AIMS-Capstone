# AIMS Backend API Server

This is the backend API server for the AIMS (Agrivet Integrated Management System) project.

## Project Structure

```
backend/
├── package.json              # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── README.md                # This file
└── src/
    ├── index.ts             # Main server entry point
    ├── config/              # Configuration files
    │   ├── env.ts           # Environment variables
    │   └── supabaseClient.ts # Supabase client configuration
    ├── middleware/          # Express middleware
    │   ├── auth.ts          # Authentication middleware
    │   ├── rbac.ts          # Role-based access control
    │   └── errorHandler.ts  # Error handling middleware
    ├── routes/              # API routes
    │   ├── index.ts         # Main router
    │   ├── superAdmin.routes.ts
    │   ├── hr.routes.ts
    │   ├── marketing.routes.ts
    │   ├── pos.routes.ts
    │   ├── inventory.routes.ts
    │   └── client.routes.ts
    ├── controllers/         # Route controllers
    │   ├── superAdmin.controller.ts
    │   ├── hr/
    │   │   ├── admin.controller.ts
    │   │   └── staff.controller.ts
    │   ├── marketing/
    │   │   ├── admin.controller.ts
    │   │   └── staff.controller.ts
    │   ├── pos/
    │   │   └── cashier.controller.ts
    │   ├── inventory/
    │   │   └── clerk.controller.ts
    │   └── client.controller.ts
    ├── services/            # Business logic services
    │   ├── superAdmin.service.ts
    │   ├── hr/
    │   │   ├── admin.service.ts
    │   │   └── staff.service.ts
    │   ├── marketing/
    │   │   ├── admin.service.ts
    │   │   └── staff.service.ts
    │   ├── pos/
    │   │   └── cashier.service.ts
    │   ├── inventory/
    │   │   └── clerk.service.ts
    │   └── client.service.ts
    ├── models/              # Database models
    │   └── index.ts
    ├── utils/               # Utility functions
    │   └── index.ts
    └── types/               # TypeScript type definitions
        └── index.ts
```

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **RESTful API**: Well-structured REST API endpoints
- **Database Integration**: Supabase integration for data persistence
- **Error Handling**: Comprehensive error handling and logging
- **Security**: Helmet for security headers, CORS configuration
- **Validation**: Input validation and sanitization
- **Modular Architecture**: Clean separation of concerns

## API Endpoints

### Super Admin
- `GET /api/v1/super-admin/dashboard` - Dashboard data
- `GET /api/v1/super-admin/users` - User management
- `GET /api/v1/super-admin/roles` - Role management
- `GET /api/v1/super-admin/permissions` - Permission management

### HR Management
- `GET /api/v1/hr/admin/employees` - Employee management
- `GET /api/v1/hr/admin/attendance` - Attendance tracking
- `GET /api/v1/hr/admin/leaves` - Leave management
- `GET /api/v1/hr/admin/payroll` - Payroll management

### Marketing
- `GET /api/v1/marketing/admin/campaigns` - Campaign management
- `GET /api/v1/marketing/admin/templates` - Template management
- `GET /api/v1/marketing/admin/analytics` - Marketing analytics

### POS (Point of Sale)
- `GET /api/v1/pos/dashboard` - POS dashboard
- `GET /api/v1/pos/products` - Product management
- `GET /api/v1/pos/transactions` - Transaction management
- `GET /api/v1/pos/customers` - Customer management

### Inventory
- `GET /api/v1/inventory/dashboard` - Inventory dashboard
- `GET /api/v1/inventory/products` - Product management
- `GET /api/v1/inventory/stock` - Stock management
- `GET /api/v1/inventory/categories` - Category management

### Client API
- `GET /api/v1/client/products` - Public product listing
- `POST /api/v1/client/auth/register` - Customer registration
- `POST /api/v1/client/auth/login` - Customer login
- `GET /api/v1/client/orders` - Order management

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory:
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

3. Start the development server:
```bash
npm run dev
```

4. The server will start on `http://localhost:3001`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm run start` - Start the production server
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Required |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` |
| `MAX_FILE_SIZE` | Maximum file upload size | `5242880` (5MB) |
| `UPLOAD_PATH` | File upload directory | `./uploads` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Maximum requests per window | `100` |

## API Documentation

The API follows RESTful conventions and returns JSON responses. All responses include a `success` boolean field and appropriate data or error messages.

### Response Format

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional message"
}
```

### Error Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Role-Based Access Control

The system implements role-based access control with the following roles:

- `super_admin` - Full system access
- `hr_admin` - HR management access
- `hr_staff` - HR staff operations
- `marketing_admin` - Marketing management access
- `marketing_staff` - Marketing staff operations
- `cashier` - POS operations
- `inventory_clerk` - Inventory management
- `customer` - Customer operations

## Database

The backend uses Supabase as the database service. Make sure to:

1. Set up your Supabase project
2. Run the database migrations
3. Configure the environment variables
4. Set up Row Level Security (RLS) policies

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Write comprehensive tests
5. Update documentation

## License

This project is licensed under the MIT License.

