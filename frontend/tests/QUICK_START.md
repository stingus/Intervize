# Quick Start: Running Phase 3 E2E Tests

## Prerequisites Checklist

- [ ] Backend running on `http://localhost:3000`
- [ ] Frontend running on `http://localhost:3001`
- [ ] Database seeded with test users:
  - `user@example.com` / `User123!`
  - `user2@example.com` / `User123!`
  - `admin@example.com` / `Admin123!`

## Quick Commands

```bash
# Start backend
cd backend
docker compose up -d
pnpm run dev

# Start frontend (in another terminal)
cd frontend
pnpm run dev

# Run Phase 3 tests (in another terminal)
cd frontend
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts
```

## Test Categories

### 1. Checkout Flow (4 tests)
Tests basic checkout functionality and one-laptop-per-user rule.

```bash
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts -g "Checkout Flow"
```

### 2. Check-in Flow (4 tests) ⭐ CRITICAL
Tests the main bug fix: same user can check in their laptop.

```bash
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts -g "Check-in Flow"
```

### 3. Found Flow (3 tests)
Tests different user scenario: finding someone else's laptop.

```bash
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts -g "Found Flow"
```

### 4. Status Endpoint (4 tests)
Tests the new `/api/v1/checkouts/status/:laptopUniqueId` endpoint.

```bash
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts -g "Status Endpoint"
```

### 5. Business Rules (3 tests)
Tests core business logic enforcement.

```bash
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts -g "Business Rules"
```

## Common Issues

### "User already has active checkout"
```bash
# Manually clean up via backend
curl -X POST http://localhost:3000/api/v1/checkouts/checkin \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"laptopUniqueId": "LAP-XXXXXXXX"}'
```

### Tests timing out
```bash
# Run with more timeout
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts --timeout=60000
```

### Need to see what's happening
```bash
# Run in headed mode
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts --headed

# Run in debug mode
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts --debug
```

## Key Test Scenarios

### Scenario 1: Normal Checkout/Checkin
1. User scans QR code
2. Sees "Checkout" button
3. Clicks checkout
4. Scans same laptop again
5. Sees "Check-in" button ✅ (This was broken before!)
6. Clicks checkin
7. Laptop becomes available

### Scenario 2: Different User Finds Laptop
1. User A checks out laptop
2. User B scans same laptop
3. User B sees "Report Found" button (NOT checkin) ✅
4. User B clicks "Report Found"
5. Laptop becomes available
6. Original checkout is closed

### Scenario 3: One Laptop Per User
1. User checks out Laptop A
2. User tries to checkout Laptop B
3. Error: "You already have laptop LAP-XXX checked out" ✅
4. User must check in Laptop A first

## Verification

Run this to verify everything passes:

```bash
cd /Users/arthur/Projects/playground/claude/laptop-checkout-system/frontend
pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts --reporter=list
```

Expected output:
```
✓ Phase 3: QR Scan - Checkout/Checkin Flow > should display QR scan page correctly
✓ Phase 3: QR Scan - Checkout/Checkin Flow > should show progress stepper with all steps
✓ Phase 3: QR Scan - Checkout/Checkin Flow > Checkout Flow > should successfully checkout an available laptop
...
26 passed (2m)
```

## Next Steps

After tests pass:
1. Review test coverage report
2. Check for flaky tests (run multiple times)
3. Integrate into CI/CD pipeline
4. Add visual regression tests if needed

## Need Help?

See detailed documentation:
- `tests/PHASE3_TEST_README.md` - Full test documentation
- `../backend/PHASE3_TESTING_GUIDE.md` - Backend testing guide
- `../backend/PHASE3_CHANGES_SUMMARY.md` - What changed in Phase 3
