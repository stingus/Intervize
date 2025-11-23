import { test, expect } from '../fixtures/auth.fixture';
import { UserManagementPage } from '../pages/admin/UserManagementPage';

test.describe('Admin - User Management', () => {
  let userManagementPage: UserManagementPage;

  test.beforeEach(async ({ adminPage }) => {
    userManagementPage = new UserManagementPage(adminPage);
    await userManagementPage.goto();
  });

  test('should display user management page correctly', async () => {
    await expect(userManagementPage.pageTitle).toBeVisible();
    await expect(userManagementPage.pageTitle).toContainText('User Management');
    await expect(userManagementPage.addUserButton).toBeVisible();
    await expect(userManagementPage.usersTable).toBeVisible();
  });

  test('should display users table with correct columns', async ({ adminPage }) => {
    const tableHeaders = ['Name', 'Email', 'Role', 'Group', 'Actions'];

    for (const header of tableHeaders) {
      const headerCell = adminPage.locator('th').filter({ hasText: new RegExp(header, 'i') });
      await expect(headerCell).toBeVisible();
    }
  });

  test('should display existing users from seed data', async () => {
    const usersCount = await userManagementPage.getUsersCount();

    // Should have at least the seed data users (admin and regular user)
    expect(usersCount).toBeGreaterThanOrEqual(2);
  });

  test('should show admin user in the table', async ({ adminPage }) => {
    const adminIndex = await userManagementPage.findUserByEmail('admin@example.com');
    expect(adminIndex).not.toBeNull();

    if (adminIndex !== null) {
      const userData = await userManagementPage.getUserData(adminIndex);
      expect(userData?.role).toMatch(/admin/i);
    }
  });

  test('should show regular user in the table', async () => {
    const userIndex = await userManagementPage.findUserByEmail('user@example.com');
    expect(userIndex).not.toBeNull();

    if (userIndex !== null) {
      const userData = await userManagementPage.getUserData(userIndex);
      expect(userData?.role).toMatch(/interviewer/i);
    }
  });

  test('should open add user dialog when clicking add button', async () => {
    await userManagementPage.clickAddUser();

    await expect(userManagementPage.dialog).toBeVisible();
    await expect(userManagementPage.dialogTitle).toContainText('Add');
    await expect(userManagementPage.nameInput).toBeVisible();
    await expect(userManagementPage.emailInput).toBeVisible();
    await expect(userManagementPage.passwordInput).toBeVisible();
    await expect(userManagementPage.roleSelect).toBeVisible();
  });

  test('should close dialog when clicking cancel', async () => {
    await userManagementPage.clickAddUser();
    await expect(userManagementPage.dialog).toBeVisible();

    await userManagementPage.cancelDialog();
    await expect(userManagementPage.dialog).not.toBeVisible();
  });

  test('should create a new user successfully', async () => {
    const initialCount = await userManagementPage.getUsersCount();

    const testUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'TestPass123!',
      role: 'Interviewer',
      group: 'Engineering',
      team: 'QA',
    };

    await userManagementPage.createUser(testUser);

    // Wait for table to update
    await userManagementPage.page.waitForTimeout(1000);

    const newCount = await userManagementPage.getUsersCount();
    expect(newCount).toBe(initialCount + 1);

    // Verify the user appears in the table
    const userIndex = await userManagementPage.findUserByEmail(testUser.email);
    expect(userIndex).not.toBeNull();
  });

  test('should validate required fields when creating user', async ({ adminPage }) => {
    await userManagementPage.clickAddUser();

    // Try to submit without filling fields
    await userManagementPage.saveButton.click();

    // Should show validation errors
    const errorMessages = adminPage.locator('text=required, text=is required').first();
    await expect(errorMessages).toBeVisible({ timeout: 2000 });
  });

  test('should validate email format', async ({ adminPage }) => {
    await userManagementPage.clickAddUser();

    await userManagementPage.nameInput.fill('Test User');
    await userManagementPage.emailInput.fill('invalid-email');
    await userManagementPage.passwordInput.fill('TestPass123!');

    await userManagementPage.saveButton.click();

    // Should show email validation error
    const emailError = adminPage.locator('text=Invalid email, text=valid email').first();
    await expect(emailError).toBeVisible({ timeout: 2000 });
  });

  test('should edit an existing user', async () => {
    const usersCount = await userManagementPage.getUsersCount();

    if (usersCount > 0) {
      // Find a non-admin user to edit (don't edit the current admin)
      const userIndex = await userManagementPage.findUserByEmail('user@example.com');

      if (userIndex !== null) {
        const updatedName = `Updated User ${Date.now()}`;
        await userManagementPage.editUser(userIndex, {
          name: updatedName,
        });

        // Wait for table to update
        await userManagementPage.page.waitForTimeout(1000);

        const updatedData = await userManagementPage.getUserData(userIndex);
        expect(updatedData?.email).toBe('user@example.com'); // Email should remain same
      }
    }
  });

  test('should delete a user with confirmation', async () => {
    // First create a test user to delete
    const testUser = {
      name: 'Delete Test User',
      email: `delete${Date.now()}@example.com`,
      password: 'TestPass123!',
      role: 'Interviewer',
    };

    await userManagementPage.createUser(testUser);
    await userManagementPage.page.waitForTimeout(1000);

    const initialCount = await userManagementPage.getUsersCount();
    const userIndex = await userManagementPage.findUserByEmail(testUser.email);

    if (userIndex !== null) {
      await userManagementPage.deleteUser(userIndex);

      // Wait for table to update
      await userManagementPage.page.waitForTimeout(1000);

      const newCount = await userManagementPage.getUsersCount();
      expect(newCount).toBe(initialCount - 1);

      // Verify user is removed
      const deletedUserIndex = await userManagementPage.findUserByEmail(testUser.email);
      expect(deletedUserIndex).toBeNull();
    }
  });

  test('should show confirmation dialog before deleting', async ({ adminPage }) => {
    const usersCount = await userManagementPage.getUsersCount();

    if (usersCount > 1) {
      // Don't delete the first user (might be current admin)
      const row = userManagementPage.usersTable.locator('tbody tr').nth(1);
      const deleteButton = row.locator('button').last();
      await deleteButton.click();

      // Confirmation dialog should appear
      await expect(userManagementPage.deleteConfirmDialog).toBeVisible();
      await expect(adminPage.locator('text=Are you sure')).toBeVisible();

      // Cancel the deletion
      const cancelButton = userManagementPage.deleteConfirmDialog.locator('button').filter({ hasText: /cancel/i });
      await cancelButton.click();

      await expect(userManagementPage.deleteConfirmDialog).not.toBeVisible();
    }
  });

  test('should display action buttons for each user', async ({ adminPage }) => {
    const usersCount = await userManagementPage.getUsersCount();

    if (usersCount > 0) {
      const row = userManagementPage.usersTable.locator('tbody tr').first();

      // Should have edit and delete buttons
      const buttons = row.locator('button');
      const buttonCount = await buttons.count();

      expect(buttonCount).toBeGreaterThanOrEqual(2); // Edit, Delete
    }
  });

  test('should show role chips with appropriate styling', async ({ adminPage }) => {
    const usersCount = await userManagementPage.getUsersCount();

    if (usersCount > 0) {
      const roleCell = userManagementPage.usersTable
        .locator('tbody tr')
        .first()
        .locator('td')
        .nth(2);

      const roleText = await roleCell.textContent();
      expect(roleText).toMatch(/admin|interviewer/i);
    }
  });

  test('should show role options in dropdown', async ({ adminPage }) => {
    await userManagementPage.clickAddUser();

    // Click role dropdown
    await userManagementPage.roleSelect.click();

    // Check for role options
    const roles = ['Admin', 'Interviewer'];

    for (const role of roles) {
      const option = adminPage.locator(`[role="option"]`).filter({ hasText: role });
      await expect(option).toBeVisible();
    }

    // Close dropdown
    await adminPage.keyboard.press('Escape');
  });

  test('should pre-populate form when editing (except password)', async ({ adminPage }) => {
    const usersCount = await userManagementPage.getUsersCount();

    if (usersCount > 0) {
      const originalData = await userManagementPage.getUserData(0);
      const row = userManagementPage.usersTable.locator('tbody tr').first();
      const editButton = row.locator('button').first();

      await editButton.click();
      await userManagementPage.dialog.waitFor({ state: 'visible' });

      // Form fields should be pre-populated
      const nameValue = await userManagementPage.nameInput.inputValue();
      const emailValue = await userManagementPage.emailInput.inputValue();

      expect(nameValue).toBe(originalData?.name);
      expect(emailValue).toBe(originalData?.email);

      // Password field should be empty (security)
      const passwordValue = await userManagementPage.passwordInput.inputValue();
      expect(passwordValue).toBe('');

      await userManagementPage.cancelDialog();
    }
  });

  test('should not require password when editing existing user', async ({ adminPage }) => {
    const usersCount = await userManagementPage.getUsersCount();

    if (usersCount > 0) {
      const row = userManagementPage.usersTable.locator('tbody tr').first();
      const editButton = row.locator('button').first();

      await editButton.click();
      await userManagementPage.dialog.waitFor({ state: 'visible' });

      // Update just the name
      await userManagementPage.nameInput.fill('Updated Name');

      // Should be able to save without entering password
      await userManagementPage.saveButton.click();

      // Dialog should close successfully
      await expect(userManagementPage.dialog).not.toBeVisible({ timeout: 10000 });
    }
  });

  test('should display user data correctly in table', async () => {
    const usersCount = await userManagementPage.getUsersCount();

    if (usersCount > 0) {
      const userData = await userManagementPage.getUserData(0);

      expect(userData).not.toBeNull();
      expect(userData?.name).toBeTruthy();
      expect(userData?.email).toBeTruthy();
      expect(userData?.role).toBeTruthy();
    }
  });

  test('should not allow duplicate emails', async ({ adminPage }) => {
    const testUser = {
      name: 'Duplicate Test',
      email: 'admin@example.com', // Email that already exists
      password: 'TestPass123!',
      role: 'Interviewer',
    };

    await userManagementPage.clickAddUser();
    await userManagementPage.fillUserForm(testUser);
    await userManagementPage.saveButton.click();

    // Should show error message
    const errorMessage = await userManagementPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
    expect(errorMessage).toMatch(/exists|duplicate|already/i);
  });

  test('should not allow access to regular users', async ({ regularUserPage }) => {
    await regularUserPage.goto('/admin/users');

    const currentUrl = regularUserPage.url();
    const isOnUserManagement = currentUrl.includes('/admin/users');

    if (isOnUserManagement) {
      // If still on page, should see access denied
      const accessDenied = regularUserPage.locator('text=Access denied, text=Not authorized, text=403').first();
      await expect(accessDenied).toBeVisible({ timeout: 5000 });
    } else {
      // Should be redirected
      expect(currentUrl).not.toContain('/admin/users');
    }
  });

  test('should show no users message when table is empty', async ({ adminPage }) => {
    const usersCount = await userManagementPage.getUsersCount();

    if (usersCount === 0) {
      const noUsersMessage = adminPage.locator('text=No users found');
      await expect(noUsersMessage).toBeVisible();
    }
  });

  test('should show group and team information if provided', async () => {
    const adminIndex = await userManagementPage.findUserByEmail('admin@example.com');

    if (adminIndex !== null) {
      const userData = await userManagementPage.getUserData(adminIndex);
      expect(userData?.group).toBeTruthy();
    }
  });

  test('should handle long user names gracefully', async () => {
    const longNameUser = {
      name: 'This Is A Very Long User Name That Should Be Handled Properly In The Table',
      email: `longname${Date.now()}@example.com`,
      password: 'TestPass123!',
      role: 'Interviewer',
    };

    await userManagementPage.createUser(longNameUser);
    await userManagementPage.page.waitForTimeout(1000);

    const userIndex = await userManagementPage.findUserByEmail(longNameUser.email);
    expect(userIndex).not.toBeNull();

    if (userIndex !== null) {
      const userData = await userManagementPage.getUserData(userIndex);
      expect(userData?.name).toContain('Very Long User Name');
    }
  });
});
