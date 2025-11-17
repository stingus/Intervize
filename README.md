# Laptop Check-out System

A web-based laptop check-out/check-in management system that enables users to borrow shared laptops from storage using QR code scanning.

## Project Structure

```
laptop-checkout-system/
├── backend/          # NestJS backend application
├── frontend/         # React frontend application (to be implemented)
├── docker-compose.yml
└── README.md
```

## Tech Stack

### Backend
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache & Queue**: Redis + Bull
- **Authentication**: JWT with Passport
- **Validation**: class-validator
- **Security**: Helmet, CORS, Rate Limiting
- **QR Code**: qrcode library

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Package Manager**: pnpm

## Features Implemented

### Phase 1: Foundation & Setup
- [x] NestJS project structure with TypeScript
- [x] Prisma ORM with PostgreSQL
- [x] Database schema with all required tables
- [x] Redis & Bull queue setup
- [x] JWT authentication with token rotation
- [x] Role-based access control (Admin/Interviewer)
- [x] API versioning (/api/v1/)
- [x] Global exception filter with error codes
- [x] Security (Helmet, CORS, Rate Limiting)
- [x] Input validation with class-validator
- [x] Docker Compose configuration

### Phase 2: Core Laptop Management
- [x] Laptop CRUD operations with soft delete
- [x] QR code generation for each laptop
- [x] Laptop status management (Available, Checked-out, Maintenance, Retired)
- [x] Laptop history tracking
- [x] User CRUD operations with soft delete
- [x] User invitation flow structure
- [x] Password hashing with bcrypt

## Prerequisites

- Node.js 18+
- pnpm (install with `npm install -g pnpm`)
- Docker & Docker Compose
- PostgreSQL 16+ (or use Docker)
- Redis (or use Docker)

## Getting Started

### 1. Clone and Setup

```bash
cd laptop-checkout-system/backend
cp .env.example .env
# Edit .env file with your configuration
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Database Setup

#### Option A: Using Docker Compose (Recommended)

```bash
# Start PostgreSQL and Redis
cd ..
docker compose up -d postgres redis
```

#### Option B: Local Installation

Install PostgreSQL and Redis locally and update the `.env` file with your connection strings.

### 4. Run Migrations

```bash
cd backend
pnpm prisma generate
pnpm prisma migrate dev --name init
```

### 5. Seed Database (Optional)

Create an admin user manually:

```bash
pnpm prisma studio
```

Then create a user with:
- Email: admin@example.com
- Password: (use bcrypt to hash: `Admin123!`)
- Role: admin

Or use the following SQL:

```sql
INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5kuWv4NfqkR8i', -- Password: Admin123!
  'Admin User',
  'admin',
  NOW(),
  NOW()
);
```

### 6. Start Development Server

```bash
pnpm run start:dev
```

The API will be available at `http://localhost:3000`

### 7. Using Docker Compose (Full Stack)

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f backend

# Stop all services
docker compose down
```

## API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

```http
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
GET    /api/v1/auth/me
```

### User Endpoints (Admin Only)

```http
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
GET    /api/v1/users/me       (Current user)
PATCH  /api/v1/users/me       (Update own profile)
```

### Laptop Endpoints

```http
GET    /api/v1/laptops                    (All users)
GET    /api/v1/laptops/:id                (All users)
GET    /api/v1/laptops/unique/:uniqueId   (All users - QR scan)
POST   /api/v1/laptops                    (Admin only)
PATCH  /api/v1/laptops/:id                (Admin only)
DELETE /api/v1/laptops/:id                (Admin only)
GET    /api/v1/laptops/:id/history        (Admin only)
GET    /api/v1/laptops/:id/qr-code        (Admin only)
```

## Example API Requests

### 1. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin"
    },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  },
  "message": "Login successful"
}
```

### 2. Create Laptop (Admin)

```bash
curl -X POST http://localhost:3000/api/v1/laptops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "serialNumber": "SN123456",
    "make": "Dell",
    "model": "Latitude 5420",
    "status": "available"
  }'
```

### 3. Get All Laptops

```bash
curl -X GET http://localhost:3000/api/v1/laptops \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Create User (Admin)

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "name": "John Doe",
    "role": "interviewer",
    "groupName": "Engineering",
    "team": "Backend"
  }'
```

## Database Schema

### Tables

- **users**: User accounts with soft delete
- **laptops**: Laptop inventory with soft delete
- **checkouts**: Check-out/check-in records
- **lost_found_events**: Lost and found event tracking
- **audit_logs**: System audit trail
- **notification_logs**: Email notification tracking

### View Schema

```bash
pnpm prisma studio
```

Or generate ERD:

```bash
pnpm prisma generate
```

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for access tokens
- `JWT_REFRESH_SECRET`: Secret for refresh tokens
- `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed origins
- `APP_URL`: Frontend application URL (for QR codes)

## Security Features

1. **Authentication**: JWT-based with access and refresh tokens
2. **Authorization**: Role-based access control (RBAC)
3. **Password Security**: bcrypt with cost factor 12
4. **CORS**: Whitelisted origins only
5. **Rate Limiting**: Configurable per endpoint
6. **Helmet**: Security headers
7. **Input Validation**: class-validator on all DTOs
8. **Soft Delete**: Data preservation for users and laptops

## Error Handling

All errors follow a standardized format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {},
    "timestamp": "2025-11-16T10:30:00Z",
    "path": "/api/v1/endpoint"
  }
}
```

Error code prefixes:
- `VAL_`: Validation errors (400)
- `AUTH_`: Authentication errors (401)
- `PERM_`: Permission errors (403)
- `NOT_FOUND_`: Resource not found (404)
- `BIZ_`: Business logic errors (409)
- `RATE_`: Rate limiting (429)
- `SRV_`: Server errors (500)

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run start:dev

# Build for production
pnpm run build

# Run production
pnpm run start:prod

# Run tests
pnpm test

# Run tests with coverage
pnpm run test:cov

# Prisma commands
pnpm prisma generate      # Generate Prisma Client
pnpm prisma migrate dev   # Create and apply migration
pnpm prisma studio        # Open Prisma Studio
pnpm prisma format        # Format schema file
```

## Docker Commands

```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d postgres

# View logs
docker compose logs -f backend

# Restart service
docker compose restart backend

# Stop all services
docker compose down

# Remove volumes (caution: deletes data)
docker compose down -v
```

## Project Status

### Completed
- Phase 1: Foundation & Setup
- Phase 2: Core Laptop Management

### Next Steps
- Phase 3: Check-out/Check-in Flow
- Phase 4: Lost & Found Functionality
- Phase 5: Admin Dashboard & Overdue Management
- Phase 6: User Management Polish
- Phase 7: Testing
- Phase 8: Deployment

## API Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

## License

ISC

## Support

For issues or questions, please contact the development team.
