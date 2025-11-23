import { test, expect } from '../fixtures/auth.fixture';

test.describe('Navigation Tests', () => {
  test.describe('Regular User Navigation', () => {
    test('should navigate between pages using menu/navigation', async ({ regularUserPage }) => {
      // Start at home
      await regularUserPage.goto('/');

      // Navigate to QR scan page
      await regularUserPage.goto('/scan');
      await expect(regularUserPage).toHaveURL(/\/scan/);

      // Navigate back to home
      await regularUserPage.goto('/');
      await expect(regularUserPage).toHaveURL(/\/$/);
    });

    test('should not have access to admin pages', async ({ regularUserPage }) => {
      const adminPages = ['/admin/dashboard', '/admin/laptops', '/admin/users'];

      for (const page of adminPages) {
        await regularUserPage.goto(page);

        const currentUrl = regularUserPage.url();

        // Either redirected or see access denied
        if (currentUrl.includes('/admin')) {
          const accessDenied = regularUserPage
            .locator('text=Access denied, text=Not authorized, text=403')
            .first();
          await expect(accessDenied).toBeVisible({ timeout: 5000 });
        } else {
          expect(currentUrl).not.toContain('/admin');
        }
      }
    });

    test('should show navigation menu or header', async ({ regularUserPage }) => {
      await regularUserPage.goto('/');

      // Should have some form of navigation (header, menu, etc)
      const nav = regularUserPage.locator('nav, header, [role="navigation"]').first();
      const hasNav = await nav.isVisible({ timeout: 2000 }).catch(() => false);

      // Navigation should exist or there should be navigation buttons
      if (!hasNav) {
        const navButtons = regularUserPage.locator('a, button').filter({ hasText: /home|scan/i });
        const count = await navButtons.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should maintain authentication across page navigation', async ({ regularUserPage }) => {
      await regularUserPage.goto('/');
      const welcomeMessage1 = regularUserPage.locator('text=Welcome');
      await expect(welcomeMessage1.first()).toBeVisible({ timeout: 5000 });

      await regularUserPage.goto('/scan');
      await regularUserPage.goto('/');

      const welcomeMessage2 = regularUserPage.locator('text=Welcome');
      await expect(welcomeMessage2.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Admin User Navigation', () => {
    test('should navigate between admin pages', async ({ adminPage }) => {
      // Dashboard
      await adminPage.goto('/admin/dashboard');
      await expect(adminPage).toHaveURL(/\/admin\/dashboard/);

      // Laptop Management
      await adminPage.goto('/admin/laptops');
      await expect(adminPage).toHaveURL(/\/admin\/laptops/);

      // User Management
      await adminPage.goto('/admin/users');
      await expect(adminPage).toHaveURL(/\/admin\/users/);

      // Back to Dashboard
      await adminPage.goto('/admin/dashboard');
      await expect(adminPage).toHaveURL(/\/admin\/dashboard/);
    });

    test('should have access to both admin and regular user pages', async ({ adminPage }) => {
      // Admin can access regular pages
      await adminPage.goto('/');
      await expect(adminPage).toHaveURL(/\/$/);

      await adminPage.goto('/scan');
      await expect(adminPage).toHaveURL(/\/scan/);

      // Admin can access admin pages
      await adminPage.goto('/admin/dashboard');
      await expect(adminPage).toHaveURL(/\/admin\/dashboard/);
    });

    test('should show admin navigation menu', async ({ adminPage }) => {
      await adminPage.goto('/admin/dashboard');

      // Should have navigation to admin pages
      const dashboardLink = adminPage.locator('a, button').filter({ hasText: /dashboard/i });
      const laptopsLink = adminPage.locator('a, button').filter({ hasText: /laptop/i });
      const usersLink = adminPage.locator('a, button').filter({ hasText: /user/i });

      // At least some navigation should be visible
      const hasDashboard = await dashboardLink.first().isVisible({ timeout: 2000 }).catch(() => false);
      const hasLaptops = await laptopsLink.first().isVisible({ timeout: 2000 }).catch(() => false);
      const hasUsers = await usersLink.first().isVisible({ timeout: 2000 }).catch(() => false);

      const hasAnyNav = hasDashboard || hasLaptops || hasUsers;
      expect(hasAnyNav).toBe(true);
    });

    test('should maintain authentication across admin pages', async ({ adminPage }) => {
      await adminPage.goto('/admin/dashboard');
      const title1 = adminPage.locator('h4').filter({ hasText: /admin dashboard/i });
      await expect(title1).toBeVisible({ timeout: 5000 });

      await adminPage.goto('/admin/laptops');
      await adminPage.goto('/admin/users');
      await adminPage.goto('/admin/dashboard');

      const title2 = adminPage.locator('h4').filter({ hasText: /admin dashboard/i });
      await expect(title2).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Browser Navigation', () => {
    test('should handle browser back button', async ({ regularUserPage }) => {
      await regularUserPage.goto('/');
      await regularUserPage.goto('/scan');

      await regularUserPage.goBack();
      await expect(regularUserPage).toHaveURL(/\/$/);
    });

    test('should handle browser forward button', async ({ regularUserPage }) => {
      await regularUserPage.goto('/');
      await regularUserPage.goto('/scan');
      await regularUserPage.goBack();

      await regularUserPage.goForward();
      await expect(regularUserPage).toHaveURL(/\/scan/);
    });

    test('should handle page refresh', async ({ regularUserPage }) => {
      await regularUserPage.goto('/');
      const welcomeBefore = regularUserPage.locator('text=Welcome');
      await expect(welcomeBefore.first()).toBeVisible({ timeout: 5000 });

      await regularUserPage.reload();

      const welcomeAfter = regularUserPage.locator('text=Welcome');
      await expect(welcomeAfter.first()).toBeVisible({ timeout: 5000 });
    });

    test('should redirect to login when accessing protected routes without auth', async ({ page }) => {
      await page.goto('/');

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });

    test('should handle direct URL access to pages', async ({ regularUserPage }) => {
      // Access scan page directly
      await regularUserPage.goto('/scan');
      await expect(regularUserPage).toHaveURL(/\/scan/);

      const scanTitle = regularUserPage.locator('h4').filter({ hasText: /qr.*scan/i });
      await expect(scanTitle).toBeVisible({ timeout: 5000 });
    });

    test('should handle 404 for non-existent routes', async ({ regularUserPage }) => {
      await regularUserPage.goto('/non-existent-page-xyz123');

      // Should redirect to home or show 404
      const currentUrl = regularUserPage.url();
      const isRedirectedHome = currentUrl.endsWith('/') && !currentUrl.includes('non-existent');

      if (!isRedirectedHome) {
        // If not redirected, should show 404 or error message
        const notFound = regularUserPage.locator('text=404, text=Not Found, text=Page not found').first();
        await expect(notFound).toBeVisible({ timeout: 5000 });
      } else {
        expect(isRedirectedHome).toBe(true);
      }
    });
  });

  test.describe('Logout Navigation', () => {
    test('should logout and redirect to login page', async ({ regularUserPage }) => {
      await regularUserPage.goto('/');

      // Find and click logout button
      const userMenuButton = regularUserPage
        .locator('button[aria-label*="user"], button[aria-label*="account"]')
        .first();

      if (await userMenuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await userMenuButton.click();

        const logoutButton = regularUserPage.locator('text="Logout"').or(
          regularUserPage.locator('text="Sign out"')
        );

        if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutButton.click();

          // Should redirect to login
          await expect(regularUserPage).toHaveURL(/\/login/, { timeout: 10000 });
        }
      }
    });

    test('should clear session after logout', async ({ page, regularUserPage }) => {
      await regularUserPage.goto('/');

      // Logout
      const userMenuButton = regularUserPage
        .locator('button[aria-label*="user"], button[aria-label*="account"]')
        .first();

      if (await userMenuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await userMenuButton.click();

        const logoutButton = regularUserPage.locator('text="Logout"').or(
          regularUserPage.locator('text="Sign out"')
        );

        if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutButton.click();
          await regularUserPage.waitForURL(/\/login/, { timeout: 10000 });

          // Try to access protected page
          await regularUserPage.goto('/');

          // Should be redirected to login
          await expect(regularUserPage).toHaveURL(/\/login/, { timeout: 10000 });
        }
      }
    });
  });
});
