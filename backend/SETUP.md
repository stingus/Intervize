# Backend Setup Guide

## Quick Start

### 1. Start Database Services

```bash
# From the root directory
cd laptop-checkout-system
docker compose up -d postgres redis
```

Wait for services to be healthy:
```bash
docker compose ps
```

### 2. Install Dependencies

```bash
cd backend
pnpm install
```

### 3. Setup Environment

```bash
# .env file is already created, but verify the settings
cat .env
```

### 4. Generate Prisma Client

```bash
pnpm prisma generate
```

### 5. Create Database & Run Migrations

```bash
pnpm prisma migrate dev --name init
```

This will:
- Create the database if it doesn't exist
- Run all migrations
- Generate Prisma Client

### 6. Seed Database (Optional but Recommended)

```bash
pnpm prisma:seed
```

This creates:
- **Admin User**:
  - Email: `admin@example.com`
  - Password: `Admin123!`

- **Interviewer User**:
  - Email: `user@example.com`
  - Password: `User123!`

- **3 Sample Laptops**

### 7. Start Backend Server

```bash
pnpm run start:dev
```

The server will start on `http://localhost:3000`

## Verify Setup

### Test API

```bash
# Health check (should return 404 as we don't have a root endpoint)
curl http://localhost:3000

# Login as admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

You should receive an access token and user information.

### Test Database Connection

```bash
# Open Prisma Studio
pnpm prisma studio
```

This opens a web interface at `http://localhost:5555` where you can view and edit database records.

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# View PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker compose ps redis

# View Redis logs
docker compose logs redis

# Test Redis connection
docker compose exec redis redis-cli ping
# Should return: PONG
```

### Prisma Issues

```bash
# Reset database (caution: deletes all data)
pnpm prisma migrate reset

# Regenerate Prisma Client
pnpm prisma generate

# View current migrations
ls -la prisma/migrations
```

### Port Already in Use

If port 3000 is already in use:

1. Edit `.env` and change `PORT=3000` to another port
2. Restart the server

### Permission Errors

```bash
# Fix node_modules permissions
sudo chown -R $(whoami) node_modules
```

## Database Management

### View Database

```bash
pnpm prisma studio
```

### Create New Migration

```bash
pnpm prisma migrate dev --name description_of_change
```

### Reset Database (Development Only)

```bash
pnpm prisma migrate reset
```

This will:
1. Drop the database
2. Create a new database
3. Run all migrations
4. Run seed script

### Manual Database Access

```bash
# Using Docker
docker compose exec postgres psql -U postgres -d laptop_checkout

# Or connect from local psql client
psql postgresql://postgres:postgres@localhost:5432/laptop_checkout
```

## Testing

### Run Tests

```bash
# Unit tests
pnpm test

# Watch mode
pnpm run test:watch

# Coverage
pnpm run test:cov
```

### Manual API Testing

Use tools like:
- **Postman**: Import the endpoints from README
- **Insomnia**: Create requests based on API documentation
- **curl**: Use examples from README.md

## Development Workflow

### Making Changes

1. Make code changes
2. Server auto-reloads (watch mode)
3. Test your changes
4. Commit

### Adding New Features

1. Create feature branch
2. Add/modify code
3. Update Prisma schema if needed
4. Create migration if schema changed
5. Test thoroughly
6. Create pull request

### Database Schema Changes

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
pnpm prisma migrate dev --name add_new_field

# 3. Migration is automatically applied
# 4. Prisma Client is regenerated
```

## Production Notes

### Environment Variables

Before deploying to production:

1. Change all secrets in `.env`:
   - `JWT_SECRET`: Use a strong random string (32+ characters)
   - `JWT_REFRESH_SECRET`: Different strong random string
   - `DATABASE_URL`: Production database connection
   - `REDIS_URL`: Production Redis connection

2. Update CORS origins:
   - `CORS_ALLOWED_ORIGINS`: Add production frontend URL

3. Set up email service:
   - Add `SENDGRID_API_KEY` or configure AWS SES

### Building for Production

```bash
# Build
pnpm run build

# Run production server
pnpm run start:prod
```

### Database Migrations in Production

```bash
# Apply migrations without prompts
pnpm prisma migrate deploy
```

## Next Steps

After setup is complete:

1. Review API documentation in main README.md
2. Test all endpoints with Postman/Insomnia
3. Start implementing frontend
4. Implement Phase 3: Check-out/Check-in flow

## Need Help?

- Check main README.md for API documentation
- Review Prisma documentation: https://www.prisma.io/docs
- Check NestJS documentation: https://docs.nestjs.com
