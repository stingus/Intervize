import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Laptop Management Page
 */
export class LaptopManagementPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly addLaptopButton: Locator;
  readonly laptopsTable: Locator;
  readonly dialog: Locator;
  readonly dialogTitle: Locator;
  readonly makeInput: Locator;
  readonly modelInput: Locator;
  readonly serialNumberInput: Locator;
  readonly statusSelect: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly deleteConfirmDialog: Locator;
  readonly confirmDeleteButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h4').filter({ hasText: /laptop management/i });
    this.addLaptopButton = page.locator('button').filter({ hasText: /add laptop/i });
    this.laptopsTable = page.locator('table');
    this.dialog = page.locator('[role="dialog"]');
    this.dialogTitle = this.dialog.locator('h2');
    this.makeInput = this.dialog.locator('input[name="make"]').or(this.dialog.getByLabel(/make/i));
    this.modelInput = this.dialog.locator('input[name="model"]').or(this.dialog.getByLabel(/model/i));
    this.serialNumberInput = this.dialog.locator('input[name="serialNumber"]').or(this.dialog.getByLabel(/serial/i));
    // For MUI Select, we need to click the div with role="combobox" not the hidden input
    this.statusSelect = this.dialog.locator('[role="combobox"]').or(this.dialog.locator('div.MuiSelect-select'));
    this.saveButton = this.dialog.locator('button[type="submit"]').or(
      this.dialog.locator('button').filter({ hasText: /create|update|save/i })
    );
    this.cancelButton = this.dialog.locator('button').filter({ hasText: /cancel/i });
    this.deleteConfirmDialog = page.locator('[role="dialog"]').filter({ hasText: /confirm delete/i });
    this.confirmDeleteButton = this.deleteConfirmDialog.locator('button').filter({ hasText: /delete/i });
    this.errorAlert = page.locator('[role="alert"]').filter({ hasText: /error|failed/i });
  }

  /**
   * Navigate to the laptop management page
   */
  async goto() {
    await this.page.goto('/admin/laptops');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get total number of laptops in the table
   */
  async getLaptopsCount(): Promise<number> {
    const rows = await this.laptopsTable.locator('tbody tr').count();
    // Check if there's a "no laptops" message
    const noLaptopsMessage = this.page.locator('text=No laptops found');
    if (await noLaptopsMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
      return 0;
    }
    return rows;
  }

  /**
   * Click add laptop button to open dialog
   */
  async clickAddLaptop() {
    await this.addLaptopButton.click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  /**
   * Fill in laptop form
   */
  async fillLaptopForm(data: {
    make: string;
    model: string;
    serialNumber: string;
    status?: string;
  }) {
    await this.makeInput.first().fill(data.make);
    await this.modelInput.first().fill(data.model);
    await this.serialNumberInput.first().fill(data.serialNumber);

    if (data.status) {
      // Click the select to open dropdown
      await this.statusSelect.first().click();
      await this.page.waitForTimeout(300); // Wait for dropdown to open

      // Click the option
      await this.page.locator(`[role="option"]`).filter({ hasText: new RegExp(data.status, 'i') }).click();
    }
  }

  /**
   * Submit the laptop form
   */
  async submitForm() {
    await this.saveButton.click();
    await this.dialog.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Create a new laptop
   */
  async createLaptop(data: {
    make: string;
    model: string;
    serialNumber: string;
    status?: string;
  }) {
    await this.clickAddLaptop();
    await this.fillLaptopForm(data);
    await this.submitForm();
  }

  /**
   * Edit a laptop by row index
   */
  async editLaptop(rowIndex: number, data: Partial<{
    make: string;
    model: string;
    serialNumber: string;
    status: string;
  }>) {
    const row = this.laptopsTable.locator('tbody tr').nth(rowIndex);
    const editButton = row.locator('button[aria-label*="edit"], button').filter({ has: this.page.locator('svg') }).nth(1);
    await editButton.click();
    await this.dialog.waitFor({ state: 'visible' });

    if (data.make) await this.makeInput.first().fill(data.make);
    if (data.model) await this.modelInput.first().fill(data.model);
    if (data.serialNumber) await this.serialNumberInput.first().fill(data.serialNumber);
    if (data.status) {
      await this.statusSelect.first().click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`[role="option"]`).filter({ hasText: new RegExp(data.status, 'i') }).click();
    }

    await this.submitForm();
  }

  /**
   * Delete a laptop by row index
   */
  async deleteLaptop(rowIndex: number) {
    const row = this.laptopsTable.locator('tbody tr').nth(rowIndex);
    const deleteButton = row.locator('button[aria-label*="delete"], button').filter({ has: this.page.locator('svg') }).last();
    await deleteButton.click();
    await this.deleteConfirmDialog.waitFor({ state: 'visible' });
    await this.confirmDeleteButton.click();
    await this.deleteConfirmDialog.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Download QR code for a laptop by row index
   */
  async downloadQRCode(rowIndex: number) {
    const row = this.laptopsTable.locator('tbody tr').nth(rowIndex);
    const qrButton = row.locator('button[aria-label*="qr"], button').filter({ has: this.page.locator('svg') }).first();

    // Set up download listener
    const downloadPromise = this.page.waitForEvent('download');
    await qrButton.click();
    const download = await downloadPromise;

    return download.suggestedFilename();
  }

  /**
   * Get laptop data from table row
   */
  async getLaptopData(rowIndex: number): Promise<{
    uniqueId: string;
    makeModel: string;
    serialNumber: string;
    status: string;
  } | null> {
    const row = this.laptopsTable.locator('tbody tr').nth(rowIndex);
    if (!(await row.isVisible({ timeout: 1000 }).catch(() => false))) {
      return null;
    }

    const cells = row.locator('td');
    return {
      uniqueId: (await cells.nth(0).textContent()) || '',
      makeModel: (await cells.nth(1).textContent()) || '',
      serialNumber: (await cells.nth(2).textContent()) || '',
      status: (await cells.nth(3).textContent()) || '',
    };
  }

  /**
   * Search for a laptop by serial number
   */
  async findLaptopBySerial(serialNumber: string): Promise<number | null> {
    const count = await this.getLaptopsCount();
    for (let i = 0; i < count; i++) {
      const data = await this.getLaptopData(i);
      if (data?.serialNumber === serialNumber) {
        return i;
      }
    }
    return null;
  }

  /**
   * Cancel the dialog
   */
  async cancelDialog() {
    await this.cancelButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }
}
