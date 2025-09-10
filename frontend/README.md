# AIMS-Capstone Frontend

This is the frontend application for the AgriVet Integrated Management System (AIMS) Capstone project.

## Features

- **SuperAdmin Dashboard**: Complete administrative interface with all management features
- **Role-based Access**: Organized by user roles and departments
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Component-based Architecture**: Reusable and maintainable code structure

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Recharts** for data visualization
- **React Router** for navigation

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── dashboard/      # Dashboard-specific components
│   ├── pages/              # Page components organized by role
│   │   ├── super-admin/    # SuperAdmin dashboard and features
│   │   ├── auth/           # Authentication pages
│   │   └── pos/            # Point of Sale interface
│   ├── lib/                # Utility libraries
│   │   └── supabase.ts     # Supabase client configuration
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── App.tsx             # Main application component
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## SuperAdmin Dashboard Features

The SuperAdmin dashboard includes comprehensive management features:

### Sales Management
- Sales overview and analytics
- Sales value tracking
- All sales records
- Daily sales summary
- Product sales reports

### Inventory Management
- Inventory summary and tracking
- Product management
- Category management
- Low stock alerts
- Inventory valuation

### Staff & User Management
- User accounts management
- Staff addition and management
- Roles and permissions
- User activity tracking
- Active users monitoring
- User permissions management

### HR Management
- Attendance and timesheet management
- Leave request handling
- Staff performance tracking
- Employee analytics

### Marketing Management
- Marketing dashboard
- Campaign performance tracking
- Channel analytics
- Marketing ROI reports

### Reports & Analytics
- Comprehensive reporting system
- Export functionality
- Performance metrics
- Business intelligence

### System Settings
- General system configuration
- User profile management
- Security settings
- Notification preferences
- Database settings
- Integration management

## Development Notes

- All components use static/dummy data for UI development
- Backend integration is prepared but not active
- TODO comments indicate where API calls will be added
- Responsive design works across all screen sizes
- Modern UI with consistent styling using Tailwind CSS

## Contributing

1. Follow the existing code structure and naming conventions
2. Use TypeScript for type safety
3. Follow the component organization by role/domain
4. Add proper error handling and loading states
5. Ensure responsive design for all new components

## License

This project is part of the AIMS-Capstone development.