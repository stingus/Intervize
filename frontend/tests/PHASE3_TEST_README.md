# Phase 3 Checkout/Checkin E2E Tests

## Overview

This test suite provides comprehensive coverage of the Phase 3 checkout/checkin functionality that was fixed in the backend. The tests verify the proper implementation of business rules, authorization logic, and user workflows.

## Test Coverage

### 1. Checkout Flow Tests
- **Successfully checkout an available laptop**: Verifies users can checkout available laptops
- **Display checkout button when laptop is available**: Tests UI shows correct action buttons
- **Prevent checkout when user already has a laptop**: Validates one-laptop-per-user rule
- **Show error message with current laptop**: Ensures error messages include helpful context

### 2. Check-in Flow Tests (CRITICAL - Fixed Bug)
- **Show checkin button for user who checked out**: Verifies correct button visibility
- **Successfully checkin laptop by same user**: Tests the core checkin functionality
- **Track checkout duration on checkin**: Validates duration tracking
- **Clear current checkout after successful checkin**: Ensures state is properly updated

### 3. Found Flow Tests (Different User)
- **Show "Found" button when different user scans**: Tests proper action differentiation
- **Prevent different user from checking in**: Validates authorization rules
- **Successfully report laptop as found**: Tests the found workflow

### 4. Status Endpoint Tests
- **Return correct actions when laptop is available**: Tests status endpoint accuracy
- **Return correct actions when same user checked out**: Validates user-specific actions
- **Return checkout info including duration**: Tests complete status response
- **Return 404 for non-existent laptop**: Tests error handling

### 5. Business Rules Tests
- **Enforce one laptop per user rule**: Validates core business constraint
- **Include current laptop info in error message**: Tests user-friendly errors
- **Allow checkout after checking in previous laptop**: Validates state transitions

### 6. UI Integration Tests
- **Display laptop information after scanning**: Tests UI data binding
- **Show appropriate alert messages**: Validates user feedback

### 7. Edge Cases
- **Handle rapid checkout/checkin operations**: Tests system under stress
- **Handle checkout when laptop is in maintenance**: Tests error conditions

## File Structure

```
frontend/tests/
├── e2e/
│   └── 03-regular-user-qr-scan.spec.ts    # Main test suite
├── pages/
│   └── QRScanPage.ts                       # Page Object Model with new methods
├── fixtures/
│   └── auth.fixture.ts                     # Authentication fixtures
├── utils/
│   └── test-helpers.ts                     # Helper functions for API calls
└── PHASE3_TEST_README.md                   # This file
```

## Prerequisites

### Backend Setup
1. Backend must be running on `http://localhost:3000`
2. Database must be seeded with test users:
   - `admin@example.com` / `Admin123!` (admin role)
   - `user@example.com` / `User123!` (interviewer role)
   - `user2@example.com` / `User123!` (interviewer role - for multi-user tests)

### Frontend Setup
1. Frontend must be running on `http://localhost:3001`
2. Playwright dependencies installed: `pnpm install`

## Running the Tests

### Run All Phase 3 Tests
```bash
cd /Users/arthur/Projects/playground/claude/laptop-checkout-system/frontend
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts
```

### Run Specific Test Suites
```bash
# Run only checkout flow tests
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts -g "Checkout Flow"

# Run only checkin flow tests
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts -g "Check-in Flow"

# Run only found flow tests
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts -g "Found Flow"

# Run only status endpoint tests
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts -g "Status Endpoint"

# Run only business rules tests
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts -g "Business Rules"
```

### Run Tests in Headed Mode (with Browser UI)
```bash
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts --headed
```

### Run Tests in Debug Mode
```bash
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts --debug
```

### Generate HTML Report
```bash
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts
pnpm playwright show-report
```

## Test Data Management

### Test Laptops
Each test creates its own test laptop with a unique ID:
```typescript
testLaptop = await createTestLaptop(page, {
  uniqueId: `LAP-TEST-${Date.now()}`,
});
```

### Cleanup
- Tests automatically clean up by checking in laptops after each test
- `afterEach` hooks ensure cleanup even if tests fail

## Key Test Helpers

### API Helpers (in test-helpers.ts)
- `createTestLaptop()`: Creates a test laptop via API
- `checkoutLaptop()`: Checks out a laptop via API
- `checkinLaptop()`: Checks in a laptop via API
- `getCheckoutStatus()`: Gets laptop checkout status
- `getCurrentCheckout()`: Gets current user's active checkout
- `loginAndGetUserInfo()`: Logs in and returns user info
- `reportLaptopFound()`: Reports laptop as found
- `reportLaptopLost()`: Reports laptop as lost

### Page Object Methods (in QRScanPage.ts)
- `simulateScan()`: Simulates scanning a QR code
- `clickCheckout()`: Clicks the checkout button
- `clickCheckin()`: Clicks the checkin button
- `clickReportFound()`: Clicks the report found button
- `clickReportLost()`: Clicks the report lost button
- `getVisibleActions()`: Gets list of visible action buttons
- `isActionButtonVisible()`: Checks if specific action is visible
- `getLaptopDetails()`: Gets displayed laptop information
- `waitForActionSuccess()`: Waits for success message

