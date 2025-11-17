# Laptop Check-out System - Frontend

A modern React + TypeScript frontend application for managing laptop inventory and check-out/check-in operations.

## Features

### Phase 1 & 2 (Current Implementation)

- **Authentication System**
  - Email/password login
  - JWT token-based authentication
  - Automatic token refresh
  - Protected routes
  - Role-based access control (Admin/Interviewer)

- **User Dashboard**
  - View current checked-out laptop
  - Real-time checkout duration timer
  - Overdue status indicators
  - Quick access to QR scanner

- **Admin Dashboard**
  - Summary cards (Total, Available, Checked Out, Overdue laptops)
  - Active checkouts table with real-time updates
  - Overdue laptops list with alerts
  - Lost & Found events log

- **Laptop Management (Admin)**
  - View all laptops in inventory
  - Add new laptops with details
  - Edit laptop information
  - Soft delete laptops
  - Download QR codes for printing
  - Status management (Available, Checked Out, Maintenance, Retired)

- **User Management (Admin)**
  - View all users
  - Create new user accounts
  - Edit user information
  - Role assignment (Admin/Interviewer)
  - Soft delete users
  - Group and team assignment

### Coming in Future Phases

- QR code scanning functionality
- Check-out/Check-in flows
- Lost & Found detection
- Password reset functionality
- Email notifications
- Enhanced reporting

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript (strict mode)
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router DOM v7
- **State Management**:
  - React Context (Auth state)
  - React Query (Server state)
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios with interceptors
- **Date Utilities**: date-fns

## Prerequisites

- Node.js 18+ or 20+
- pnpm 8+ (as per project requirements)
- Backend API running on http://localhost:3000 (or configured URL)

## Installation

1. **Clone the repository** (if not already done)
   ```bash
   cd /path/to/laptop-checkout-system/frontend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your API URL:
   ```
   VITE_API_URL=http://localhost:3000/api/v1
   VITE_ENV=development
   ```

## Development

### Start development server

```bash
pnpm dev
```

The app will be available at `http://localhost:5173` (or the next available port).

### Build for production

```bash
pnpm build
```

### Preview production build

```bash
pnpm preview
```

### Type checking

```bash
pnpm tsc --noEmit
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx       # Main layout with navigation
│   │   └── ProtectedRoute.tsx  # Route protection wrapper
│   ├── pages/               # Page components
│   │   ├── LoginPage.tsx    # Login page
│   │   ├── HomePage.tsx     # User home page
│   │   ├── QRScanPage.tsx   # QR scanner (placeholder)
│   │   └── admin/           # Admin pages
│   │       ├── DashboardPage.tsx
│   │       ├── LaptopManagementPage.tsx
│   │       └── UserManagementPage.tsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication context
│   ├── services/            # API service layer
│   │   ├── authService.ts
│   │   ├── laptopService.ts
│   │   ├── userService.ts
│   │   ├── checkoutService.ts
│   │   └── dashboardService.ts
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   └── axios.ts         # Axios instance with interceptors
│   ├── App.tsx              # Main app component with routing
│   └── main.tsx             # App entry point
├── .env.example             # Environment variables template
├── .env                     # Environment variables (not in git)
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint (when configured)

## Authentication Flow

1. User enters email and password on login page
2. Frontend sends credentials to `/api/v1/auth/login`
3. Backend returns user data and JWT tokens (access + refresh)
4. Tokens are stored in localStorage
5. Axios interceptor adds access token to all requests
6. On 401 error, interceptor attempts to refresh token
7. If refresh succeeds, retry original request
8. If refresh fails, redirect to login

## API Integration

All API calls go through service layers in `src/services/`. Each service uses the configured Axios instance with:

- Automatic authentication token injection
- Token refresh on 401 errors
- Error handling and standardized responses
- Type safety with TypeScript

### API Base URL

Configured via environment variable:
```
VITE_API_URL=http://localhost:3000/api/v1
```

## State Management

### Authentication State
- Managed by `AuthContext` using React Context
- Persisted in localStorage
- Automatically loaded on app start

### Server State
- Managed by React Query (@tanstack/react-query)
- Automatic caching and invalidation
- Optimistic updates
- Background refetching

### Form State
- Managed by React Hook Form
- Schema validation with Zod
- Error handling and display

## Routing

Protected routes require authentication. Admin routes require admin role.

- `/login` - Public login page
- `/` - User home page (protected)
- `/scan` - QR scanner page (protected, placeholder)
- `/admin/dashboard` - Admin dashboard (protected, admin only)
- `/admin/laptops` - Laptop management (protected, admin only)
- `/admin/users` - User management (protected, admin only)

## Styling

- Material-UI components with custom theme
- Responsive design (mobile-first)
- Consistent color scheme and typography
- WCAG 2.1 AA accessibility compliance

## Mobile Responsiveness

The application is fully responsive and mobile-optimized:
- Flexible grid layouts
- Responsive tables
- Touch-friendly buttons and inputs
- Mobile-first breakpoints

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Security Features

- JWT token authentication
- Automatic token refresh
- Protected routes
- Role-based access control
- HTTPS required in production
- No sensitive data in localStorage (only tokens and basic user info)

## Performance Optimization

- Code splitting with React Router
- React Query caching
- Lazy loading of admin pages
- Optimized re-renders with React.memo
- Debounced search inputs (when implemented)

## Known Limitations (Phase 1 & 2)

- QR scanning not yet implemented
- Password reset UI present but needs backend
- No email notifications yet
- Lost & Found detection pending
- No bulk operations

## Troubleshooting

### Port already in use
If port 5173 is in use, Vite will automatically use the next available port.

### API connection errors
- Ensure backend is running on http://localhost:3000
- Check VITE_API_URL in .env file
- Check browser console for CORS errors

### Build errors
- Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

## Testing (Future)

Testing will be added in Phase 7:
- Unit tests with Jest
- Component tests with React Testing Library
- E2E tests with Cypress

## Contributing

1. Follow TypeScript strict mode requirements
2. Use Material-UI components
3. Follow existing code structure
4. Add proper error handling
5. Include loading states for async operations
6. Ensure mobile responsiveness

## License

[To be determined]

## Support

For issues or questions, contact the development team.
