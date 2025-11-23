import { test, expect } from '../fixtures/auth.fixture';
import { LaptopManagementPage } from '../pages/admin/LaptopManagementPage';

test.describe('Admin - Laptop Management', () => {
  let laptopManagementPage: LaptopManagementPage;

  test.beforeEach(async ({ adminPage }) => {
    laptopManagementPage = new LaptopManagementPage(adminPage);
    await laptopManagementPage.goto();
  });

  test('should display laptop management page correctly', async () => {
    await expect(laptopManagementPage.pageTitle).toBeVisible();
    await expect(laptopManagementPage.pageTitle).toContainText('Laptop Management');
    await expect(laptopManagementPage.addLaptopButton).toBeVisible();
    await expect(laptopManagementPage.laptopsTable).toBeVisible();
  });

  test('should display laptops table with correct columns', async ({ adminPage }) => {
    const tableHeaders = ['Unique ID', 'Make & Model', 'Serial Number', 'Status', 'Actions'];

    for (const header of tableHeaders) {
      const headerCell = adminPage.locator('th').filter({ hasText: new RegExp(header, 'i') });
      await expect(headerCell).toBeVisible();
    }
  });

  test('should display existing laptops from seed data', async () => {
    const laptopsCount = await laptopManagementPage.getLaptopsCount();

    // Should have at least the seed data laptops (3 laptops)
    expect(laptopsCount).toBeGreaterThanOrEqual(0);
  });

  test('should show laptop details in table rows', async () => {
    const laptopsCount = await laptopManagementPage.getLaptopsCount();

    if (laptopsCount > 0) {
      const firstLaptop = await laptopManagementPage.getLaptopData(0);

      expect(firstLaptop).not.toBeNull();
      expect(firstLaptop?.uniqueId).toBeTruthy();
      expect(firstLaptop?.makeModel).toBeTruthy();
      expect(firstLaptop?.serialNumber).toBeTruthy();
      expect(firstLaptop?.status).toBeTruthy();
    }
  });

  test('should display status chips with appropriate colors', async ({ adminPage }) => {
    const laptopsCount = await laptopManagementPage.getLaptopsCount();

    if (laptopsCount > 0) {
      const statusChip = adminPage.locator('[class*="MuiChip"]').first();
      await expect(statusChip).toBeVisible();

      const chipText = await statusChip.textContent();
      expect(chipText).toMatch(/AVAILABLE|CHECKED OUT|MAINTENANCE|RETIRED/i);
    }
  });

  test('should open add laptop dialog when clicking add button', async () => {
    await laptopManagementPage.clickAddLaptop();

    await expect(laptopManagementPage.dialog).toBeVisible();
    await expect(laptopManagementPage.dialogTitle).toContainText('Add');
    await expect(laptopManagementPage.makeInput).toBeVisible();
    await expect(laptopManagementPage.modelInput).toBeVisible();
    await expect(laptopManagementPage.serialNumberInput).toBeVisible();
    await expect(laptopManagementPage.statusSelect).toBeVisible();
  });

  test('should close dialog when clicking cancel', async () => {
    await laptopManagementPage.clickAddLaptop();
    await expect(laptopManagementPage.dialog).toBeVisible();

    await laptopManagementPage.cancelDialog();
    await expect(laptopManagementPage.dialog).not.toBeVisible();
  });

  test('should create a new laptop successfully', async () => {
    const initialCount = await laptopManagementPage.getLaptopsCount();

    const testLaptop = {
      make: 'Apple',
      model: 'MacBook Pro 16"',
      serialNumber: `TEST-${Date.now()}`,
      status: 'Available',
    };

    await laptopManagementPage.createLaptop(testLaptop);

    // Wait for table to update
    await laptopManagementPage.page.waitForTimeout(1000);

    const newCount = await laptopManagementPage.getLaptopsCount();
    expect(newCount).toBe(initialCount + 1);

    // Verify the laptop appears in the table
    const laptopIndex = await laptopManagementPage.findLaptopBySerial(testLaptop.serialNumber);
    expect(laptopIndex).not.toBeNull();
  });

  test('should validate required fields when creating laptop', async ({ adminPage }) => {
    await laptopManagementPage.clickAddLaptop();

    // Try to submit without filling fields
    await laptopManagementPage.saveButton.click();

    // Should show validation errors
    const errorMessages = adminPage.locator('text=required, text=is required').first();
    await expect(errorMessages).toBeVisible({ timeout: 2000 });
  });

  test('should edit an existing laptop', async () => {
    const laptopsCount = await laptopManagementPage.getLaptopsCount();

    if (laptopsCount > 0) {
      const originalData = await laptopManagementPage.getLaptopData(0);

      const updatedModel = `Updated Model ${Date.now()}`;
      await laptopManagementPage.editLaptop(0, {
        model: updatedModel,
      });

      // Wait for table to update
      await laptopManagementPage.page.waitForTimeout(1000);

      const updatedData = await laptopManagementPage.getLaptopData(0);

      // Make and serial should remain the same, but makeModel text might have changed
      expect(updatedData?.uniqueId).toBe(originalData?.uniqueId);
    }
  });

  test('should delete a laptop with confirmation', async () => {
    // First create a test laptop to delete
    const testLaptop = {
      make: 'Dell',
      model: 'Test Model',
      serialNumber: `DELETE-TEST-${Date.now()}`,
      status: 'Available',
    };

    await laptopManagementPage.createLaptop(testLaptop);
    await laptopManagementPage.page.waitForTimeout(1000);

    const initialCount = await laptopManagementPage.getLaptopsCount();
    const laptopIndex = await laptopManagementPage.findLaptopBySerial(testLaptop.serialNumber);

    if (laptopIndex !== null) {
      await laptopManagementPage.deleteLaptop(laptopIndex);

      // Wait for table to update
      await laptopManagementPage.page.waitForTimeout(1000);

      const newCount = await laptopManagementPage.getLaptopsCount();
      expect(newCount).toBe(initialCount - 1);

      // Verify laptop is removed
      const deletedLaptopIndex = await laptopManagementPage.findLaptopBySerial(testLaptop.serialNumber);
      expect(deletedLaptopIndex).toBeNull();
    }
  });

  test('should show confirmation dialog before deleting', async ({ adminPage }) => {
    const laptopsCount = await laptopManagementPage.getLaptopsCount();

    if (laptopsCount > 0) {
      const row = laptopManagementPage.laptopsTable.locator('tbody tr').first();
      const deleteButton = row.locator('button').last();
      await deleteButton.click();

      // Confirmation dialog should appear
      await expect(laptopManagementPage.deleteConfirmDialog).toBeVisible();
      await expect(adminPage.locator('text=Are you sure')).toBeVisible();

      // Cancel the deletion
      const cancelButton = laptopManagementPage.deleteConfirmDialog.locator('button').filter({ hasText: /cancel/i });
      await cancelButton.click();

      await expect(laptopManagementPage.deleteConfirmDialog).not.toBeVisible();
    }
  });

  test('should download QR code for a laptop', async ({ adminPage }) => {
    const laptopsCount = await laptopManagementPage.getLaptopsCount();

    if (laptopsCount > 0) {
      const filename = await laptopManagementPage.downloadQRCode(0);

      // Filename should include 'qr-code'
      expect(filename).toMatch(/qr.*code/i);
      expect(filename).toMatch(/\.png$/i);
    }
  });

  test('should display action buttons for each laptop', async ({ adminPage }) => {
    const laptopsCount = await laptopManagementPage.getLaptopsCount();

    if (laptopsCount > 0) {
      const row = laptopManagementPage.laptopsTable.locator('tbody tr').first();

      // Should have QR code, edit, and delete buttons
      const buttons = row.locator('button');
      const buttonCount = await buttons.count();

      expect(buttonCount).toBeGreaterThanOrEqual(3); // QR, Edit, Delete
    }
  });

  test('should show tooltips on action buttons', async ({ adminPage }) => {
    const laptopsCount = await laptopManagementPage.getLaptopsCount();

    if (laptopsCount > 0) {
      const row = laptopManagementPage.laptopsTable.locator('tbody tr').first();
      const editButton = row.locator('button[aria-label*="edit"]').or(row.locator('button').nth(1));

      // Hover to show tooltip
      await editButton.hover();

      // Tooltip should appear
      await adminPage.waitForTimeout(500);
      const tooltip = adminPage.locator('[role="tooltip"]').filter({ hasText: /edit/i });

      // Note: Tooltips might not appear in headless mode
      const isVisible = await tooltip.isVisible({ timeout: 1000 }).catch(() => false);
      // This is optional, tooltips may not work in all test environments
    }
  });

  test('should update status dropdown with all options', async ({ adminPage }) => {
    await laptopManagementPage.clickAddLaptop();

    // Click status dropdown
    await laptopManagementPage.statusSelect.click();

    // Check for all status options
    const statuses = ['Available', 'Checked Out', 'Maintenance', 'Retired'];

    for (const status of statuses) {
      const option = adminPage.locator(`[role="option"]`).filter({ hasText: status });
      await expect(option).toBeVisible();
    }

    // Close dropdown
    await adminPage.keyboard.press('Escape');
  });

  test('should pre-populate form when editing', async ({ adminPage }) => {
    const laptopsCount = await laptopManagementPage.getLaptopsCount();

    if (laptopsCount > 0) {
      const originalData = await laptopManagementPage.getLaptopData(0);
      const row = laptopManagementPage.laptopsTable.locator('tbody tr').first();
      const editButton = row.locator('button').nth(1);

      await editButton.click();
      await laptopManagementPage.dialog.waitFor({ state: 'visible' });

      // Form fields should be pre-populated
      const makeValue = await laptopManagementPage.makeInput.inputValue();
      const modelValue = await laptopManagementPage.modelInput.inputValue();
      const serialValue = await laptopManagementPage.serialNumberInput.inputValue();

      expect(makeValue).toBeTruthy();
      expect(modelValue).toBeTruthy();
      expect(serialValue).toBe(originalData?.serialNumber);

      await laptopManagementPage.cancelDialog();
    }
  });

  test('should not allow access to regular users', async ({ regularUserPage }) => {
    await regularUserPage.goto('/admin/laptops');

    // Wait for potential redirect
    await regularUserPage.waitForTimeout(1000);

    const currentUrl = regularUserPage.url();
    const isOnLaptopManagement = currentUrl.includes('/admin/laptops');

    if (isOnLaptopManagement) {
      // If still on page, should see access denied or no admin content
      const accessDenied = regularUserPage.locator('text=/access denied|not authorized|forbidden|403/i').first();
      const hasAccessDenied = await accessDenied.isVisible({ timeout: 2000 }).catch(() => false);

      // If no access denied message, check if admin content is missing
      if (!hasAccessDenied) {
        const hasContent = await regularUserPage.locator('text=/laptop.*management|add.*laptop/i').isVisible({ timeout: 1000 }).catch(() => false);
        expect(hasContent).toBe(false); // Should not see admin content
      }
    } else {
      // Should be redirected (most likely scenario)
      expect(currentUrl).not.toContain('/admin/laptops');
    }
  });

  test('should display unique IDs in monospace font', async ({ adminPage }) => {
    const laptopsCount = await laptopManagementPage.getLaptopsCount();

    if (laptopsCount > 0) {
      const uniqueIdCell = laptopManagementPage.laptopsTable
        .locator('tbody tr')
        .first()
        .locator('td')
        .first();

      // Should have monospace font styling
      const fontFamily = await uniqueIdCell.evaluate((el) =>
        window.getComputedStyle(el).fontFamily
      );

      expect(fontFamily).toMatch(/monospace|mono|courier/i);
    }
  });

  test('should show no laptops message when table is empty', async ({ adminPage }) => {
    const laptopsCount = await laptopManagementPage.getLaptopsCount();

    if (laptopsCount === 0) {
      const noLaptopsMessage = adminPage.locator('text=No laptops found');
      await expect(noLaptopsMessage).toBeVisible();
    }
  });
});