## Backend API Endpoints Tested

### Core Endpoints
- `GET /api/v1/checkouts/status/:laptopUniqueId` - Get checkout status and available actions
- `POST /api/v1/checkouts/checkout` - Checkout a laptop
- `POST /api/v1/checkouts/checkin` - Checkin a laptop
- `POST /api/v1/checkouts/report-found` - Report laptop as found
- `POST /api/v1/checkouts/report-lost` - Report laptop as lost
- `GET /api/v1/checkouts/my-current` - Get current user's active checkout
- `POST /api/v1/laptops` - Create test laptops (admin only)

## Business Rules Validated

1. **One Laptop Per User**
   - Users cannot checkout a laptop if they already have an active checkout
   - Error message includes the current laptop's unique ID
   - Users can checkout after checking in their current laptop

2. **Checkin Authorization**
   - Only the user who checked out can check in
   - Different users see "Report Found" instead of "Check-in"
   - Clear error messages guide users to correct action

3. **Available Actions Logic**
   - `canCheckout`: Laptop status is "available" AND user has no active checkout
   - `canCheckin`: Current user is the one who checked out the laptop
   - `canReportFound`: Different user than the one who checked out
   - `canReportLost`: Current user is the one who checked out the laptop

## Expected Test Results

All tests should pass with the fixed backend implementation:

```
Phase 3: QR Scan - Checkout/Checkin Flow
  ✓ should display QR scan page correctly
  ✓ should show progress stepper with all steps

  Checkout Flow
    ✓ should successfully checkout an available laptop
    ✓ should display checkout button when laptop is available
    ✓ should prevent checkout when user already has a laptop
    ✓ should show error message with current laptop when trying to checkout second laptop

  Check-in Flow
    ✓ should show checkin button for user who checked out the laptop
    ✓ should successfully checkin laptop by same user
    ✓ should track checkout duration on checkin
    ✓ should clear current checkout after successful checkin

  Found Flow - Different User
    ✓ should show "Found" button when different user scans checked-out laptop
    ✓ should prevent different user from checking in the laptop
    ✓ should successfully report laptop as found by different user

  Status Endpoint Tests
    ✓ should return correct actions when laptop is available
    ✓ should return correct actions when same user checked out
    ✓ should return checkout info including duration
    ✓ should return 404 for non-existent laptop

  Business Rules
    ✓ should enforce one laptop per user rule
    ✓ should include current laptop info in error message
    ✓ should allow checkout after checking in previous laptop

  UI Integration Tests
    ✓ should display laptop information after scanning
    ✓ should show appropriate alert messages

  Edge Cases
    ✓ should handle rapid checkout/checkin operations
    ✓ should handle checkout when laptop is in maintenance

Total: 26 tests
```

## Troubleshooting

### Test Failures

#### "User already has an active checkout" errors
- **Cause**: Previous test didn't clean up properly
- **Solution**: Check `afterEach` hooks are running, manually checkin via API if needed

#### "Cannot check in - not authorized" errors
- **Cause**: Wrong user is trying to checkin
- **Solution**: Verify test is using correct user credentials

#### "Laptop not found" errors
- **Cause**: Test laptop wasn't created successfully
- **Solution**: Check admin user has permission to create laptops

#### Timeout errors
- **Cause**: Backend is slow or not responding
- **Solution**: Increase timeout in playwright.config.ts or check backend logs

### Database Issues

If tests are interfering with each other:
1. Run tests serially: `pnpm test:e2e --workers=1`
2. Reset database between test runs
3. Ensure each test uses unique laptop IDs

### Authentication Issues

If authentication is failing:
1. Verify test users exist in database
2. Check JWT token is being stored in localStorage
3. Verify token is being sent in Authorization header

## CI/CD Integration

### Running in CI
```bash
# Headless mode (default)
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts

# Generate report
pnpm playwright show-report --ci
```

### Environment Variables
```bash
# Backend URL (default: http://localhost:3000)
VITE_API_URL=http://localhost:3000

# Frontend URL (default: http://localhost:3001)
PLAYWRIGHT_BASE_URL=http://localhost:3001
```

## Test Metrics

Expected test execution time:
- Full suite: ~2-3 minutes
- Individual test: ~3-5 seconds
- With cleanup: ~4-8 seconds per test

## Contributing

When adding new tests:
1. Follow existing test structure and naming conventions
2. Use Page Object Model for UI interactions
3. Use helper functions for API calls
4. Add cleanup in `afterEach` hooks
5. Create unique test data to avoid conflicts
6. Document business rules being tested
7. Include both happy path and error cases

## References

- Backend Phase 3 Changes: `/Users/arthur/Projects/playground/claude/laptop-checkout-system/backend/PHASE3_CHANGES_SUMMARY.md`
- Backend Testing Guide: `/Users/arthur/Projects/playground/claude/laptop-checkout-system/backend/PHASE3_TESTING_GUIDE.md`
- Playwright Documentation: https://playwright.dev/
- Test Best Practices: https://playwright.dev/docs/best-practices
