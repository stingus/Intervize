import { test as base, Page } from '@playwright/test';

/**
 * Test credentials for different user types
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'admin' as const,
  },
  regular: {
    email: 'user@example.com',
    password: 'User123!',
    role: 'interviewer' as const,
  },
  regular2: {
    email: 'user2@example.com',
    password: 'User123!',
    role: 'interviewer' as const,
  },
};

/**
 * Extended fixtures for authentication
 */
type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  regularUserPage: Page;
};

/**
 * Helper function to login a user
 */
async function loginUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Fill in login form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect after successful login
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 10000,
  });
}

/**
 * Helper function to logout
 */
async function logout(page: Page): Promise<void> {
  // Close any open dialogs first to avoid blocking clicks
  const openDialog = page.locator('[role="dialog"]');
  if (await openDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
    // Try to close dialog with Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // If still visible, try clicking cancel button
    if (await openDialog.isVisible({ timeout: 500 }).catch(() => false)) {
      const cancelButton = openDialog.locator('button').filter({ hasText: /cancel|close/i });
      if (await cancelButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await cancelButton.click();
        await page.waitForTimeout(500);
      }
    }
  }

  // Click on user menu button (typically in header/layout)
  const userMenuButton = page.locator('button[aria-label*="user"], button[aria-label*="account"]').first();

  if (await userMenuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await userMenuButton.click();

    // Click logout option
    const logoutButton = page.locator('text="Logout"').or(page.locator('text="Sign out"'));
    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click();
      await page.waitForURL('**/login');
    }
  }
}

/**
 * Clear browser storage
 */
async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  // Fixture for any authenticated page
  authenticatedPage: async ({ page }, use) => {
    await loginUser(page, TEST_USERS.regular.email, TEST_USERS.regular.password);
    await use(page);
    await logout(page);
    await clearStorage(page);
  },

  // Fixture specifically for admin user
  adminPage: async ({ page }, use) => {
    await loginUser(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await use(page);
    await logout(page);
    await clearStorage(page);
  },

  // Fixture specifically for regular user
  regularUserPage: async ({ page }, use) => {
    await loginUser(page, TEST_USERS.regular.email, TEST_USERS.regular.password);
    await use(page);
    await logout(page);
    await clearStorage(page);
  },
});

export { expect } from '@playwright/test';
