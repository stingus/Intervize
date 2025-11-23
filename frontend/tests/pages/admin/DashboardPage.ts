import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Admin Dashboard Page
 */
export class DashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly totalLaptopsCard: Locator;
  readonly availableLaptopsCard: Locator;
  readonly checkedOutLaptopsCard: Locator;
  readonly overdueLaptopsCard: Locator;
  readonly activeCheckoutsTable: Locator;
  readonly overdueCheckoutsTable: Locator;
  readonly lostFoundEventsTable: Locator;
  readonly overdueAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h4').filter({ hasText: /admin dashboard/i });
    // Find cards by looking for specific headings, then navigate to parent card
    this.totalLaptopsCard = page.locator('h6, h5, h4, p').filter({ hasText: /^Total Laptops$/i }).locator('xpath=ancestor::*[@class]').first();
    this.availableLaptopsCard = page.locator('h6, h5, h4, p').filter({ hasText: /^Available$/i }).locator('xpath=ancestor::*[@class]').first();
    this.checkedOutLaptopsCard = page.locator('h6, h5, h4, p').filter({ hasText: /^Checked Out$/i }).locator('xpath=ancestor::*[@class]').first();
    this.overdueLaptopsCard = page.locator('h6, h5, h4, p').filter({ hasText: /^Overdue$/i }).locator('xpath=ancestor::*[@class]').first();
    this.activeCheckoutsTable = page.locator('text=Active Checkouts').locator('..').locator('table');
    this.overdueCheckoutsTable = page.locator('text=Overdue Laptops').locator('..').locator('table');
    this.lostFoundEventsTable = page.locator('text=Lost & Found').locator('..').locator('table');
    this.overdueAlert = page.locator('[role="alert"]').filter({ hasText: /overdue/i });
  }

  /**
   * Navigate to the admin dashboard
   */
  async goto() {
    await this.page.goto('/admin/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get total laptops count
   */
  async getTotalLaptops(): Promise<number> {
    const text = await this.totalLaptopsCard.locator('h4, h5, h6, p').filter({ hasText: /^\d+$/ }).first().textContent();
    return parseInt(text || '0', 10);
  }

  /**
   * Get available laptops count
   */
  async getAvailableLaptops(): Promise<number> {
    const text = await this.availableLaptopsCard.locator('h4, h5, h6, p').filter({ hasText: /^\d+$/ }).first().textContent();
    return parseInt(text || '0', 10);
  }

  /**
   * Get checked out laptops count
   */
  async getCheckedOutLaptops(): Promise<number> {
    const text = await this.checkedOutLaptopsCard.locator('h4, h5, h6, p').filter({ hasText: /^\d+$/ }).first().textContent();
    return parseInt(text || '0', 10);
  }

  /**
   * Get overdue laptops count
   */
  async getOverdueLaptops(): Promise<number> {
    const text = await this.overdueLaptopsCard.locator('h4, h5, h6, p').filter({ hasText: /^\d+$/ }).first().textContent();
    return parseInt(text || '0', 10);
  }

  /**
   * Get number of active checkouts in table
   */
  async getActiveCheckoutsCount(): Promise<number> {
    const rows = await this.activeCheckoutsTable.locator('tbody tr').count();
    return rows;
  }

  /**
   * Get number of overdue checkouts in table
   */
  async getOverdueCheckoutsCount(): Promise<number> {
    if (!(await this.overdueCheckoutsTable.isVisible({ timeout: 1000 }).catch(() => false))) {
      return 0;
    }
    const rows = await this.overdueCheckoutsTable.locator('tbody tr').count();
    return rows;
  }

  /**
   * Check if overdue alert is displayed
   */
  async hasOverdueAlert(): Promise<boolean> {
    return await this.overdueAlert.isVisible({ timeout: 1000 }).catch(() => false);
  }

  /**
   * Get checkout details from active checkouts table
   */
  async getCheckoutDetails(rowIndex: number = 0): Promise<{
    laptop: string;
    user: string;
    status: string;
  } | null> {
    const row = this.activeCheckoutsTable.locator('tbody tr').nth(rowIndex);
    if (!(await row.isVisible({ timeout: 1000 }).catch(() => false))) {
      return null;
    }

    const cells = row.locator('td');
    return {
      laptop: (await cells.nth(0).textContent()) || '',
      user: (await cells.nth(1).textContent()) || '',
      status: (await cells.nth(4).textContent()) || '',
    };
  }

  /**
   * Check if lost and found events section is visible
   */
  async hasLostFoundEvents(): Promise<boolean> {
    return await this.lostFoundEventsTable.isVisible({ timeout: 1000 }).catch(() => false);
  }
}
