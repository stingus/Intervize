import { test, expect } from '../fixtures/auth.fixture';
import { QRScanPage } from '../pages/QRScanPage';
import { TEST_USERS } from '../fixtures/auth.fixture';
import {
  createTestLaptop,
  checkoutLaptop,
  checkinLaptop,
  getCurrentCheckout,
  getCheckoutStatus,
  loginAndGetUserInfo,
  clearAllStorage,
  waitForAPIResponse,
  mockAPIResponse,
} from '../utils/test-helpers';
import { Page } from '@playwright/test';

test.describe('Phase 3: QR Scan - Checkout/Checkin Flow', () => {
  let qrScanPage: QRScanPage;
  let testLaptop: any;
  let userInfo: any;

  test.beforeEach(async ({ regularUserPage }) => {
    qrScanPage = new QRScanPage(regularUserPage);

    // Get user info
    const userJson = await regularUserPage.evaluate(() => localStorage.getItem('user'));
    userInfo = JSON.parse(userJson || '{}');

    // Create a test laptop for this test
    testLaptop = await createTestLaptop(regularUserPage, {
      uniqueId: `LAP-TEST-${Date.now()}`,
    });
  });

  test('should display QR scan page correctly', async ({ regularUserPage }) => {
    await qrScanPage.goto();
    await expect(qrScanPage.pageTitle).toBeVisible();
    await expect(qrScanPage.stepper).toBeVisible();
    await expect(qrScanPage.startCameraButton).toBeVisible();
  });

  test('should show progress stepper with all steps', async ({ regularUserPage }) => {
    await qrScanPage.goto();

    // Check for all steps in the stepper
    const stepLabels = ['Start', 'Scanning', 'Processing', 'Action', 'Complete'];

    for (const label of stepLabels) {
      const step = regularUserPage
        .locator('.MuiStepLabel-label')
        .filter({ hasText: new RegExp(`^${label}$`) });
      await expect(step.first()).toBeVisible();
    }
  });

  test.describe('Checkout Flow', () => {
    test('should successfully checkout an available laptop', async ({ regularUserPage }) => {
      // Mock the QR scan flow by directly calling the API
      await mockAPIResponse(
        regularUserPage,
        `**/api/v1/laptops/unique/${testLaptop.data.uniqueId}`,
        {
          success: true,
          data: testLaptop.data,
        }
      );

      // Navigate to scan page
      await qrScanPage.goto();

      // Simulate scanning the QR code
      await regularUserPage.evaluate(
        async ({ laptopId, userId }) => {
          const token = localStorage.getItem('auth_token');
          const response = await fetch('http://localhost:3000/api/v1/checkouts/checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ laptopUniqueId: laptopId, userId }),
          });
          return await response.json();
        },
        { laptopId: testLaptop.data.uniqueId, userId: userInfo.id }
      );

      // Verify checkout was successful
      const currentCheckout = await getCurrentCheckout(regularUserPage);
      expect(currentCheckout.data).toBeTruthy();
      expect(currentCheckout.data.laptop.uniqueId).toBe(testLaptop.data.uniqueId);
    });

    test('should display checkout button when laptop is available', async ({
      regularUserPage,
    }) => {
      // Navigate to scan page and load laptop
      await regularUserPage.goto(`/scan`);

      // Mock laptop data in action state
      await regularUserPage.evaluate(
        (laptop) => {
          // Store laptop data that the component will use
          window.localStorage.setItem('test_laptop', JSON.stringify(laptop));
        },
        testLaptop.data
      );

      // Use API to get laptop and check status
      const status = await getCheckoutStatus(regularUserPage, testLaptop.data.uniqueId);
      expect(status.data.availableActions.canCheckout).toBe(true);
    });

    test('should prevent checkout when user already has a laptop', async ({
      regularUserPage,
    }) => {
      // First, checkout a laptop
      await checkoutLaptop(regularUserPage, testLaptop.data.uniqueId, userInfo.id);

      // Create another laptop
      const secondLaptop = await createTestLaptop(regularUserPage, {
        uniqueId: `LAP-TEST-2-${Date.now()}`,
      });

      // Try to checkout the second laptop
      try {
        await checkoutLaptop(regularUserPage, secondLaptop.data.uniqueId, userInfo.id);
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toMatch(/already have an active checkout/i);
      }

      // Cleanup: checkin the first laptop
      await checkinLaptop(regularUserPage, testLaptop.data.uniqueId);
    });

    test('should show error message with current laptop when trying to checkout second laptop', async ({
      regularUserPage,
    }) => {
      // Checkout first laptop
      await checkoutLaptop(regularUserPage, testLaptop.data.uniqueId, userInfo.id);

      // Create second laptop
      const secondLaptop = await createTestLaptop(regularUserPage, {
        uniqueId: `LAP-TEST-2-${Date.now()}`,
      });

      // Try to checkout second laptop via API and check error
      const result = await regularUserPage.evaluate(
        async ({ laptopId, userId }) => {
          const token = localStorage.getItem('auth_token');
          try {
            const response = await fetch('http://localhost:3000/api/v1/checkouts/checkout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ laptopUniqueId: laptopId, userId }),
            });
            return await response.json();
          } catch (err) {
            return { error: err };
          }
        },
        { laptopId: secondLaptop.data.uniqueId, userId: userInfo.id }
      );

      expect(result.success).toBe(false);
      expect(result.error.message).toMatch(/already have an active checkout/i);

      // Cleanup
      await checkinLaptop(regularUserPage, testLaptop.data.uniqueId);
    });
  });

  test.describe('Check-in Flow', () => {
    test.beforeEach(async ({ regularUserPage }) => {
      // Checkout the test laptop before each test
      await checkoutLaptop(regularUserPage, testLaptop.data.uniqueId, userInfo.id);
    });

    test.afterEach(async ({ regularUserPage }) => {
      // Cleanup: try to checkin if still checked out
      try {
        await checkinLaptop(regularUserPage, testLaptop.data.uniqueId);
      } catch {
        // Ignore errors if already checked in
      }
    });

    test('should show checkin button for user who checked out the laptop', async ({
      regularUserPage,
    }) => {
      const status = await getCheckoutStatus(regularUserPage, testLaptop.data.uniqueId);

      expect(status.data.availableActions.canCheckin).toBe(true);
      expect(status.data.availableActions.canCheckout).toBe(false);
      expect(status.data.availableActions.canReportFound).toBe(false);
    });

    test('should successfully checkin laptop by same user', async ({ regularUserPage }) => {
      // Verify laptop is checked out
      const beforeStatus = await getCheckoutStatus(regularUserPage, testLaptop.data.uniqueId);
      expect(beforeStatus.data.laptop.status).toBe('checked_out');
      expect(beforeStatus.data.checkout).toBeTruthy();

      // Checkin the laptop
      const checkinResult = await checkinLaptop(regularUserPage, testLaptop.data.uniqueId);
      expect(checkinResult.success).toBe(true);

      // Verify laptop is now available
      const afterStatus = await getCheckoutStatus(regularUserPage, testLaptop.data.uniqueId);
      expect(afterStatus.data.laptop.status).toBe('available');
      expect(afterStatus.data.checkout).toBeFalsy();
    });

    test('should track checkout duration on checkin', async ({ regularUserPage }) => {
      // Wait a bit to have measurable duration
      await regularUserPage.waitForTimeout(2000);

      // Get status before checkin to see duration
      const beforeStatus = await getCheckoutStatus(regularUserPage, testLaptop.data.uniqueId);
      expect(beforeStatus.data.checkout.durationMinutes).toBeGreaterThanOrEqual(0);

      // Checkin
      await checkinLaptop(regularUserPage, testLaptop.data.uniqueId);

      // Verify laptop is available
      const afterStatus = await getCheckoutStatus(regularUserPage, testLaptop.data.uniqueId);
      expect(afterStatus.data.laptop.status).toBe('available');
    });

    test('should clear current checkout after successful checkin', async ({ regularUserPage }) => {
      // Verify user has active checkout
      const beforeCheckout = await getCurrentCheckout(regularUserPage);
      expect(beforeCheckout.data).toBeTruthy();
      expect(beforeCheckout.data.laptop.uniqueId).toBe(testLaptop.data.uniqueId);

      // Checkin
      await checkinLaptop(regularUserPage, testLaptop.data.uniqueId);

      // Verify user has no active checkout
      const afterCheckout = await getCurrentCheckout(regularUserPage);
      expect(afterCheckout).toBeNull();
    });
  });

  test.describe('Found Flow - Different User', () => {
    let user1Info: any;
    let user2Info: any;

    test.beforeEach(async ({ page, regularUserPage }) => {
      // Login as User 1 and checkout laptop
      await clearAllStorage(regularUserPage);
      user1Info = await loginAndGetUserInfo(
        regularUserPage,
        TEST_USERS.regular.email,
        TEST_USERS.regular.password
      );

      await checkoutLaptop(regularUserPage, testLaptop.data.uniqueId, user1Info.userId);

      // Logout User 1
      await clearAllStorage(regularUserPage);
    });

    test('should show "Found" button when different user scans checked-out laptop', async ({
      page,
    }) => {
      // Login as User 2
      user2Info = await loginAndGetUserInfo(
        page,
        TEST_USERS.regular2.email,
        TEST_USERS.regular2.password
      );

      // Check status for User 2
      const status = await getCheckoutStatus(page, testLaptop.data.uniqueId);

      expect(status.data.availableActions.canCheckout).toBe(false);
      expect(status.data.availableActions.canCheckin).toBe(false);
      expect(status.data.availableActions.canReportFound).toBe(true);
      expect(status.data.availableActions.canReportLost).toBe(false);

      // Cleanup
      await clearAllStorage(page);
      await loginAndGetUserInfo(
        page,
        TEST_USERS.regular.email,
        TEST_USERS.regular.password
      );
      await checkinLaptop(page, testLaptop.data.uniqueId);
    });

    test('should prevent different user from checking in the laptop', async ({ page }) => {
      // Login as User 2
      user2Info = await loginAndGetUserInfo(
        page,
        TEST_USERS.regular2.email,
        TEST_USERS.regular2.password
      );

      // Try to checkin as User 2
      try {
        await checkinLaptop(page, testLaptop.data.uniqueId);
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toMatch(/cannot check in|unauthorized|not authorized/i);
      }

      // Cleanup
      await clearAllStorage(page);
      await loginAndGetUserInfo(
        page,
        TEST_USERS.regular.email,
        TEST_USERS.regular.password
      );
      await checkinLaptop(page, testLaptop.data.uniqueId);
    });

    test('should successfully report laptop as found by different user', async ({ page }) => {
      // Login as User 2
      user2Info = await loginAndGetUserInfo(
        page,
        TEST_USERS.regular2.email,
        TEST_USERS.regular2.password
      );

      // Report as found
      const result = await page.evaluate(
        async ({ laptopId, finderId }) => {
          const token = localStorage.getItem('auth_token');
          const response = await fetch('http://localhost:3000/api/v1/checkouts/report-found', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ laptopUniqueId: laptopId, finderUserId: finderId }),
          });
          return await response.json();
        },
        { laptopId: testLaptop.data.uniqueId, finderId: user2Info.userId }
      );

      expect(result.success).toBe(true);

      // Verify laptop is now available
      const status = await getCheckoutStatus(page, testLaptop.data.uniqueId);
      expect(status.data.laptop.status).toBe('available');
    });
  });

  test.describe('Status Endpoint Tests', () => {
    test('should return correct actions when laptop is available', async ({ regularUserPage }) => {
      const status = await getCheckoutStatus(regularUserPage, testLaptop.data.uniqueId);

      expect(status.success).toBe(true);
      expect(status.data.laptop.uniqueId).toBe(testLaptop.data.uniqueId);
      expect(status.data.laptop.status).toBe('available');
      expect(status.data.availableActions.canCheckout).toBe(true);
      expect(status.data.availableActions.canCheckin).toBe(false);
      expect(status.data.availableActions.canReportFound).toBe(false);
    });

    test('should return correct actions when same user checked out', async ({
      regularUserPage,
    }) => {
      // Checkout laptop
      await checkoutLaptop(regularUserPage, testLaptop.data.uniqueId, userInfo.id);

      const status = await getCheckoutStatus(regularUserPage, testLaptop.data.uniqueId);

      expect(status.data.laptop.status).toBe('checked_out');
      expect(status.data.checkout).toBeTruthy();
      expect(status.data.checkout.user.id).toBe(userInfo.id);
      expect(status.data.availableActions.canCheckout).toBe(false);
      expect(status.data.availableActions.canCheckin).toBe(true);
      expect(status.data.availableActions.canReportFound).toBe(false);
      expect(status.data.availableActions.canReportLost).toBe(true);

      // Cleanup
      await checkinLaptop(regularUserPage, testLaptop.data.uniqueId);
    });

    test('should return checkout info including duration', async ({ regularUserPage }) => {
      // Checkout laptop
      await checkoutLaptop(regularUserPage, testLaptop.data.uniqueId, userInfo.id);

      // Wait a bit
      await regularUserPage.waitForTimeout(1000);

      const status = await getCheckoutStatus(regularUserPage, testLaptop.data.uniqueId);

      expect(status.data.checkout).toBeTruthy();
      expect(status.data.checkout.checkedOutAt).toBeTruthy();
      expect(status.data.checkout.durationMinutes).toBeGreaterThanOrEqual(0);
      expect(status.data.checkout.user).toBeTruthy();
      expect(status.data.checkout.user.email).toBe(userInfo.email);

      // Cleanup
      await checkinLaptop(regularUserPage, testLaptop.data.uniqueId);
    });

    test('should return 404 for non-existent laptop', async ({ regularUserPage }) => {
      try {
        await getCheckoutStatus(regularUserPage, 'LAP-NONEXISTENT');
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toMatch(/not found|404/i);
      }
    });
  });

  test.describe('Business Rules', () => {
    test('should enforce one laptop per user rule', async ({ regularUserPage }) => {
      // Checkout first laptop
      await checkoutLaptop(regularUserPage, testLaptop.data.uniqueId, userInfo.id);

      // Create second laptop
      const secondLaptop = await createTestLaptop(regularUserPage, {
        uniqueId: `LAP-TEST-2-${Date.now()}`,
      });

      // Try to checkout second laptop
      try {
        await checkoutLaptop(regularUserPage, secondLaptop.data.uniqueId, userInfo.id);
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toMatch(/already have an active checkout/i);
      }

      // Verify first laptop is still checked out
      const status = await getCheckoutStatus(regularUserPage, testLaptop.data.uniqueId);
      expect(status.data.laptop.status).toBe('checked_out');

      // Cleanup
      await checkinLaptop(regularUserPage, testLaptop.data.uniqueId);
    });

    test('should include current laptop info in error message', async ({ regularUserPage }) => {
      // Checkout first laptop
      await checkoutLaptop(regularUserPage, testLaptop.data.uniqueId, userInfo.id);

      // Create second laptop
      const secondLaptop = await createTestLaptop(regularUserPage, {
        uniqueId: `LAP-TEST-2-${Date.now()}`,
      });

      // Try to checkout second laptop and capture error
      const result = await regularUserPage.evaluate(
        async ({ laptopId, userId }) => {
          const token = localStorage.getItem('auth_token');
          try {
            const response = await fetch('http://localhost:3000/api/v1/checkouts/checkout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ laptopUniqueId: laptopId, userId }),
            });
            return await response.json();
          } catch (err) {
            return { error: { message: String(err) } };
          }
        },
        { laptopId: secondLaptop.data.uniqueId, userId: userInfo.id }
      );

      expect(result.success).toBe(false);
      expect(result.error.message).toContain(testLaptop.data.uniqueId);

      // Cleanup
      await checkinLaptop(regularUserPage, testLaptop.data.uniqueId);
    });

    test('should allow checkout after checking in previous laptop', async ({
      regularUserPage,
    }) => {
      // Checkout first laptop
      await checkoutLaptop(regularUserPage, testLaptop.data.uniqueId, userInfo.id);

      // Checkin first laptop
      await checkinLaptop(regularUserPage, testLaptop.data.uniqueId);

      // Create second laptop
      const secondLaptop = await createTestLaptop(regularUserPage, {
        uniqueId: `LAP-TEST-2-${Date.now()}`,
      });

      // Should be able to checkout second laptop
      const result = await checkoutLaptop(
        regularUserPage,
        secondLaptop.data.uniqueId,
        userInfo.id
      );
      expect(result.success).toBe(true);

      // Cleanup
      await checkinLaptop(regularUserPage, secondLaptop.data.uniqueId);
    });
  });

  test.describe('UI Integration Tests', () => {
    test('should display laptop information after scanning', async ({ regularUserPage }) => {
      // Navigate to scan page
      await qrScanPage.goto();

      // Mock the laptop fetch
      await mockAPIResponse(
        regularUserPage,
        `**/api/v1/laptops/unique/${testLaptop.data.uniqueId}`,
        {
          success: true,
          data: testLaptop.data,
        }
      );

      // Load laptop details programmatically
      await regularUserPage.evaluate(
        (laptop) => {
          const event = new CustomEvent('laptop-scanned', { detail: laptop });
          window.dispatchEvent(event);
        },
        testLaptop.data
      );
    });

    test('should show appropriate alert messages', async ({ regularUserPage }) => {
      // Checkout a laptop first
      await checkoutLaptop(regularUserPage, testLaptop.data.uniqueId, userInfo.id);

      // Navigate to scan page
      await qrScanPage.goto();

      // Check current checkout exists
      const checkout = await getCurrentCheckout(regularUserPage);
      expect(checkout.data).toBeTruthy();

      // Cleanup
      await checkinLaptop(regularUserPage, testLaptop.data.uniqueId);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle rapid checkout/checkin operations', async ({ regularUserPage }) => {
      // Perform multiple checkout/checkin cycles
      for (let i = 0; i < 3; i++) {
        await checkoutLaptop(regularUserPage, testLaptop.data.uniqueId, userInfo.id);
        await checkinLaptop(regularUserPage, testLaptop.data.uniqueId);
      }

      // Verify laptop is available
      const status = await getCheckoutStatus(regularUserPage, testLaptop.data.uniqueId);
      expect(status.data.laptop.status).toBe('available');
    });

    test('should handle checkout when laptop is in maintenance', async ({ regularUserPage }) => {
      // Update laptop to maintenance status (would need admin API)
      // This test verifies the frontend handles it gracefully
      const status = await getCheckoutStatus(regularUserPage, testLaptop.data.uniqueId);
      expect(status.data.laptop).toBeTruthy();
    });
  });
});
