# Testing Guide - Laptop Check-out System

Quick start guide for running the E2E test suite.

## Quick Start

### 1. Prerequisites

Ensure all services are running:

```bash
# Terminal 1: Start backend services (from root directory)
cd laptop-checkout-system
docker compose up -d postgres redis

# Terminal 2: Start backend (from backend directory)
cd laptop-checkout-system/backend
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed
pnpm run start:dev

# Terminal 3: Start frontend (from frontend directory)
cd laptop-checkout-system/frontend
pnpm install
pnpm dev
```

### 2. Verify Services

- Backend API: http://localhost:3000
- Frontend: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 3. Run Tests

```bash
# From frontend directory
cd laptop-checkout-system/frontend

# Run all tests
pnpm test

# Run with UI (recommended for development)
pnpm test:ui

# Run in headed mode (see browser)
pnpm test:headed

# Run specific test file
pnpm test tests/e2e/01-login.spec.ts
```

## Test Organization

The test suite is organized into 8 test files covering all major workflows:

1. **01-login.spec.ts** - Authentication & Login
   - Login validation
   - Admin/regular user login
   - Session management

2. **02-regular-user-home.spec.ts** - Regular User Home Page
   - Checkout status display
   - Navigation
   - Overdue warnings

3. **03-regular-user-qr-scan.spec.ts** - QR Scanning
   - Scanner interface
   - Error handling
   - Action flow

4. **04-admin-dashboard.spec.ts** - Admin Dashboard
   - Statistics display
   - Active checkouts
   - Overdue alerts

5. **05-admin-laptop-management.spec.ts** - Laptop CRUD
   - Create/edit/delete laptops
   - QR code generation
   - Form validation

6. **06-admin-user-management.spec.ts** - User CRUD
   - Create/edit/delete users
   - Role management
   - Email validation

7. **07-navigation.spec.ts** - Navigation & Routing
   - Page navigation
   - Access control
   - Browser controls

8. **08-accessibility.spec.ts** - Accessibility
   - ARIA labels
   - Keyboard navigation
   - Focus management

## Test Credentials

```javascript
// Admin User
Email: admin@example.com
Password: Admin123!

// Regular User
Email: user@example.com
Password: User123!
```

## Common Commands

```bash
# Run all tests
pnpm test

# Interactive UI mode
pnpm test:ui

# Debug mode with Playwright Inspector
pnpm test:debug

# Run tests matching pattern
pnpm test --grep "login"

# Run specific test file
pnpm test tests/e2e/01-login.spec.ts

# Run tests in headed mode
pnpm test:headed

# View HTML report
pnpm test:report

# Generate test code
pnpm test:codegen
```

## Test Results

After running tests, you can view:

1. **Console Output** - Real-time results
2. **HTML Report** - Detailed report with screenshots
   ```bash
   pnpm test:report
   ```
3. **Screenshots** - Saved in `test-results/` on failures
4. **Videos** - Recorded on failures (if enabled)

## Debugging Failed Tests

### 1. View HTML Report
```bash
pnpm test:report
```

### 2. Run in Debug Mode
```bash
pnpm test:debug tests/e2e/01-login.spec.ts
```

### 3. Check Screenshots
Failed tests automatically capture screenshots in `test-results/`

### 4. View Traces
Traces are automatically captured on retry. View them in the HTML report.

## Test Structure

```
tests/
├── e2e/                    # Test files
│   ├── 01-login.spec.ts
│   ├── 02-regular-user-home.spec.ts
│   ├── 03-regular-user-qr-scan.spec.ts
│   ├── 04-admin-dashboard.spec.ts
│   ├── 05-admin-laptop-management.spec.ts
│   ├── 06-admin-user-management.spec.ts
│   ├── 07-navigation.spec.ts
│   └── 08-accessibility.spec.ts
├── fixtures/
│   └── auth.fixture.ts     # Authentication helpers
├── pages/                  # Page Object Models
│   ├── LoginPage.ts
│   ├── HomePage.ts
│   ├── QRScanPage.ts
│   └── admin/
│       ├── DashboardPage.ts
│       ├── LaptopManagementPage.ts
│       └── UserManagementPage.ts
└── utils/
    └── test-helpers.ts     # Utility functions
```

## Page Object Model Example

```typescript
import { test } from '../fixtures/auth.fixture';
import { LoginPage } from '../pages/LoginPage';

test('login example', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('admin@example.com', 'Admin123!');
});
```

## Using Authentication Fixtures

```typescript
import { test } from '../fixtures/auth.fixture';

// Test as regular user (already logged in)
test('regular user test', async ({ regularUserPage }) => {
  await regularUserPage.goto('/');
  // User is already authenticated
});

// Test as admin (already logged in)
test('admin test', async ({ adminPage }) => {
  await adminPage.goto('/admin/dashboard');
  // Admin is already authenticated
});
```

## Test Data

Tests use the seeded database data:

- 2 users (admin + regular)
- 3 laptops (Dell, HP, Lenovo)

Tests that create data should clean up:

```typescript
test('create and cleanup', async ({ adminPage }) => {
  const testLaptop = {
    make: 'Apple',
    model: 'MacBook Pro',
    serialNumber: `TEST-${Date.now()}`,
    status: 'Available',
  };

  // Create
  await laptopManagementPage.createLaptop(testLaptop);

  // Test...

  // Cleanup
  const index = await laptopManagementPage.findLaptopBySerial(testLaptop.serialNumber);
  if (index !== null) {
    await laptopManagementPage.deleteLaptop(index);
  }
});
```

## CI/CD Integration

Tests are configured for CI environments:

```yaml
# GitHub Actions example
- name: Install dependencies
  run: pnpm install

- name: Install Playwright browsers
  run: pnpm playwright install --with-deps

- name: Start services
  run: docker compose up -d

- name: Run tests
  run: pnpm test

- name: Upload test report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Backend not running
```bash
Error: net::ERR_CONNECTION_REFUSED at http://localhost:3000
```
**Solution**: Start the backend server

### Frontend not running
```bash
Error: net::ERR_CONNECTION_REFUSED at http://localhost:3001
```
**Solution**: Start the frontend dev server

### Database not seeded
```bash
Error: User not found
```
**Solution**: Run `pnpm prisma db seed` in backend directory

### Tests timing out
**Solution**:
- Check all services are running
- Increase timeout in `playwright.config.ts`
- Check network/database connection

### Port conflicts
**Solution**:
- Stop other services on ports 3000, 3001, 5432, 6379
- Or update ports in docker-compose.yml and .env files

## Best Practices

1. Always run tests against a clean seeded database
2. Use Page Objects for new pages
3. Use authentication fixtures to avoid repetitive logins
4. Clean up test data after tests
5. Use meaningful test names
6. Add assertions with clear error messages
7. Use proper waits instead of hard timeouts

## Performance Tips

- Tests run in parallel by default (faster)
- Use `--workers=1` for sequential execution if needed
- Skip slow tests during development with `test.skip()`
- Use `test.only()` to run specific tests

## Getting Help

- Review the test output and HTML report
- Check Playwright documentation: https://playwright.dev
- Review test code in `tests/e2e/`
- Check backend logs for API errors

## Next Steps

After running tests:

1. Review HTML report for detailed results
2. Fix any failing tests
3. Add new tests for new features
4. Update Page Objects when UI changes
5. Keep test data in sync with database changes
