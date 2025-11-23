# Quick Start Guide

Get the Laptop Check-out System frontend up and running in 5 minutes.

## Prerequisites

- Node.js 18+ or 20+
- pnpm 8+ (install: `npm install -g pnpm`)

## Installation

```bash
# Navigate to frontend directory
cd Intervize/frontend

# Install dependencies
pnpm install
```

## Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env and set your API URL
# VITE_API_URL=http://localhost:3000/api/v1
```

## Run Development Server

```bash
pnpm dev
```

Open http://localhost:5173 in your browser.

## Default Test Accounts (Backend Required)

If your backend has seed data:

**Admin Account**:
- Email: admin@example.com
- Password: admin123

**Regular User Account**:
- Email: user@example.com
- Password: user123

*Note: These are examples. Use actual accounts from your backend.*

## Project Structure

```
frontend/
├── src/
│   ├── pages/           # Page components
│   │   ├── LoginPage.tsx
│   │   ├── HomePage.tsx
│   │   └── admin/       # Admin pages
│   ├── components/      # Reusable components
│   ├── services/        # API services
│   └── contexts/        # React contexts
├── .env                 # Environment variables
└── README.md           # Full documentation
```

## Available Pages

### Public
- `/login` - Login page

### Protected (Requires Login)
- `/` - User home page
- `/scan` - QR scanner (placeholder)

### Admin Only
- `/admin/dashboard` - Admin dashboard
- `/admin/laptops` - Laptop management
- `/admin/users` - User management

## Common Tasks

### Add a New User (Admin)
1. Login as admin
2. Navigate to `/admin/users`
3. Click "Add User"
4. Fill in the form
5. Click "Create"

### Add a New Laptop (Admin)
1. Login as admin
2. Navigate to `/admin/laptops`
3. Click "Add Laptop"
4. Fill in details (Make, Model, Serial Number)
5. Click "Create"
6. Download QR code for printing

### View Active Checkouts (Admin)
1. Login as admin
2. Navigate to `/admin/dashboard`
3. View the "Active Checkouts" table

## Build for Production

```bash
pnpm build
```

Output will be in `dist/` directory.

## Troubleshooting

### Port 5173 Already in Use
Vite will automatically use the next available port (5174, 5175, etc.)

### API Connection Errors
- Verify backend is running on `http://localhost:3000`
- Check VITE_API_URL in `.env` file
- Look for CORS errors in browser console

### Build Errors
```bash
# Clear and reinstall
rm -rf node_modules
pnpm install

# Clear build cache
rm -rf dist
```

## Next Steps

- Read [README.md](../frontend/README.md) for full documentation
- Read [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Check backend API documentation for endpoint details

## Need Help?

- Check browser console for errors
- Verify backend API is running
- Review [README.md](../frontend/README.md) for detailed information
- Contact the development team

## Features Overview

✅ **Working Now**:
- Login/Logout
- User dashboard
- Admin dashboard with real-time updates
- Laptop management (CRUD)
- User management (CRUD)
- Role-based access control

🚧 **Coming Soon** (Future Phases):
- QR code scanning
- Check-out/Check-in flows
- Lost & Found detection
- Password reset

---

**Happy Coding!** 🚀
