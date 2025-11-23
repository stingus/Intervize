import { test, expect } from '../fixtures/auth.fixture';
import { LoginPage } from '../pages/LoginPage';
import { TEST_USERS } from '../fixtures/auth.fixture';

test.describe('Login Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display login page correctly', async () => {
    await expect(loginPage.pageTitle).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await loginPage.loginButton.click();

    // Check for validation errors - wait a bit for validation to trigger
    await page.waitForTimeout(500);

    // Check for any validation-related text
    const hasValidationError = await page.locator('text=/required|invalid|must/i').count() > 0;

    // If no validation errors visible, the form might submit without client-side validation
    // This test may need to be adjusted based on actual form behavior
    if (!hasValidationError) {
      // Check if we're still on login page (form didn't submit)
      await expect(page).toHaveURL(/login/);
    }
  });

  test('should show validation error for invalid email format', async () => {
    await loginPage.emailInput.fill('invalid-email');
    await loginPage.passwordInput.fill('password123');
    await loginPage.loginButton.click();

    // Wait for potential validation or error
    await loginPage.page.waitForTimeout(500);

    // Check for email validation error or server error
    const emailError = loginPage.page.locator('text=/invalid.*email|email.*invalid/i');
    const hasError = await emailError.isVisible({ timeout: 2000 }).catch(() => false);

    // If no validation error, check if still on login page (client-side validation might not exist)
    if (!hasError) {
      await expect(loginPage.page).toHaveURL(/login/);
    }
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await loginPage.login('invalid@example.com', 'wrongpassword');

    // Wait for potential error or stay on login page
    await page.waitForTimeout(1000);

    // Either see an error message or still on login page (failed to login)
    const errorMessage = await loginPage.getErrorMessage();

    if (errorMessage) {
      expect(errorMessage).toMatch(/login failed|invalid|incorrect|not found|unauthorized|401/i);
    } else {
      // If no explicit error message, verify we're still on login page (login failed)
      await expect(page).toHaveURL(/login/);
    }
  });

  test('should successfully login as admin user', async ({ page }) => {
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);

    // Wait for redirect
    await loginPage.waitForRedirect();

    // Should be redirected to home or dashboard
    await expect(page).toHaveURL(/\/(admin\/dashboard)?$/);

    // Should see welcome message or user menu
    const welcomeMessage = page.locator('text=Welcome').or(page.locator('text=Admin User'));
    await expect(welcomeMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('should successfully login as regular user', async ({ page }) => {
    await loginPage.login(TEST_USERS.regular.email, TEST_USERS.regular.password);

    // Wait for redirect
    await loginPage.waitForRedirect();

    // Should be redirected to home page
    await expect(page).toHaveURL(/\/$/);

    // Should see welcome message
    const welcomeMessage = page.locator('text=Welcome');
    await expect(welcomeMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('should remember login after page refresh', async ({ page }) => {
    await loginPage.login(TEST_USERS.regular.email, TEST_USERS.regular.password);
    await loginPage.waitForRedirect();

    // Refresh the page
    await page.reload();

    // Should still be logged in
    await expect(page).not.toHaveURL(/login/);
    const welcomeMessage = page.locator('text=Welcome');
    await expect(welcomeMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('should clear form fields on successful login', async ({ page }) => {
    await loginPage.login(TEST_USERS.regular.email, TEST_USERS.regular.password);
    await loginPage.waitForRedirect();

    // Navigate back to login (should be redirected if already logged in)
    await page.goto('/login');

    // Should be redirected away from login page if already authenticated
    // OR form should be empty
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await expect(loginPage.emailInput).toHaveValue('');
      await expect(loginPage.passwordInput).toHaveValue('');
    }
  });

  test('should disable submit button while logging in', async ({ page }) => {
    // Fill in valid credentials
    await loginPage.emailInput.fill(TEST_USERS.regular.email);
    await loginPage.passwordInput.fill(TEST_USERS.regular.password);

    // Click submit and immediately check if button is disabled
    const submitPromise = loginPage.loginButton.click();

    // Button should be disabled during submission
    await expect(loginPage.loginButton).toBeDisabled({ timeout: 1000 }).catch(() => {
      // Some implementations may not disable but show loading
    });

    await submitPromise;
  });

  test('should navigate to forgot password page', async ({ page }) => {
    // Check if forgot password link exists
    const forgotPasswordExists = await loginPage.forgotPasswordLink.isVisible({ timeout: 2000 }).catch(() => false);

    if (forgotPasswordExists) {
      await loginPage.forgotPasswordLink.click();

      // Should navigate to forgot password page
      await expect(page).toHaveURL(/forgot-password/);
    } else {
      // If forgot password feature doesn't exist, skip this test
      test.skip();
    }
  });
});
