import { expect, test } from '@playwright/test';

test.describe('Character Management & Multiclassing Repeater', () => {
  test('should open, cancel, and create new character form', async ({ page }) => {
    await page.goto('/');

    // Open character dropdown
    const charSelect = page.locator('.char-select-container mat-select');
    await charSelect.click();

    // Click "New Character" option
    const newCharOption = page.locator('mat-option.create-new-option');
    await newCharOption.click();

    // Verify app-new-character component is rendered
    const newCharForm = page.locator('app-new-character');
    await expect(newCharForm).toBeVisible();

    // Test cancel
    const cancelBtn = page.locator('button.cancel-button');
    await cancelBtn.click();
    await expect(newCharForm).not.toBeVisible();
  });

  test('should expand and collapse class repeater and interact with class rows', async ({ page }) => {
    await page.goto('/');

    const summaryBar = page.locator('.summary-bar');
    await expect(summaryBar).toBeVisible();

    // Click to expand
    await summaryBar.click();
    const expandedBody = page.locator('.repeater-expanded-body');
    await expect(expandedBody).toBeVisible();

    // Check presence of at least 1 class row with level input
    const rows = page.locator('.repeater-row');
    await expect(rows.first()).toBeVisible();

    const addClassBtn = page.locator('button.add-class-btn');
    await expect(addClassBtn).toBeVisible();

    // Click to collapse
    await summaryBar.click();
    await expect(expandedBody).not.toBeVisible();
  });
});
