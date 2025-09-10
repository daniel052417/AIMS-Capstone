# AIMS - Agrivet Integrated Management System

A comprehensive management system for agricultural supply businesses, built with React, TypeScript, Express.js, and Supabase.

## Project Structure

```
AIMS-Capstone/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/           # Role-based pages
│   │   │   ├── super-admin/ # SuperAdmin dashboard pages
│   │   │   ├── hr/          # HR management pages
│   │   │   ├── marketing/   # Marketing pages
│   │   │   ├── pos/         # POS system pages
│   │   │   ├── inventory/   # Inventory management pages
│   │   │   ├── client/      # Client-facing pages
│   │   │   └── auth/        # Authentication pages
│   │   ├── components/      # Reusable UI components
│   │   ├── layouts/         # Layout components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and services
│   │   └── types/           # TypeScript type definitions
├── backend/                 # Express.js + TypeScript backend
│   ├── src/
│   │   ├── routes/          # API routes by role/domain
│   │   ├── controllers/     # Route controllers
│   │   ├── services/        # Business logic services
│   │   ├── middleware/      # Express middleware
│   │   ├── config/          # Configuration files
│   │   └── types/           # Backend-specific types
│   └── supabase/            # Database migrations
├── shared/                  # Shared types, constants, and utilities
│   ├── src/
│   │   ├── types/           # Shared TypeScript types
│   │   ├── constants/       # Shared constants
│   │   └── utils/           # Shared utility functions
└── package.json             # Root package.json for monorepo
```

## Features

### SuperAdmin Dashboard
- **Overview**: Comprehensive dashboard with key metrics
- **Sales Management**: Sales records, analytics, and reporting
- **Inventory Management**: Product management, categories, low stock alerts
- **HR Management**: Staff management, attendance, leave requests, payroll
- **Marketing Management**: Campaign management, templates, analytics
- **User Management**: User accounts, roles, permissions, activity logs
- **Reports & Analytics**: Comprehensive reporting system
- **Settings**: System configuration and settings

### Role-Based Access Control
- **Super Admin**: Full system access
- **HR Admin/Staff**: Human resources management
- **Marketing Admin/Staff**: Marketing and campaign management
- **POS Cashier**: Point of sale operations
- **Inventory Clerk**: Inventory management
- **Client**: Customer-facing features

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Recharts** for data visualization
- **React Router** for navigation
- **Supabase** for authentication and real-time data

### Backend
- **Express.js** with TypeScript
- **Supabase** for database and authentication
- **PostgreSQL** database
- **CORS** for cross-origin requests
- **Helmet** for security
- **Morgan** for logging
- **Dotenv** for environment variables

### Development Tools
- **ESLint** for code linting
- **PostCSS** and **Autoprefixer** for CSS processing
- **Nodemon** for backend development
- **Concurrently** for running multiple processes

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AIMS-Capstone
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   
   **Backend** (`backend/.env`):
   ```env
   PORT=3000
   NODE_ENV=development
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   FRONTEND_URL=http://localhost:5173
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=24h
   ```

   **Frontend** (`frontend/.env`):
   ```env
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. **Set up Supabase database**
   - Run the migrations in `backend/supabase/migrations/`
   - Set up Row Level Security (RLS) policies
   - Configure authentication settings

### Development

1. **Start all services**
   ```bash
   npm run dev
   ```

2. **Start individual services**
   ```bash
   # Frontend only
   npm run dev:frontend
   
   # Backend only
   npm run dev:backend
   
   # Shared package only
   npm run dev:shared
   ```

### Production

1. **Build all packages**
   ```bash
   npm run build
   ```

2. **Start production servers**
   ```bash
   # Backend
   cd backend && npm start
   
   # Frontend (serve built files)
   cd frontend && npm run preview
   ```

## API Endpoints

### SuperAdmin Routes (`/api/super-admin`)
- `GET /dashboard` - Dashboard overview
- `GET /overview` - Detailed overview data
- `GET /sales/*` - Sales management endpoints
- `GET /inventory/*` - Inventory management endpoints
- `GET /hr/*` - HR management endpoints
- `GET /marketing/*` - Marketing management endpoints
- `GET /users/*` - User management endpoints
- `GET /staff/*` - Staff management endpoints
- `GET /reports/*` - Reports and analytics endpoints
- `GET /settings` - System settings

## Database Schema

The system uses Supabase (PostgreSQL) with the following main tables:
- `users` - User accounts and authentication
- `staff` - Staff/employee information
- `branches` - Branch/location information
- `roles` - User roles and permissions
- `products` - Product catalog
- `inventory` - Inventory management
- `sales_transactions` - Sales records
- `attendance_records` - Staff attendance
- `leave_requests` - Leave management
- `marketing_campaigns` - Marketing campaigns
- And many more...

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.