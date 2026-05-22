import { expect, type Page } from '@playwright/test';

export async function signInAsDevAdmin(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const homeHeading = page.getByText('Quick Actions');
  if (await homeHeading.isVisible().catch(() => false)) {
    return;
  }

  await page.getByRole('button', { name: /enter as admin/i }).click();
  await expect(page).toHaveURL(/\/home/);
  await expect(homeHeading).toBeVisible();
}
