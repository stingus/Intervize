import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for QR Scan Page
 */
export class QRScanPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly startCameraButton: Locator;
  readonly stopScanningButton: Locator;
  readonly resetButton: Locator;
  readonly stepper: Locator;
  readonly errorAlert: Locator;
  readonly successAlert: Locator;
  readonly scannerContainer: Locator;
  readonly processingIndicator: Locator;
  readonly laptopActionCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h4').filter({ hasText: /qr code scanner/i });
    this.startCameraButton = page.locator('button').filter({ hasText: /start camera/i });
    this.stopScanningButton = page.locator('button', { has: page.locator('svg') }).filter({ hasText: '' });
    this.resetButton = page.locator('button[aria-label*="reset"]').or(page.locator('svg').filter({ hasText: /restart/i }).locator('..'));
    this.stepper = page.locator('[class*="MuiStepper"]');
    this.errorAlert = page.locator('[role="alert"]').filter({ hasText: /error|failed|invalid/i });
    this.successAlert = page.locator('[role="alert"]').filter({ hasText: /success/i });
    this.scannerContainer = page.locator('#reader');
    this.processingIndicator = page.locator('text=Processing');
    this.laptopActionCard = page.locator('text=Laptop Details, text=Action').first();
  }

  /**
   * Navigate to the QR scan page
   */
  async goto() {
    await this.page.goto('/scan');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check current step in the scanning process
   */
  async getCurrentStep(): Promise<string> {
    // More specific selector for active MUI step label
    const activeStep = this.page.locator('.MuiStepLabel-root.Mui-active .MuiStepLabel-label, [class*="MuiStepLabel"][class*="active"] .MuiStepLabel-label').first();
    const text = await activeStep.textContent({ timeout: 5000 }).catch(() => null);
    return text || 'Start';
  }

  /**
   * Start scanning
   */
  async startScanning() {
    await this.startCameraButton.click();
    await this.page.waitForTimeout(500); // Wait for camera initialization
  }

  /**
   * Stop scanning
   */
  async stopScanning() {
    if (await this.stopScanningButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.stopScanningButton.click();
    }
  }

  /**
   * Reset the scanning process
   */
  async reset() {
    if (await this.resetButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.resetButton.click();
    }
  }

  /**
   * Get error message if present
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.errorAlert.isVisible({ timeout: 2000 }).catch(() => false)) {
      return await this.errorAlert.textContent();
    }
    return null;
  }

  /**
   * Check if success message is displayed
   */
  async hasSuccessMessage(): Promise<boolean> {
    return await this.successAlert.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Wait for processing to complete
   */
  async waitForProcessing() {
    await this.processingIndicator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.processingIndicator.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  /**
   * Simulate scanning a QR code with a laptop unique ID
   * This bypasses camera by directly navigating to the action state
   */
  async simulateScan(laptopUniqueId: string) {
    // Mock API responses for the laptop and status check
    await this.page.route(`**/api/v1/laptops/unique/${laptopUniqueId}`, async (route) => {
      await route.continue();
    });

    // Navigate directly to scan page with unique ID (simulating QR scan result)
    await this.page.goto(`/scan/${laptopUniqueId}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get checkout button
   */
  get checkoutButton(): Locator {
    return this.page.locator('button').filter({ hasText: /checkout laptop/i });
  }

  /**
   * Get checkin button
   */
  get checkinButton(): Locator {
    return this.page.locator('button').filter({ hasText: /check-in laptop/i });
  }

  /**
   * Get report found button
   */
  get reportFoundButton(): Locator {
    return this.page.locator('button').filter({ hasText: /report as found/i });
  }

  /**
   * Get report lost button
   */
  get reportLostButton(): Locator {
    return this.page.locator('button').filter({ hasText: /report as lost/i });
  }

  /**
   * Click checkout button
   */
  async clickCheckout() {
    await this.checkoutButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click checkin button
   */
  async clickCheckin() {
    await this.checkinButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click report found button
   */
  async clickReportFound() {
    await this.reportFoundButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click report lost button
   */
  async clickReportLost() {
    await this.reportLostButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get laptop details displayed on action card
   */
  async getLaptopDetails() {
    const makeModel = await this.page.locator('h5').filter({ hasText: /dell|hp|lenovo|apple/i }).textContent();
    const serialText = await this.page.locator('text=/Serial:/i').textContent();
    const statusChip = await this.page.locator('.MuiChip-label').first().textContent();

    return {
      makeModel: makeModel?.trim() || '',
      serial: serialText?.replace('Serial:', '').trim() || '',
      status: statusChip?.trim() || '',
    };
  }

  /**
   * Check if a specific action button is visible
   */
  async isActionButtonVisible(action: 'checkout' | 'checkin' | 'found' | 'lost'): Promise<boolean> {
    let button: Locator;
    switch (action) {
      case 'checkout':
        button = this.checkoutButton;
        break;
      case 'checkin':
        button = this.checkinButton;
        break;
      case 'found':
        button = this.reportFoundButton;
        break;
      case 'lost':
        button = this.reportLostButton;
        break;
    }
    return await button.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get all visible action buttons
   */
  async getVisibleActions(): Promise<string[]> {
    const actions: string[] = [];

    if (await this.isActionButtonVisible('checkout')) actions.push('checkout');
    if (await this.isActionButtonVisible('checkin')) actions.push('checkin');
    if (await this.isActionButtonVisible('found')) actions.push('found');
    if (await this.isActionButtonVisible('lost')) actions.push('lost');

    return actions;
  }

  /**
   * Wait for action to complete and see success message
   */
  async waitForActionSuccess(timeout = 5000): Promise<boolean> {
    try {
      await this.page.waitForSelector('[role="alert"]', { state: 'visible', timeout });
      const alertText = await this.successAlert.textContent();
      return alertText !== null && alertText.toLowerCase().includes('success');
    } catch {
      return false;
    }
  }

  /**
   * Get info alert message (e.g., "You currently have another laptop checked out")
   */
  async getInfoMessage(): Promise<string | null> {
    const infoAlert = this.page.locator('[role="alert"]').filter({ hasText: /info|currently|another/i });
    if (await infoAlert.isVisible({ timeout: 2000 }).catch(() => false)) {
      return await infoAlert.textContent();
    }
    return null;
  }
}
