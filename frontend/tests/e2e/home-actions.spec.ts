import { expect, test } from '@playwright/test';
import { signInAsDevAdmin } from './helpers/auth';

test('home quick actions have concrete outcomes', async ({ page }) => {
  await signInAsDevAdmin(page);

  await page.getByRole('button', { name: 'Upload File' }).click();
  await expect(page.getByRole('alert')).toContainText('Document upload is not available yet.');

  await page.getByRole('button', { name: 'Receipts' }).click();
  await expect(page.getByText('Add Receipt')).toBeVisible();
  await page.getByText('Cancel').click();

  await page.getByRole('button', { name: 'Clock In/Out' }).click();
  await expect(page).toHaveURL(/\/tracker/);

  await page.goto('/home', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Quick Actions')).toBeVisible();
  await page.getByRole('button', { name: 'Inventory Scanner' }).click();
  await expect(page).toHaveURL(/\/inventory/);
});
