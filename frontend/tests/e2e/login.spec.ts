import { expect, test } from '@playwright/test';
import { signInAsDevAdmin } from './helpers/auth';

test('login exposes named controls and meaningful footer outcomes', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('button', { name: 'Log in with Email' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create New Account' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Forgot Password?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Need Help?' })).toBeVisible();

  await page.getByRole('link', { name: 'Forgot Password?' }).click();
  await expect(page.getByRole('alert')).toContainText('Password reset is not available in-app yet.');

  await page.getByRole('link', { name: 'Need Help?' }).click();
  await expect(page.getByRole('alert')).toContainText('In-app support is not available yet.');
});

test('development auth fixture reaches protected home and survives reload', async ({ page }) => {
  await signInAsDevAdmin(page);
  await page.reload();
  await expect(page).toHaveURL(/\/home/);
  await expect(page.getByText('Quick Actions')).toBeVisible();
});
