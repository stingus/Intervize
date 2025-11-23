#!/bin/bash

# Phase 3 Test Setup Verification Script
# This script checks if all prerequisites are met for running Phase 3 tests

set -e

echo "=================================="
echo "Phase 3 Test Setup Verification"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counter
CHECKS_PASSED=0
CHECKS_FAILED=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check 1: Backend is running
echo "Checking backend..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    check_pass "Backend is running on http://localhost:3000"
else
    check_fail "Backend is NOT running on http://localhost:3000"
    echo "  → Run: cd backend && pnpm run dev"
fi

# Check 2: Frontend is running
echo "Checking frontend..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    check_pass "Frontend is running on http://localhost:3001"
else
    check_fail "Frontend is NOT running on http://localhost:3001"
    echo "  → Run: cd frontend && pnpm run dev"
fi

# Check 3: Database is accessible
echo "Checking database..."
if curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    check_pass "Database connection is healthy"
else
    check_warn "Cannot verify database health"
fi

# Check 4: Node modules installed
echo "Checking dependencies..."
if [ -d "node_modules" ] && [ -d "node_modules/@playwright" ]; then
    check_pass "Node modules installed (including Playwright)"
else
    check_fail "Node modules not installed"
    echo "  → Run: pnpm install"
fi

# Check 5: Test files exist
echo "Checking test files..."
if [ -f "tests/e2e/03-regular-user-qr-scan.spec.ts" ]; then
    check_pass "Test suite file exists"
else
    check_fail "Test suite file NOT found"
fi

if [ -f "tests/pages/QRScanPage.ts" ]; then
    check_pass "QRScanPage POM exists"
else
    check_fail "QRScanPage POM NOT found"
fi

if [ -f "tests/utils/test-helpers.ts" ]; then
    check_pass "Test helpers exist"
else
    check_fail "Test helpers NOT found"
fi

# Check 6: Test users exist (requires backend running)
echo "Checking test users..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    # Try to login with test user (just check if endpoint responds)
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"user@example.com","password":"User123!"}' 2>/dev/null || echo "failed")
    
    if echo "$LOGIN_RESPONSE" | grep -q "token\|success"; then
        check_pass "Test user 'user@example.com' exists and can login"
    else
        check_warn "Test user 'user@example.com' may not exist or password is wrong"
        echo "  → Ensure database is seeded with test users"
    fi
else
    check_warn "Cannot verify test users (backend not running)"
fi

# Summary
echo ""
echo "=================================="
echo "Summary"
echo "=================================="
echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! You're ready to run tests.${NC}"
    echo ""
    echo "Run tests with:"
    echo "  pnpm test:e2e tests/e2e/03-regular-user-qr-scan.spec.ts"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please fix the issues above.${NC}"
    exit 1
fi
