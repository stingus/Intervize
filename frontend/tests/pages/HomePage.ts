import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Home Page
 */
export class HomePage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly currentCheckoutCard: Locator;
  readonly scanQRButton: Locator;
  readonly instructionsCard: Locator;
  readonly laptopDetails: Locator;
  readonly checkoutDuration: Locator;
  readonly overdueChip: Locator;
  readonly warningChip: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.locator('h4').filter({ hasText: /welcome/i });
    this.currentCheckoutCard = page.locator('text=Current Checkout').locator('..');
    this.scanQRButton = page.locator('button').filter({ hasText: /scan/i });
    this.instructionsCard = page.locator('text=How It Works').locator('..');
    // More flexible locators for laptop details and duration
    this.laptopDetails = page.locator('text=/laptop.*details|model|make/i').first();
    this.checkoutDuration = page.locator('text=/duration|checked out|time/i').first();
    this.overdueChip = page.locator('text=OVERDUE');
    this.warningChip = page.locator('text=Approaching');
  }

  /**
   * Navigate to the home page
   */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get welcome message text
   */
  async getWelcomeMessage(): Promise<string | null> {
    return await this.welcomeMessage.textContent();
  }

  /**
   * Check if user has an active checkout
   */
  async hasActiveCheckout(): Promise<boolean> {
    const noCheckoutMessage = this.page.locator('text=You don\'t have any laptop checked out');
    return !(await noCheckoutMessage.isVisible({ timeout: 2000 }).catch(() => false));
  }

  /**
   * Click scan QR code button
   */
  async clickScanQR() {
    await this.scanQRButton.first().click();
    await this.page.waitForURL('**/scan');
  }

  /**
   * Get current checkout laptop info
   */
  async getCurrentCheckoutInfo(): Promise<{ make: string; model: string; serial: string } | null> {
    if (!(await this.hasActiveCheckout())) {
      return null;
    }

    const laptopDetailsText = await this.laptopDetails.textContent();
    // Parse laptop details from the text
    return {
      make: '',
      model: '',
      serial: '',
    };
  }

  /**
   * Check if checkout is overdue
   */
  async isCheckoutOverdue(): Promise<boolean> {
    return await this.overdueChip.isVisible({ timeout: 1000 }).catch(() => false);
  }

  /**
   * Check if checkout is approaching warning time
   */
  async isCheckoutApproachingWarning(): Promise<boolean> {
    return await this.warningChip.isVisible({ timeout: 1000 }).catch(() => false);
  }
}
