# E2E Test Suite for Laptop Check-out System

Comprehensive end-to-end test automation suite using Playwright for the Laptop Check-out System frontend application.

## Overview

This test suite provides complete coverage of the application's UI workflows for both admin and regular users, including:

- Authentication and login flows
- User role-based access control
- Admin dashboard and management features
- Regular user checkout workflows
- Navigation and accessibility
- Form validation and error handling

## Test Structure

```
tests/
├── e2e/                          # End-to-end test files
│   ├── 01-login.spec.ts          # Login and authentication tests
│   ├── 02-regular-user-home.spec.ts   # Regular user home page tests
│   ├── 03-regular-user-qr-scan.spec.ts # QR scanning functionality tests
│   ├── 04-admin-dashboard.spec.ts     # Admin dashboard tests
│   ├── 05-admin-laptop-management.spec.ts # Laptop CRUD operations
│   ├── 06-admin-user-management.spec.ts   # User management tests
│   ├── 07-navigation.spec.ts     # Navigation and routing tests
│   └── 08-accessibility.spec.ts  # Accessibility compliance tests
├── fixtures/
│   └── auth.fixture.ts           # Authentication fixtures for tests
├── pages/                        # Page Object Models
│   ├── LoginPage.ts
│   ├── HomePage.ts
│   ├── QRScanPage.ts
│   └── admin/
│       ├── DashboardPage.ts
│       ├── LaptopManagementPage.ts
│       └── UserManagementPage.ts
└── utils/
    └── test-helpers.ts           # Utility functions for tests
```

## Prerequisites

1. Node.js 18+ installed
2. Backend services running (PostgreSQL, Redis, NestJS API)
3. Frontend dev server running on port 3001
4. Test database seeded with test users

## Installation

Install test dependencies:

```bash
pnpm install
```

Install Playwright browsers:

```bash
pnpm playwright install
```

## Test Users

The test suite uses the following predefined users from the seed data:

**Admin User:**
- Email: `admin@example.com`
- Password: `Admin123!`
- Role: admin

**Regular User:**
- Email: `user@example.com`
- Password: `User123!`
- Role: interviewer

## Running Tests

### Run all tests

```bash
pnpm test
```

### Run tests in UI mode (interactive)

```bash
pnpm test:ui
```

### Run tests in headed mode (see browser)

```bash
pnpm test:headed
```

### Run specific test file

```bash
pnpm test tests/e2e/01-login.spec.ts
```

### Run tests matching a pattern

```bash
pnpm test --grep "admin"
```

### Debug mode

```bash
pnpm test:debug
```

### View test report

```bash
pnpm test:report
```

## Test Coverage

### Authentication Tests (01-login.spec.ts)
- Display login page elements
- Form validation (empty fields, invalid email)
- Invalid credentials handling
- Successful login for admin and regular users
- Session persistence
- Logout functionality

### Regular User Tests

#### Home Page (02-regular-user-home.spec.ts)
- Welcome message display
- Current checkout status
- Instructions card
- Navigation to QR scan
- Overdue warning display
- Checkout duration tracking

#### QR Scan Page (03-regular-user-qr-scan.spec.ts)
- Scanner interface display
- Step progression
- Camera permission handling
- Error handling for invalid QR codes
- Action selection after scan
- Reset functionality

### Admin Tests

#### Dashboard (04-admin-dashboard.spec.ts)
- Summary statistics display
- Active checkouts table
- Overdue laptops alerts
- Lost & found events
- Data refresh
- Role-based access control

#### Laptop Management (05-admin-laptop-management.spec.ts)
- List all laptops
- Create new laptop
- Edit laptop details
- Delete laptop with confirmation
- QR code download
- Status management
- Form validation

#### User Management (06-admin-user-management.spec.ts)
- List all users
- Create new user
- Edit user details
- Delete user with confirmation
- Role assignment
- Email validation
- Duplicate email prevention

