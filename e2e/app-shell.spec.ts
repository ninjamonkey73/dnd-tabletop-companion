import { expect, test } from '@playwright/test';

test.describe('App Shell & Navigation', () => {
  test('should load app with correct title and visible root layout', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/DND Tabletop Companion/i);
    await expect(page.locator('app-header')).toBeVisible();
    await expect(page.locator('.dashboard-grid')).toBeVisible();
  });

  test('should toggle dark mode and persist selection', async ({ page }) => {
    await page.goto('/');

    const body = page.locator('body');
    const themeBtn = page.locator('button[aria-label="Toggle Theme"]');

    // Default to dark theme toggle click
    await themeBtn.click();
    await expect(body).toHaveClass(/dark-theme/);

    // Toggle back to light
    await themeBtn.click();
    await expect(body).not.toHaveClass(/dark-theme/);
  });
});
