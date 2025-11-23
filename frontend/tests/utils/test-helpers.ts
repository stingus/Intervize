import { Page } from '@playwright/test';

/**
 * Test helper utilities for common test operations
 */

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Clear all browser storage
 */
export async function clearAllStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
  });
}

/**
 * Get localStorage item
 */
export async function getLocalStorageItem(page: Page, key: string): Promise<string | null> {
  return await page.evaluate((key) => localStorage.getItem(key), key);
}

/**
 * Set localStorage item
 */
export async function setLocalStorageItem(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, value),
    { key, value }
  );
}

/**
 * Wait for element to be visible with custom timeout
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout = 10000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Take screenshot with custom name
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  options?: { fullPage?: boolean }
): Promise<void> {
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: options?.fullPage ?? false,
  });
}

/**
 * Wait for text to appear on page
 */
export async function waitForText(
  page: Page,
  text: string | RegExp,
  timeout = 10000
): Promise<void> {
  await page.waitForSelector(`text=${typeof text === 'string' ? text : text.source}`, {
    timeout,
  });
}

/**
 * Fill form with data
 */
export async function fillForm(
  page: Page,
  formData: Record<string, string>
): Promise<void> {
  for (const [name, value] of Object.entries(formData)) {
    const input = page.locator(`input[name="${name}"], textarea[name="${name}"]`);
    await input.fill(value);
  }
}

/**
 * Get table data as array of objects
 */
export async function getTableData(page: Page, tableSelector = 'table'): Promise<any[]> {
  return await page.evaluate((selector) => {
    const table = document.querySelector(selector);
    if (!table) return [];

    const headers: string[] = [];
    const headerCells = table.querySelectorAll('thead th');
    headerCells.forEach((cell) => headers.push(cell.textContent?.trim() || ''));

    const rows: any[] = [];
    const bodyRows = table.querySelectorAll('tbody tr');

    bodyRows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      const rowData: any = {};

      cells.forEach((cell, index) => {
        rowData[headers[index] || `column${index}`] = cell.textContent?.trim() || '';
      });

      rows.push(rowData);
    });

    return rows;
  }, tableSelector);
}

/**
 * Wait for API response
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000
): Promise<any> {
  const response = await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );

  return await response.json().catch(() => null);
}

/**
 * Intercept and mock API response
 */
export async function mockAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  responseData: any,
  status = 200
): Promise<void> {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });
}

/**
 * Get computed style of element
 */
export async function getComputedStyle(
  page: Page,
  selector: string,
  property: string
): Promise<string> {
  return await page.evaluate(
    ({ selector, property }) => {
      const element = document.querySelector(selector);
      if (!element) return '';
      return window.getComputedStyle(element).getPropertyValue(property);
    },
    { selector, property }
  );
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string): Promise<void> {
  await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, selector);
}

/**
 * Wait for download to complete
 */
export async function waitForDownload(
  page: Page,
  triggerAction: () => Promise<void>
): Promise<string> {
  const downloadPromise = page.waitForEvent('download');
  await triggerAction();
  const download = await downloadPromise;
  return download.suggestedFilename();
}

/**
 * Generate random test data
 */
export const generateTestData = {
  email: () => `test${Date.now()}${Math.random().toString(36).substring(7)}@example.com`,
  serialNumber: () => `SN${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
  uniqueId: () => `LAP-TEST-${Date.now()}`,
  name: () => `Test User ${Date.now()}`,
  password: () => 'TestPass123!',
};

/**
 * Retry action until success or timeout
 */
export async function retryUntil<T>(
  action: () => Promise<T>,
  condition: (result: T) => boolean,
  maxAttempts = 5,
  delayMs = 1000
): Promise<T> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await action();
    if (condition(result)) {
      return result;
    }
    if (i < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(`Retry failed after ${maxAttempts} attempts`);
}

/**
 * Format date for comparison
 */
export function formatDateForTest(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Make authenticated API request
 */
export async function makeAuthenticatedRequest(
  page: Page,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: any
): Promise<any> {
  const token = await getLocalStorageItem(page, 'auth_token');

  return await page.evaluate(
    async ({ method, endpoint, body, token }) => {
      const response = await fetch(`http://localhost:3000/api/v1${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Request failed');
      }

      return await response.json();
    },
    { method, endpoint, body, token }
  );
}

/**
 * Get checkout status for a laptop
 */
export async function getCheckoutStatus(
  page: Page,
  laptopUniqueId: string
): Promise<any> {
  return await makeAuthenticatedRequest(page, 'GET', `/checkouts/status/${laptopUniqueId}`);
}

/**
 * Get current user's active checkout
 */
export async function getCurrentCheckout(page: Page): Promise<any> {
  try {
    return await makeAuthenticatedRequest(page, 'GET', '/checkouts/my-current');
  } catch (error: any) {
    if (error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Checkout a laptop via API
 */
export async function checkoutLaptop(
  page: Page,
  laptopUniqueId: string,
  userId: string
): Promise<any> {
  return await makeAuthenticatedRequest(page, 'POST', '/checkouts/checkout', {
    laptopUniqueId,
    userId,
  });
}

/**
 * Checkin a laptop via API
 */
export async function checkinLaptop(page: Page, laptopUniqueId: string): Promise<any> {
  return await makeAuthenticatedRequest(page, 'POST', '/checkouts/checkin', {
    laptopUniqueId,
  });
}

/**
 * Report laptop as lost via API
 */
export async function reportLaptopLost(page: Page, laptopUniqueId: string): Promise<any> {
  return await makeAuthenticatedRequest(page, 'POST', '/checkouts/report-lost', {
    laptopUniqueId,
  });
}

/**
 * Report laptop as found via API
 */
export async function reportLaptopFound(
  page: Page,
  laptopUniqueId: string,
  finderUserId: string
): Promise<any> {
  return await makeAuthenticatedRequest(page, 'POST', '/checkouts/report-found', {
    laptopUniqueId,
    finderUserId,
  });
}

/**
 * Create a test laptop via API
 */
export async function createTestLaptop(
  page: Page,
  laptopData?: {
    uniqueId?: string;
    serialNumber?: string;
    make?: string;
    model?: string;
  }
): Promise<any> {
  const defaultData = {
    uniqueId: generateTestData.uniqueId(),
    serialNumber: generateTestData.serialNumber(),
    make: 'Dell',
    model: 'Latitude 5420',
    status: 'available',
    ...laptopData,
  };

  return await makeAuthenticatedRequest(page, 'POST', '/laptops', defaultData);
}

/**
 * Get all active checkouts
 */
export async function getActiveCheckouts(page: Page): Promise<any[]> {
  const response = await makeAuthenticatedRequest(page, 'GET', '/checkouts/active');
  return response.data || [];
}

/**
 * Login as a specific user and return user info
 */
export async function loginAndGetUserInfo(
  page: Page,
  email: string,
  password: string
): Promise<{ userId: string; email: string; name: string }> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 10000,
  });

  // Get user info from localStorage or API
  const userJson = await getLocalStorageItem(page, 'user');
  if (userJson) {
    const user = JSON.parse(userJson);
    return {
      userId: user.id,
      email: user.email,
      name: user.name || user.email,
    };
  }

  // Fallback: get from API
  const response = await makeAuthenticatedRequest(page, 'GET', '/users/me');
  return {
    userId: response.data.id,
    email: response.data.email,
    name: response.data.name || response.data.email,
  };
}
