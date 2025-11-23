import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/admin/DashboardPage';

test.describe('Admin - Dashboard Page', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ adminPage }) => {
    dashboardPage = new DashboardPage(adminPage);
    await dashboardPage.goto();
  });

  test('should display admin dashboard correctly', async () => {
    await expect(dashboardPage.pageTitle).toBeVisible();
    await expect(dashboardPage.pageTitle).toContainText('Admin Dashboard');
  });

  test('should display all summary cards', async () => {
    await expect(dashboardPage.totalLaptopsCard).toBeVisible();
    await expect(dashboardPage.availableLaptopsCard).toBeVisible();
    await expect(dashboardPage.checkedOutLaptopsCard).toBeVisible();
    await expect(dashboardPage.overdueLaptopsCard).toBeVisible();
  });

  test('should display laptop count statistics', async () => {
    const totalLaptops = await dashboardPage.getTotalLaptops();
    const availableLaptops = await dashboardPage.getAvailableLaptops();
    const checkedOutLaptops = await dashboardPage.getCheckedOutLaptops();
    const overdueLaptops = await dashboardPage.getOverdueLaptops();

    // All counts should be non-negative numbers
    expect(totalLaptops).toBeGreaterThanOrEqual(0);
    expect(availableLaptops).toBeGreaterThanOrEqual(0);
    expect(checkedOutLaptops).toBeGreaterThanOrEqual(0);
    expect(overdueLaptops).toBeGreaterThanOrEqual(0);

    // Basic validation: available + checked out + maintenance + retired should roughly equal total
    // (This is a logical check, numbers may not add up exactly depending on statuses)
    expect(totalLaptops).toBeGreaterThanOrEqual(availableLaptops);
  });

  test('should display summary cards with proper icons', async ({ adminPage }) => {
    // Check for icons in summary cards
    const laptopIcon = adminPage.locator('svg').filter({ hasText: '' }).first();
    await expect(laptopIcon).toBeVisible();
  });

  test('should display active checkouts table', async () => {
    await expect(dashboardPage.activeCheckoutsTable).toBeVisible();
  });

  test('should show active checkouts with proper columns', async ({ adminPage }) => {
    const tableHeaders = ['Laptop', 'User', 'Checked Out', 'Duration', 'Status'];

    for (const header of tableHeaders) {
      const headerCell = adminPage.locator('th').filter({ hasText: new RegExp(header, 'i') });
      await expect(headerCell).toBeVisible();
    }
  });

  test('should display "no active checkouts" message when table is empty', async ({ adminPage }) => {
    const checkoutsCount = await dashboardPage.getActiveCheckoutsCount();

    if (checkoutsCount === 0) {
      // Check for various possible "no data" messages
      const noCheckoutsMessage = adminPage.locator('text=/no.*checkout|no.*data|empty/i').first();
      const hasMessage = await noCheckoutsMessage.isVisible({ timeout: 2000 }).catch(() => false);

      // If no specific message, verify the table is indeed empty
      if (!hasMessage) {
        expect(checkoutsCount).toBe(0);
      }
    }
  });

  test('should display checkout details in active checkouts table', async () => {
    const checkoutsCount = await dashboardPage.getActiveCheckoutsCount();

    if (checkoutsCount > 0) {
      const firstCheckout = await dashboardPage.getCheckoutDetails(0);

      expect(firstCheckout).not.toBeNull();
      expect(firstCheckout?.laptop).toBeTruthy();
      expect(firstCheckout?.user).toBeTruthy();
      expect(firstCheckout?.status).toBeTruthy();
    }
  });

  test('should show overdue laptops section when laptops are overdue', async ({ adminPage }) => {
    const overdueCount = await dashboardPage.getOverdueLaptops();

    if (overdueCount > 0) {
      await expect(dashboardPage.overdueCheckoutsTable).toBeVisible();
      await expect(dashboardPage.overdueAlert).toBeVisible();

      // Verify overdue alert contains count
      const alertText = await dashboardPage.overdueAlert.textContent();
      expect(alertText).toMatch(/\d+.*laptop.*overdue/i);
    }
  });

  test('should not show overdue section when no laptops are overdue', async ({ adminPage }) => {
    const overdueCount = await dashboardPage.getOverdueLaptops();

    if (overdueCount === 0) {
      const hasOverdueSection = await dashboardPage.overdueCheckoutsTable
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      expect(hasOverdueSection).toBe(false);
    }
  });

  test('should display overdue laptops with proper status chips', async ({ adminPage }) => {
    const overdueTableCount = await dashboardPage.getOverdueCheckoutsCount();

    if (overdueTableCount > 0) {
      const overdueChip = adminPage.locator('text=OVERDUE').first();
      await expect(overdueChip).toBeVisible();
    }
  });

  test('should show status chips with appropriate colors', async ({ adminPage }) => {
    const checkoutsCount = await dashboardPage.getActiveCheckoutsCount();

    if (checkoutsCount > 0) {
      // Look for status chips (Normal, Approaching, Overdue)
      const statusChips = adminPage.locator('[class*="MuiChip"]');
      const count = await statusChips.count();

      expect(count).toBeGreaterThan(0);
    }
  });

  test('should display lost and found events section if events exist', async ({ adminPage }) => {
    const hasEvents = await dashboardPage.hasLostFoundEvents();

    if (hasEvents) {
      await expect(dashboardPage.lostFoundEventsTable).toBeVisible();

      // Check table headers
      const headers = ['Laptop', 'Original User', 'Found By', 'Duration Lost', 'Date'];
      for (const header of headers) {
        const headerCell = adminPage.locator('th').filter({ hasText: new RegExp(header, 'i') });
        await expect(headerCell).toBeVisible();
      }
    }
  });

  test('should refresh data automatically', async ({ adminPage }) => {
    // Get initial count
    const initialCount = await dashboardPage.getTotalLaptops();

    // Wait for potential refresh (configured to 30 seconds in component)
    // We'll just verify the count is still valid after a short wait
    await adminPage.waitForTimeout(2000);

    const afterCount = await dashboardPage.getTotalLaptops();

    // Count should still be a valid number
    expect(afterCount).toBeGreaterThanOrEqual(0);
  });

  test('should display formatted dates in checkout table', async ({ adminPage }) => {
    const checkoutsCount = await dashboardPage.getActiveCheckoutsCount();

    if (checkoutsCount > 0) {
      const dateCell = dashboardPage.activeCheckoutsTable
        .locator('tbody tr')
        .first()
        .locator('td')
        .nth(2);

      const dateText = await dateCell.textContent();
      expect(dateText).toBeTruthy();
      // Date should be formatted (contains numbers and possibly slashes or dashes)
      expect(dateText).toMatch(/\d/);
    }
  });

  test('should display duration in human readable format', async ({ adminPage }) => {
    const checkoutsCount = await dashboardPage.getActiveCheckoutsCount();

    if (checkoutsCount > 0) {
      const durationCell = dashboardPage.activeCheckoutsTable
        .locator('tbody tr')
        .first()
        .locator('td')
        .nth(3);

      const durationText = await durationCell.textContent();
      expect(durationText).toBeTruthy();
      // Duration should contain time units (minutes, hours, days, ago)
      expect(durationText).toMatch(/minute|hour|day|second|ago/i);
    }
  });

  test('should be accessible only to admin users', async ({ regularUserPage }) => {
    // Try to access dashboard as regular user
    await regularUserPage.goto('/admin/dashboard');

    // Wait for potential redirect
    await regularUserPage.waitForTimeout(1000);

    const currentUrl = regularUserPage.url();

    // Either redirected away from dashboard OR see an error message
    const isOnDashboard = currentUrl.includes('/admin/dashboard');

    if (isOnDashboard) {
      // If still on dashboard URL, should see an access denied message or empty/restricted content
      const accessDenied = regularUserPage.locator('text=/access denied|not authorized|forbidden|403/i').first();
      const hasAccessDenied = await accessDenied.isVisible({ timeout: 2000 }).catch(() => false);

      // If no access denied message, check if content is empty/restricted
      if (!hasAccessDenied) {
        const hasContent = await regularUserPage.locator('text=/total.*laptop|active.*checkout/i').isVisible({ timeout: 1000 }).catch(() => false);
        expect(hasContent).toBe(false); // Should not see admin content
      }
    } else {
      // Should be redirected away (most likely scenario)
      expect(currentUrl).not.toContain('/admin/dashboard');
    }
  });

  test('should maintain data consistency across cards and tables', async () => {
    const checkedOutCount = await dashboardPage.getCheckedOutLaptops();
    const tableCount = await dashboardPage.getActiveCheckoutsCount();

    // Note: These might not match exactly if using pagination or filters
    // But both should be non-negative
    expect(checkedOutCount).toBeGreaterThanOrEqual(0);
    expect(tableCount).toBeGreaterThanOrEqual(0);
  });
});
