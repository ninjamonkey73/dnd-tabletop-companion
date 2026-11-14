import { expect, test } from '@playwright/test';

test.describe('Character Management & Multiclassing Repeater', () => {
  test('should open, cancel, and create new character form', async ({ page }) => {
    await page.goto('/');

    // 1. Form opens automatically on initial load when no character exists
    const newCharForm = page.locator('app-new-character');
    await expect(newCharForm).toBeVisible();

    // 2. Cancel closes the form
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(newCharForm).toBeHidden();

    // 3. Focus the combobox and open the dropdown via keyboard (reliable across M3 overlays)
    const charSelect = page.getByRole('combobox', { name: 'Character Name' });
    await expect(charSelect).toBeEnabled();
    await charSelect.focus();
    await charSelect.press('Space');

    // 4. Select "New Character" from the opened listbox
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await listbox.getByRole('option', { name: 'New Character' }).click();

    await expect(newCharForm).toBeVisible();
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
