
const { test, expect } = require('@playwright/test');

test('Admin can open and view the court creation modal', async ({ page }) => {
  try {
    // Navigate to the login page
    await page.goto('http://localhost:5173/login');

    // Fill in the login form with the new credentials
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');

    // Click the login button
    await page.click('button[type="submit"]');

    // Wait for navigation to the admin dashboard
    await expect(page).toHaveURL('http://localhost:5173/admin/dashboard', { timeout: 5000 });
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Navigate to the courts management page
    await page.goto('http://localhost:5173/admin/courts');

    // Wait for the courts page to load
    await expect(page.locator('h1')).toContainText('Gestión de Canchas');

    // Click the "Crear Cancha" button to open the modal
    await page.click('button:has-text("Crear Cancha")');

    // Wait for the modal to appear
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();

    // Check the modal title
    await expect(modal.locator('h2')).toHaveText('Crear Nueva Cancha');

    // Take a screenshot of the modal for verification
    await modal.screenshot({ path: 'jules-scratch/verification/court-form-modal.png' });
  } catch (error) {
    // If any step fails, take a screenshot for debugging
    await page.screenshot({ path: 'jules-scratch/verification/login-failure.png' });
    // Re-throw the error to ensure the test still fails
    throw error;
  }
});
