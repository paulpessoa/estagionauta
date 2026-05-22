// tests/login.spec.ts
import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

test('User login flow', async ({ page }) => {
  // 1. Navigate to the login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Verify elements are visible
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();

  // 2. Fill login form
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables must be set in .env.test');
  }

  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);

  // 3. Submit the form
  await page.locator('button[type="submit"]').click();

  // 4. Wait for redirect to root URL (successful login)
  await page.waitForURL('**/', { timeout: 15_000 });

  // 5. Verify user is logged in
  // In Header.tsx, logged in users have an avatar dropdown button
  // Let's locate the avatar button. In Header.tsx:
  // <Button variant="ghost" className="relative h-8 w-8 rounded-full">
  // We can search for the avatar component or the button containing the avatar fallback.
  const avatarButton = page.locator('button.rounded-full').filter({ has: page.locator('.rounded-full') });
  await expect(avatarButton).toBeVisible({ timeout: 15_000 });

  // Click avatar to open menu and verify menu options
  await avatarButton.click();
  await expect(page.locator('text=Dashboard')).toBeVisible();
  await expect(page.locator('text=Sair')).toBeVisible();
});
