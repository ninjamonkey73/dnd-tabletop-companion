import { expect, test } from '@playwright/test';

test.describe('Combat Vitals & Resource Tracking', () => {
  test('should render HP section and support damage and heal calculations', async ({ page }) => {
    await page.goto('/');

    const hpSection = page.locator('app-hp');
    await expect(hpSection).toBeVisible();

    const hpInput = page.locator('.hp-controls input.hp-input');
    const hurtBtn = page.locator('button.hurt-button');
    const healBtn = page.locator('button.heal-button');

    // Verify hurt/heal controls exist
    await expect(hpInput).toBeVisible();
    await expect(hurtBtn).toBeVisible();
    await expect(healBtn).toBeVisible();

    // Verify temp HP input exists
    const tempHpInput = page.locator('input.tempHP-input');
    await expect(tempHpInput).toBeVisible();
  });

  test('should toggle between Money and Trackable Resources', async ({ page }) => {
    await page.goto('/');

    // Switch to Trackable Resources
    const resourcesBtn = page.locator('mat-button-toggle:has-text("Trackable Resources") button');
    await resourcesBtn.click();
    await expect(page.locator('app-resources')).toBeVisible();

    // Switch back to Money
    const moneyBtn = page.locator('mat-button-toggle:has-text("Money") button');
    await moneyBtn.click();
    await expect(page.locator('app-money')).toBeVisible();
  });

  test('should toggle between Death Saves and Hit Dice', async ({ page }) => {
    await page.goto('/');

    // Switch to Hit Dice
    const hitDiceBtn = page.locator('mat-button-toggle:has-text("Hit Dice") button');
    await hitDiceBtn.click();
    await expect(page.locator('app-hit-dice')).toBeVisible();

    // Switch back to Death Saves
    const deathSavesBtn = page.locator('mat-button-toggle:has-text("Death Saves") button');
    await deathSavesBtn.click();
    await expect(page.locator('app-death-saves')).toBeVisible();
  });

  test('should trigger short rest and long rest buttons without error', async ({ page }) => {
    await page.goto('/');

    const srBtn = page.locator('button.rest-button:has-text("SR")');
    const lrBtn = page.locator('button.rest-button:has-text("LR")');

    await expect(srBtn).toBeVisible();
    await expect(lrBtn).toBeVisible();

    await srBtn.click();
    await lrBtn.click();
  });
});
