import { expect, test } from '@playwright/test';

test.describe('D&D Tabletop Companion E2E', () => {
  test('should load the page with title and render core vitals', async ({ page }) => {
    await page.goto('/');

    // Validate page title
    await expect(page).toHaveTitle(/DND Tabletop Companion/i);

    // Validate header and core vitals components exist
    const header = page.locator('app-header');
    await expect(header).toBeVisible();

    const hpComponent = page.locator('app-hp');
    await expect(hpComponent).toBeVisible();

    // Check presence of theme toggle button
    const themeBtn = page.locator('button[aria-label="Toggle Theme"]');
    await expect(themeBtn).toBeVisible();
  });

  test('should toggle dark mode theme', async ({ page }) => {
    await page.goto('/');

    const body = page.locator('body');
    const themeBtn = page.locator('button[aria-label="Toggle Theme"]');

    // Click theme toggle
    await themeBtn.click();
    await expect(body).toHaveClass(/dark-theme/);

    // Click back to light mode
    await themeBtn.click();
    await expect(body).not.toHaveClass(/dark-theme/);
  });

  test('should expand and collapse class repeater in header', async ({ page }) => {
    await page.goto('/');

    // Summary bar in header
    const summaryBar = page.locator('.summary-bar');
    await expect(summaryBar).toBeVisible();

    // Expand classes repeater
    await summaryBar.click();
    const expandedBody = page.locator('.repeater-expanded-body');
    await expect(expandedBody).toBeVisible();

    // Verify Add Class button exists
    const addClassBtn = page.locator('button.add-class-btn');
    await expect(addClassBtn).toBeVisible();

    // Collapse
    await summaryBar.click();
    await expect(expandedBody).not.toBeVisible();
  });

  test('should switch panels with button toggle groups', async ({ page }) => {
    await page.goto('/');

    // Panel 1: Money vs Trackable Resources
    const resourcesToggle = page.locator('mat-button-toggle:has-text("Trackable Resources") button');
    await resourcesToggle.click();
    await expect(page.locator('app-resources')).toBeVisible();

    const moneyToggle = page.locator('mat-button-toggle:has-text("Money") button');
    await moneyToggle.click();
    await expect(page.locator('app-money')).toBeVisible();

    // Panel 2: Death Saves vs Hit Dice
    const hitDiceToggle = page.locator('mat-button-toggle:has-text("Hit Dice") button');
    await hitDiceToggle.click();
    await expect(page.locator('app-hit-dice')).toBeVisible();

    const deathSavesToggle = page.locator('mat-button-toggle:has-text("Death Saves") button');
    await deathSavesToggle.click();
    await expect(page.locator('app-death-saves')).toBeVisible();
  });
});
