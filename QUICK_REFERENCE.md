# Quick Reference Guide

## Common Commands

### Start Services

```bash
# Start databases only
docker compose up -d postgres redis

# Start all services (including backend)
docker compose up -d

# View logs
docker compose logs -f backend

# Stop all services
docker compose down
```

### Backend Development

```bash
cd backend

# Install dependencies
pnpm install

# Start dev server
pnpm run start:dev

# Build for production
pnpm run build

# Run production
pnpm run start:prod
```

### Database Operations

```bash
# Generate Prisma Client
pnpm prisma generate

# Create migration
pnpm prisma migrate dev --name migration_name

# Apply migrations (production)
pnpm prisma migrate deploy

# Reset database (dev only - deletes all data!)
pnpm prisma migrate reset

# Seed database
pnpm prisma:seed

# Open Prisma Studio
pnpm prisma studio
```

## API Testing Examples

### 1. Login (Get Access Token)

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

Save the `accessToken` from the response.

### 2. Get Current User

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Create Laptop

```bash
curl -X POST http://localhost:3000/api/v1/laptops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "serialNumber": "SN789012",
    "make": "Apple",
    "model": "MacBook Pro 14",
    "status": "available"
  }'
```

### 4. Get All Laptops

```bash
curl -X GET http://localhost:3000/api/v1/laptops \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Get Laptop by Unique ID (QR Scan)

```bash
curl -X GET http://localhost:3000/api/v1/laptops/unique/LAP-DEMO-001 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Create User

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "email": "newuser@example.com",
    "password": "Password123!",
    "name": "Jane Smith",
    "role": "interviewer",
    "groupName": "Engineering",
    "team": "Frontend"
  }'
```

### 7. Update Laptop Status

```bash
curl -X PATCH http://localhost:3000/api/v1/laptops/LAPTOP_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "status": "maintenance"
  }'
```

### 8. Get Laptop QR Code

```bash
curl -X GET http://localhost:3000/api/v1/laptops/LAPTOP_ID/qr-code \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Default Credentials

After running `pnpm prisma:seed`:

### Admin Account
- Email: `admin@example.com`
- Password: `Admin123!`
- Role: admin
- Can access all endpoints

### User Account
- Email: `user@example.com`
- Password: `User123!`
- Role: interviewer
- Limited access

## Environment Variables

Quick reference for `.env` file:

```env
# Server
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/laptop_checkout

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=development-secret
JWT_REFRESH_SECRET=development-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# App
APP_URL=http://localhost:3001
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

## Common Issues

### Port 3000 already in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 PID

# Or change PORT in .env
```

### Database connection error
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Restart PostgreSQL
docker compose restart postgres

# Check DATABASE_URL in .env
```

### Redis connection error
```bash
# Check if Redis is running
docker compose ps redis

# Restart Redis
docker compose restart redis

# Test Redis
docker compose exec redis redis-cli ping
```

### Prisma Client errors
```bash
# Regenerate Prisma Client
pnpm prisma generate

# Check if migrations are applied
pnpm prisma migrate status
```

### Permission errors
```bash
# Fix node_modules permissions
sudo chown -R $(whoami) node_modules
```

## Project Structure

```
backend/
├── src/
│   ├── auth/           # Authentication (login, JWT)
│   ├── users/          # User management
│   ├── laptops/        # Laptop management
│   ├── common/         # Shared utilities
│   │   ├── decorators/ # @CurrentUser, @Roles
│   │   ├── filters/    # Exception filters
│   │   ├── guards/     # Auth & Role guards
│   │   └── enums/      # Error codes
│   ├── config/         # Prisma service
│   ├── app.module.ts   # Main module
│   └── main.ts         # Bootstrap
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── seed.ts         # Seed data
├── .env                # Environment variables
├── package.json
└── tsconfig.json
```

## Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Business logic error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Response Format

### Success
```json
{
  "success": true,
  "data": { /* ... */ },
  "message": "Operation successful"
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {},
    "timestamp": "2025-11-16T10:30:00Z",
    "path": "/api/v1/endpoint"
  }
}
```

## Laptop Status Values

- `available` - Can be checked out
- `checked_out` - Currently borrowed
- `maintenance` - Not available
- `retired` - No longer in use (admin only)

## User Roles

- `interviewer` - Regular user
- `admin` - Full access

## Useful Links

- Prisma Studio: http://localhost:5555
- API Base URL: http://localhost:3000/api/v1
- Swagger (future): http://localhost:3000/api

## Next Steps

1. Start databases: `docker compose up -d postgres redis`
2. Install deps: `cd backend && pnpm install`
3. Setup DB: `pnpm prisma migrate dev --name init`
4. Seed data: `pnpm prisma:seed`
5. Start server: `pnpm run start:dev`
6. Test login with curl command above
7. Start building Phase 3 (Checkout flow)

## Support

- Main README: `../README.md`
- Setup Guide: `./backend/SETUP.md`
- Implementation Summary: `../IMPLEMENTATION_SUMMARY.md`
