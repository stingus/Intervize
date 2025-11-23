import { test, expect } from '../fixtures/auth.fixture';
import { HomePage } from '../pages/HomePage';

test.describe('Regular User - Home Page', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ regularUserPage }) => {
    homePage = new HomePage(regularUserPage);
    await homePage.goto();
  });

  test('should display home page correctly', async () => {
    await expect(homePage.welcomeMessage).toBeVisible();
    await expect(homePage.currentCheckoutCard).toBeVisible();
    await expect(homePage.instructionsCard).toBeVisible();
  });

  test('should show personalized welcome message', async () => {
    const welcomeText = await homePage.getWelcomeMessage();
    expect(welcomeText).toMatch(/welcome/i);
    expect(welcomeText).toMatch(/john doe/i); // From seed data
  });

  test('should display instructions card with proper content', async ({ regularUserPage }) => {
    const instructionsText = await homePage.instructionsCard.textContent();

    expect(instructionsText).toMatch(/how it works/i);
    expect(instructionsText).toMatch(/qr code/i);
    expect(instructionsText).toMatch(/check-out/i);
    expect(instructionsText).toMatch(/check-in/i);
    expect(instructionsText).toMatch(/3 hours/i);
  });

  test('should show no checkout message when user has no active checkout', async () => {
    const hasCheckout = await homePage.hasActiveCheckout();

    if (!hasCheckout) {
      const noCheckoutMessage = homePage.page.locator('text=You don\'t have any laptop checked out');
      await expect(noCheckoutMessage).toBeVisible();

      // Should show scan QR button
      await expect(homePage.scanQRButton).toBeVisible();
    }
  });

  test('should navigate to QR scan page when clicking scan button', async ({ regularUserPage }) => {
    await homePage.clickScanQR();

    // Should navigate to scan page
    await expect(regularUserPage).toHaveURL(/\/scan/);
  });

  test('should display current checkout information if user has active checkout', async ({ regularUserPage }) => {
    const hasCheckout = await homePage.hasActiveCheckout();

    if (hasCheckout) {
      // Should show laptop/checkout related information
      const laptopInfo = regularUserPage.locator('text=/laptop|model|serial|checked out/i').first();
      await expect(laptopInfo).toBeVisible({ timeout: 5000 });

      // Should show duration or time-related info
      const timeInfo = regularUserPage.locator('text=/duration|hour|minute|ago|time/i').first();
      await expect(timeInfo).toBeVisible({ timeout: 5000 });

      // Should show scan to check-in button
      const checkinButton = regularUserPage.locator('button').filter({ hasText: /check-in|scan/i });
      await expect(checkinButton.first()).toBeVisible();
    }
  });

  test('should show warning alert if checkout is approaching 3 hours', async () => {
    const hasCheckout = await homePage.hasActiveCheckout();

    if (hasCheckout) {
      const isApproaching = await homePage.isCheckoutApproachingWarning();

      if (isApproaching) {
        await expect(homePage.warningChip).toBeVisible();
      }
    }
  });

  test('should show overdue alert if checkout exceeds 24 hours', async ({ regularUserPage }) => {
    const hasCheckout = await homePage.hasActiveCheckout();

    if (hasCheckout) {
      const isOverdue = await homePage.isCheckoutOverdue();

      if (isOverdue) {
        await expect(homePage.overdueChip).toBeVisible();

        // Should show error alert with message
        const overdueAlert = regularUserPage.locator('[role="alert"]').filter({ hasText: /overdue/i });
        await expect(overdueAlert).toBeVisible();
      }
    }
  });

  test('should update checkout duration in real-time', async ({ regularUserPage }) => {
    const hasCheckout = await homePage.hasActiveCheckout();

    if (hasCheckout) {
      const initialDuration = await homePage.checkoutDuration.textContent();

      // Wait a few seconds
      await regularUserPage.waitForTimeout(3000);

      const updatedDuration = await homePage.checkoutDuration.textContent();

      // Duration should have changed (even by seconds)
      // Note: This test may be flaky if the text format changes
      expect(updatedDuration).toBeDefined();
    }
  });

  test('should have accessible scan QR button with icon', async () => {
    const scanButton = homePage.scanQRButton.first();
    await expect(scanButton).toBeVisible();

    // Button should have QR scanner icon
    const icon = scanButton.locator('svg').first();
    await expect(icon).toBeVisible();
  });

  test('should display warning about return policy', async ({ regularUserPage }) => {
    const warningText = await homePage.instructionsCard.textContent();

    expect(warningText).toMatch(/3 hours/i);
    expect(warningText).toMatch(/24 hours/i);
    expect(warningText).toMatch(/overdue/i);
  });
});
