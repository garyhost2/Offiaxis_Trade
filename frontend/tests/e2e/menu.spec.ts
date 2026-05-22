import { expect, test } from '@playwright/test';
import { signInAsDevAdmin } from './helpers/auth';

test('menu disabled rows are visible but not active buttons', async ({ page }) => {
  await signInAsDevAdmin(page);
  await page.goto('/menu', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('button', { name: 'Schedules' })).toBeVisible();
  await expect(page.getByText('OffiAxis Spaces')).toBeVisible();
  await expect(page.getByText('Users and Roles')).toBeVisible();
  await expect(page.getByRole('button', { name: 'OffiAxis Spaces' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Users and Roles' })).toHaveCount(0);
});