### Navigation Tests (07-navigation.spec.ts)
- Page navigation
- Role-based route access
- Browser back/forward buttons
- Page refresh handling
- 404 handling
- Logout and redirect

### Accessibility Tests (08-accessibility.spec.ts)
- Form labels and ARIA attributes
- Keyboard navigation
- Focus management
- Error message accessibility
- Table accessibility
- Dialog accessibility
- Color contrast

## Page Object Model Pattern

Tests use the Page Object Model (POM) pattern for maintainability:

```typescript
// Example usage
import { LoginPage } from '../pages/LoginPage';

test('login test', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
});
```

Each page object encapsulates:
- Locators for page elements
- Actions that can be performed
- Helper methods for common operations

## Authentication Fixtures

The test suite provides custom fixtures for authenticated sessions:

```typescript
// Use regular user session
test('test as regular user', async ({ regularUserPage }) => {
  await regularUserPage.goto('/');
  // Already logged in as regular user
});

// Use admin session
test('test as admin', async ({ adminPage }) => {
  await adminPage.goto('/admin/dashboard');
  // Already logged in as admin
});
```

## Best Practices

1. **Test Independence**: Each test is independent and can run in any order
2. **Data Cleanup**: Tests clean up created data to avoid interference
3. **Fixtures**: Use authentication fixtures to avoid repetitive login steps
4. **Page Objects**: Encapsulate page logic in Page Object Models
5. **Waits**: Use smart waits instead of hard timeouts
6. **Assertions**: Use meaningful assertions with clear error messages
7. **Retry Logic**: Tests automatically retry on failures (configured in playwright.config.ts)

## Test Data Management

### Creating Test Data

Use the test helpers to generate unique test data:

```typescript
import { generateTestData } from '../utils/test-helpers';

const testUser = {
  email: generateTestData.email(),
  password: generateTestData.password(),
  // ...
};
```

### Cleanup

Tests that create data should clean up after themselves:

```typescript
test('create and delete', async ({ adminPage }) => {
  // Create test data
  const laptop = await createTestLaptop();

  // Perform test
  // ...

  // Cleanup
  await deleteLaptop(laptop.id);
});
```

## Debugging Tests

### Take Screenshots

```typescript
await page.screenshot({ path: 'debug.png' });
```

### Pause Test Execution

```typescript
await page.pause(); // Opens Playwright Inspector
```

### Console Logs

```typescript
page.on('console', msg => console.log(msg.text()));
```

### Enable Trace

Traces are automatically enabled on first retry. View them in the HTML report.

## CI/CD Integration

The test suite is configured for CI/CD environments:

```yaml
# Example GitHub Actions
- name: Run E2E tests
  run: pnpm test
```

Configuration in `playwright.config.ts`:
- Retry failed tests 2 times in CI
- Sequential execution in CI
- Screenshot and video on failure
- HTML report generation

## Reporting

Test results are available in multiple formats:

1. **Console Output**: Real-time test results during execution
2. **HTML Report**: Detailed report with screenshots and traces
   ```bash
   pnpm test:report
   ```
3. **JSON Report**: Machine-readable results in `test-results/results.json`

## Common Issues

### Tests Timing Out

- Ensure backend services are running
- Check database is seeded
- Increase timeout in playwright.config.ts

### Authentication Failures

- Verify test users exist in database
- Check credentials match seed data
- Ensure JWT secrets are configured

### Flaky Tests

- Use proper waits instead of hard timeouts
- Check for race conditions
- Review network timing

## Contributing

When adding new tests:

1. Follow the existing naming convention (numbered files)
2. Create Page Objects for new pages
3. Use authentication fixtures
4. Add proper assertions with meaningful messages
5. Include accessibility checks
6. Document any special setup required

## Performance

- Tests run in parallel by default (except in CI)
- Average test suite execution: ~5-10 minutes
- Individual test: ~5-30 seconds

## Support

For issues or questions:
- Check test output and HTML report
- Review Playwright documentation: https://playwright.dev
- Check application logs for backend errors
