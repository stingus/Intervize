import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for User Management Page
 */
export class UserManagementPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly addUserButton: Locator;
  readonly usersTable: Locator;
  readonly dialog: Locator;
  readonly dialogTitle: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly roleSelect: Locator;
  readonly groupInput: Locator;
  readonly teamInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly deleteConfirmDialog: Locator;
  readonly confirmDeleteButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h4').filter({ hasText: /user management/i });
    this.addUserButton = page.locator('button').filter({ hasText: /add user/i });
    this.usersTable = page.locator('table');
    this.dialog = page.locator('[role="dialog"]');
    this.dialogTitle = this.dialog.locator('h2');
    this.nameInput = this.dialog.locator('input[name="name"]').or(this.dialog.getByLabel(/name/i));
    this.emailInput = this.dialog.locator('input[name="email"]').or(this.dialog.getByLabel(/email/i));
    this.passwordInput = this.dialog.locator('input[name="password"], input[type="password"]').or(this.dialog.getByLabel(/password/i));
    // For MUI Select, use role="combobox"
    this.roleSelect = this.dialog.locator('[role="combobox"]').or(this.dialog.locator('div.MuiSelect-select'));
    this.groupInput = this.dialog.locator('input[name="groupName"], input[name="group"]').or(this.dialog.getByLabel(/group/i));
    this.teamInput = this.dialog.locator('input[name="team"]').or(this.dialog.getByLabel(/team/i));
    this.saveButton = this.dialog.locator('button[type="submit"]').or(
      this.dialog.locator('button').filter({ hasText: /create|update|save/i })
    );
    this.cancelButton = this.dialog.locator('button').filter({ hasText: /cancel/i });
    this.deleteConfirmDialog = page.locator('[role="dialog"]').filter({ hasText: /confirm delete/i });
    this.confirmDeleteButton = this.deleteConfirmDialog.locator('button').filter({ hasText: /delete/i });
    this.errorAlert = page.locator('[role="alert"]').filter({ hasText: /error|failed/i });
  }

  /**
   * Navigate to the user management page
   */
  async goto() {
    await this.page.goto('/admin/users');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get total number of users in the table
   */
  async getUsersCount(): Promise<number> {
    const rows = await this.usersTable.locator('tbody tr').count();
    // Check if there's a "no users" message
    const noUsersMessage = this.page.locator('text=No users found');
    if (await noUsersMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
      return 0;
    }
    return rows;
  }

  /**
   * Click add user button to open dialog
   */
  async clickAddUser() {
    await this.addUserButton.click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  /**
   * Fill in user form
   */
  async fillUserForm(data: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    group?: string;
    team?: string;
  }) {
    await this.nameInput.first().fill(data.name);
    await this.emailInput.first().fill(data.email);

    if (data.password) {
      await this.passwordInput.first().fill(data.password);
    }

    if (data.role) {
      await this.roleSelect.first().click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`[role="option"]`).filter({ hasText: new RegExp(data.role, 'i') }).click();
    }

    if (data.group && await this.groupInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.groupInput.first().fill(data.group);
    }

    if (data.team && await this.teamInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.teamInput.first().fill(data.team);
    }
  }

  /**
   * Submit the user form
   */
  async submitForm() {
    await this.saveButton.click();
    await this.dialog.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Create a new user
   */
  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    group?: string;
    team?: string;
  }) {
    await this.clickAddUser();
    await this.fillUserForm(data);
    await this.submitForm();
  }

  /**
   * Edit a user by row index
   */
  async editUser(rowIndex: number, data: Partial<{
    name: string;
    email: string;
    role: string;
    group: string;
    team: string;
  }>) {
    const row = this.usersTable.locator('tbody tr').nth(rowIndex);
    const editButton = row.locator('button[aria-label*="edit"], button').filter({ has: this.page.locator('svg') }).nth(0);
    await editButton.click();
    await this.dialog.waitFor({ state: 'visible' });

    if (data.name) await this.nameInput.first().fill(data.name);
    if (data.email) await this.emailInput.first().fill(data.email);
    if (data.role) {
      await this.roleSelect.first().click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`[role="option"]`).filter({ hasText: new RegExp(data.role, 'i') }).click();
    }
    if (data.group && await this.groupInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.groupInput.first().fill(data.group);
    }
    if (data.team && await this.teamInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.teamInput.first().fill(data.team);
    }

    await this.submitForm();
  }

  /**
   * Delete a user by row index
   */
  async deleteUser(rowIndex: number) {
    const row = this.usersTable.locator('tbody tr').nth(rowIndex);
    const deleteButton = row.locator('button[aria-label*="delete"], button').filter({ has: this.page.locator('svg') }).last();
    await deleteButton.click();
    await this.deleteConfirmDialog.waitFor({ state: 'visible' });
    await this.confirmDeleteButton.click();
    await this.deleteConfirmDialog.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Get user data from table row
   */
  async getUserData(rowIndex: number): Promise<{
    name: string;
    email: string;
    role: string;
    group: string;
  } | null> {
    const row = this.usersTable.locator('tbody tr').nth(rowIndex);
    if (!(await row.isVisible({ timeout: 1000 }).catch(() => false))) {
      return null;
    }

    const cells = row.locator('td');
    return {
      name: (await cells.nth(0).textContent()) || '',
      email: (await cells.nth(1).textContent()) || '',
      role: (await cells.nth(2).textContent()) || '',
      group: (await cells.nth(3).textContent()) || '',
    };
  }

  /**
   * Search for a user by email
   */
  async findUserByEmail(email: string): Promise<number | null> {
    const count = await this.getUsersCount();
    for (let i = 0; i < count; i++) {
      const data = await this.getUserData(i);
      if (data?.email === email) {
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

  /**
   * Get error message if present
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.errorAlert.isVisible({ timeout: 2000 }).catch(() => false)) {
      return await this.errorAlert.textContent();
    }
    return null;
  }
}
